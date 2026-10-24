
import json
from datetime import date, datetime

from django.contrib.auth import get_user_model
from django.core.exceptions import FieldDoesNotExist, ValidationError
from django.db import IntegrityError, transaction
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from patients.models import Patient
from .models import PhysioReferral, Physician


User = get_user_model()


# ---------------------------------------------------------
# Common helpers
# ---------------------------------------------------------

def _json_body(request):
    """Read JSON request data, or ordinary form data."""
    if request.content_type and "application/json" in request.content_type:
        try:
            data = json.loads(request.body or b"{}")
        except (json.JSONDecodeError, UnicodeDecodeError):
            raise ValueError("Invalid JSON request body.")

        if not isinstance(data, dict):
            raise ValueError("The request body must be a JSON object.")

        return data

    return request.POST.dict()


def _has_field(model, field_name):
    try:
        model._meta.get_field(field_name)
        return True
    except FieldDoesNotExist:
        return False


def _display_name(user):
    if not user:
        return ""

    # Use a custom display name if the User model has one.
    for field_name in ("display_name", "full_name", "name"):
        value = getattr(user, field_name, None)
        if value:
            return str(value)

    get_full_name = getattr(user, "get_full_name", None)
    if callable(get_full_name):
        value = get_full_name()
        if value:
            return value

    return (
        getattr(user, "username", None)
        or getattr(user, "email", None)
        or str(user.pk)
    )


def _related_object_name(obj):
    if not obj:
        return ""

    for field_name in (
        "display_name",
        "full_name",
        "name",
        "patient_name",
        "file_number",
        "patient_file_id",
        "username",
    ):
        value = getattr(obj, field_name, None)
        if value:
            return str(value)

    get_full_name = getattr(obj, "get_full_name", None)
    if callable(get_full_name):
        value = get_full_name()
        if value:
            return value

    return str(obj)


def _serialize_referral(referral):
    patient = getattr(referral, "patient", None)
    physician = getattr(referral, "physician", None)
    referring_user = getattr(referral, "referred_by", None)

    patient_file_id = ""
    if patient:
        for field_name in (
            "patient_file_id",
            "file_id",
            "file_number",
            "mrn",
        ):
            value = getattr(patient, field_name, None)
            if value not in (None, ""):
                patient_file_id = value
                break

    status = getattr(referral, "status", "") or ""
    status_label = status

    try:
        status_label = referral.get_status_display()
    except (AttributeError, TypeError):
        pass

    created_at = getattr(referral, "created_at", None)
    updated_at = getattr(referral, "updated_at", None)

    return {
        "id": referral.pk,
        "patient": getattr(referral, "patient_id", None),
        "patient_id": getattr(referral, "patient_id", None),
        "patient_name": _related_object_name(patient),
        "patient_file_id": patient_file_id,
        "physician": getattr(referral, "physician_id", None),
        "physician_id": getattr(referral, "physician_id", None),
        "physician_name": _display_name(physician),
        "referred_by": getattr(referral, "referred_by_id", None),
        "referred_by_id": getattr(referral, "referred_by_id", None),
        "referred_by_name": _display_name(referring_user),
        "reason": getattr(referral, "reason", "") or "",
        "status": status,
        "status_label": status_label,
        "created_at": created_at.isoformat() if created_at else None,
        "updated_at": updated_at.isoformat() if updated_at else None,
    }


def _error(message, status=400, **extra):
    response = {"success": False, "error": message, "message": message}
    response.update(extra)
    return JsonResponse(response, status=status)


def _get_related_id(data, *keys):
    """Return the first non-empty ID supplied under the given keys."""
    for key in keys:
        if key in data and data[key] not in (None, ""):
            return data[key]
    return None


def _resolve_patient(patient_id):
    if patient_id in (None, ""):
        raise ValueError("A patient ID is required.")

    try:
        return Patient.objects.get(pk=patient_id)
    except (Patient.DoesNotExist, ValueError, TypeError):
        raise ValueError("The selected patient was not found.")


def _resolve_physician(physician_id):
    """Resolve the physician using the Physician model's primary key."""
    if physician_id in (None, ""):
        raise ValueError("A physician ID is required.")

    try:
        return Physician.objects.get(pk=physician_id)
    except (Physician.DoesNotExist, ValueError, TypeError):
        raise ValueError(
            "The selected physician was not found. "
            "Please refresh the physician list and select a valid physician."
        )


def _resolve_referring_user(user_id):
    if user_id in (None, ""):
        return None

    try:
        return User.objects.get(pk=user_id)
    except (User.DoesNotExist, ValueError, TypeError):
        raise ValueError("The referring user was not found.")


def _apply_referral_data(referral, data, creating=False):
    """
    Apply supported fields to a referral.

    The physician relation is resolved against the Physician model.
    The referring user, if supplied, is resolved against the User model.
    """
    patient_id = _get_related_id(data, "patient_id", "patient")
    physician_id = _get_related_id(data, "physician_id", "physician")

    if creating or patient_id is not None:
        referral.patient = _resolve_patient(patient_id)

    if creating or physician_id is not None:
        referral.physician = _resolve_physician(physician_id)

    if "reason" in data:
        referral.reason = str(data.get("reason") or "").strip()

    if "status" in data:
        status = str(data.get("status") or "").strip()

        # Validate against the model's defined choices, if present.
        try:
            status_field = PhysioReferral._meta.get_field("status")
            choices = {
                str(value)
                for value, _label in status_field.flatchoices
            }
            if choices and status not in choices:
                raise ValueError(
                    "Invalid referral status. Choose one of: "
                    + ", ".join(sorted(choices))
                )
        except FieldDoesNotExist:
            pass

        referral.status = status

    if creating and _has_field(PhysioReferral, "referred_by"):
        referring_user_id = _get_related_id(
            data, "referred_by_id", "referred_by"
        )
        if referring_user_id is not None:
            referral.referred_by = _resolve_referring_user(
                referring_user_id
            )

    return referral


# ---------------------------------------------------------
# Physician users endpoint
# URL example: /api/users/physicians/
# ---------------------------------------------------------

@csrf_exempt
@require_http_methods(["GET"])
def physicians_api(request):
    """
    Return physician/doctor accounts using their actual User primary keys.

    This endpoint is compatible with the referral model's physician FK
    when that FK points to users.User.
    """
    try:
        users = User.objects.all()

        if _has_field(User, "is_active"):
            users = users.filter(is_active=True)

        if _has_field(User, "role"):
            from django.db.models import Q

            physician_roles = [
                "doctor",
                "physician",
            ]

            role_filter = Q()
            for role in physician_roles:
                role_filter |= Q(role__iexact=role)

            physician_users = list(users.filter(role_filter).order_by("pk"))

            # Some existing installations use different role labels.
            # If no matching users exist, return an empty list rather than
            # exposing every account as a physician.
            users = physician_users
        else:
            users = list(users.order_by("pk"))

        results = []
        for user in users:
            results.append({
                "id": user.pk,
                "user_id": user.pk,
                "physician_id": user.pk,
                "name": _display_name(user),
                "display_name": _display_name(user),
                "username": getattr(user, "username", ""),
                "email": getattr(user, "email", ""),
                "role": str(getattr(user, "role", "") or ""),
            })

        return JsonResponse({
            "success": True,
            "physicians": results,
            "results": results,
        })

    except Exception:
        return _error(
            "Unable to load physician users. Check the User model and role field.",
            status=500,
        )


# ---------------------------------------------------------
# Referral collection endpoint
# GET  /api/reception/physio-referrals/
# POST /api/reception/physio-referrals/
# ---------------------------------------------------------

@csrf_exempt
@require_http_methods(["GET", "POST"])
def physio_referrals_api(request):
    if request.method == "GET":
        try:
            referrals = PhysioReferral.objects.all().order_by("-pk")

            # Use select_related only for relations that exist.
            related_fields = [
                field_name
                for field_name in ("patient", "physician", "referred_by")
                if _has_field(PhysioReferral, field_name)
            ]
            if related_fields:
                referrals = referrals.select_related(*related_fields)

            results = [_serialize_referral(item) for item in referrals]

            return JsonResponse({
                "success": True,
                "referrals": results,
                "results": results,
                "count": len(results),
            })

        except Exception as exc:
            return _error(
                "Unable to load physiotherapy referrals.",
                status=500,
                details=str(exc),
            )

    try:
        data = _json_body(request)
        referral = PhysioReferral()

        _apply_referral_data(referral, data, creating=True)

        with transaction.atomic():
            referral.save()

        return JsonResponse({
            "success": True,
            "message": "Physiotherapy referral created successfully.",
            "referral": _serialize_referral(referral),
        }, status=201)

    except ValueError as exc:
        return _error(str(exc), status=400)

    except (ValidationError, IntegrityError) as exc:
        return _error(
            "The referral could not be saved. Verify the patient and physician IDs.",
            status=400,
            details=str(exc),
        )

    except Exception as exc:
        return _error(
            "An unexpected error occurred while creating the referral.",
            status=500,
            details=str(exc),
        )


# ---------------------------------------------------------
# Single referral endpoint
# GET    /api/reception/physio-referrals/<id>/
# PATCH  /api/reception/physio-referrals/<id>/
# PUT    /api/reception/physio-referrals/<id>/
# DELETE /api/reception/physio-referrals/<id>/
# ---------------------------------------------------------

@csrf_exempt
@require_http_methods(["GET", "PATCH", "PUT", "DELETE"])
def physio_referral_detail_api(request, referral_id):
    try:
        referral = PhysioReferral.objects.get(pk=referral_id)
    except (PhysioReferral.DoesNotExist, ValueError, TypeError):
        return _error("Physiotherapy referral not found.", status=404)

    if request.method == "GET":
        return JsonResponse({
            "success": True,
            "referral": _serialize_referral(referral),
        })

    if request.method == "DELETE":
        try:
            referral.delete()
            return JsonResponse({
                "success": True,
                "message": "Physiotherapy referral deleted successfully.",
                "id": referral_id,
            })
        except Exception as exc:
            return _error(
                "Unable to delete the physiotherapy referral.",
                status=400,
                details=str(exc),
            )

    try:
        data = _json_body(request)

        # PUT requires the core fields; PATCH updates only supplied fields.
        if request.method == "PUT":
            if _get_related_id(data, "patient_id", "patient") is None:
                return _error("A patient ID is required for PUT.")
            if _get_related_id(data, "physician_id", "physician") is None:
                return _error("A physician ID is required for PUT.")

        _apply_referral_data(referral, data, creating=False)

        with transaction.atomic():
            referral.full_clean()
            referral.save()

        return JsonResponse({
            "success": True,
            "message": "Physiotherapy referral updated successfully.",
            "referral": _serialize_referral(referral),
        })

    except ValueError as exc:
        return _error(str(exc), status=400)

    except (ValidationError, IntegrityError) as exc:
        return _error(
            "The referral could not be updated. Verify the supplied fields and IDs.",
            status=400,
            details=str(exc),
        )

    except Exception as exc:
        return _error(
            "An unexpected error occurred while updating the referral.",
            status=500,
            details=str(exc),
        )
