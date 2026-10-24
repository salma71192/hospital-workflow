
import json

from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from patients.models import Patient
from users.models import User
from .models import PhysioReferral, Physician


UserModel = get_user_model()


def _json_body(request):
    try:
        return json.loads(request.body or b"{}")
    except (json.JSONDecodeError, UnicodeDecodeError):
        raise ValueError("Invalid JSON request body.")


def _model_has_field(model, field_name):
    return any(
        field.name == field_name
        for field in model._meta.get_fields()
    )


def _user_display_name(user):
    return (
        getattr(user, "display_name", None)
        or getattr(user, "name", None)
        or user.get_full_name()
        or getattr(user, "username", "")
        or getattr(user, "email", "")
        or str(user.pk)
    ).strip()


def _patient_name(patient):
    for field in (
        "name",
        "full_name",
        "patient_name",
        "display_name",
    ):
        value = getattr(patient, field, None)
        if value:
            return str(value)

    first_name = getattr(patient, "first_name", "")
    last_name = getattr(patient, "last_name", "")
    full_name = f"{first_name} {last_name}".strip()

    return full_name or str(patient.pk)


def _resolve_patient(patient_id):
    if patient_id in (None, ""):
        raise ValueError("Please select a patient.")

    try:
        return Patient.objects.get(pk=patient_id)
    except (Patient.DoesNotExist, ValueError, TypeError):
        raise ValueError(
            "The selected patient was not found. "
            "Refresh the patient list and select a patient again."
        )


def _resolve_physician_user(user_id):
    if user_id in (None, ""):
        raise ValueError("Please select a physician.")

    try:
        user = UserModel.objects.get(pk=user_id)
    except (UserModel.DoesNotExist, ValueError, TypeError):
        raise ValueError(
            "The selected physician was not found. "
            "Refresh the physician list and select a physician again."
        )

    if _model_has_field(UserModel, "is_active") and not user.is_active:
        raise ValueError("The selected physician account is inactive.")

    return user


def _resolve_physician(user_id):
    """
    The frontend sends the ID from users/physicians/.

    PhysioReferral.physician is a ForeignKey to reception.Physician,
    so resolve the selected User to the corresponding Physician row.
    """
    user = _resolve_physician_user(user_id)
    name = _user_display_name(user)

    if not name:
        raise ValueError(
            "The selected physician account does not have a display name."
        )

    physician = Physician.objects.filter(name__iexact=name).first()

    if physician:
        return physician

    try:
        with transaction.atomic():
            physician = Physician.objects.create(name=name)
    except IntegrityError:
        # Another request may have created the same physician concurrently.
        physician = Physician.objects.filter(name__iexact=name).first()

        if physician is None:
            raise ValueError(
                "Could not match the selected user to a physician record."
            )

    return physician


def _referral_to_dict(referral):
    patient = referral.patient
    physician = referral.physician
    referring_user = referral.referred_by

    return {
        "id": referral.pk,
        "patient": patient.pk,
        "patient_id": patient.pk,
        "patient_name": _patient_name(patient),
        "physician": physician.pk,
        "physician_id": physician.pk,
        "physician_name": physician.name,
        "reason": referral.reason,
        "status": referral.status,
        "created_at": (
            referral.created_at.isoformat()
            if referral.created_at
            else None
        ),
        "updated_at": (
            referral.updated_at.isoformat()
            if referral.updated_at
            else None
        ),
        "referred_by": (
            referring_user.pk if referring_user else None
        ),
        "referred_by_name": (
            _user_display_name(referring_user)
            if referring_user
            else None
        ),
    }


def _error(message, status=400, details=None):
    response = {"error": message, "detail": message}

    if details is not None:
        response["details"] = details

    return JsonResponse(response, status=status)


@csrf_exempt
@require_http_methods(["GET"])
def physicians_api(request):
    """
    GET /api/users/physicians/

    Returns physician choices from the User model.
    The IDs returned here are User IDs, not Physician table IDs.
    """
    users = UserModel.objects.all()

    if _model_has_field(UserModel, "is_active"):
        users = users.filter(is_active=True)

    if _model_has_field(UserModel, "role"):
        users = users.filter(
            role__in=["doctor", "physician"]
        )

    users = users.order_by("username")

    results = []

    for user in users:
        display_name = _user_display_name(user)

        results.append({
            "id": user.pk,
            "user_id": user.pk,
            "name": display_name,
            "display_name": display_name,
            "username": getattr(user, "username", ""),
            "email": getattr(user, "email", ""),
            "role": getattr(user, "role", ""),
        })

    return JsonResponse({
        "physicians": results,
        "doctors": results,
        "users": results,
    })


@csrf_exempt
@require_http_methods(["GET", "POST"])
def physio_referrals_api(request):
    """
    GET  /api/reception/physio-referrals/
    POST /api/reception/physio-referrals/
    """
    if request.method == "GET":
        referrals = (
            PhysioReferral.objects
            .select_related("patient", "physician", "referred_by")
            .order_by("-created_at")
        )

        status_filter = request.GET.get("status")

        if status_filter in ("awaiting", "completed"):
            referrals = referrals.filter(status=status_filter)

        return JsonResponse({
            "referrals": [
                _referral_to_dict(referral)
                for referral in referrals
            ],
            "results": [
                _referral_to_dict(referral)
                for referral in referrals
            ],
        })

    try:
        data = _json_body(request)

        patient_id = (
            data.get("patient")
            or data.get("patient_id")
        )
        physician_user_id = (
            data.get("physician_user_id")
            or data.get("user_id")
            or data.get("physician")
            or data.get("physician_id")
        )
        reason = str(data.get("reason") or "").strip()

        if not reason:
            return _error("Please enter a referral reason.")

        patient = _resolve_patient(patient_id)
        physician = _resolve_physician(physician_user_id)

        referring_user = (
            request.user
            if getattr(request, "user", None)
            and request.user.is_authenticated
            else None
        )

        referral = PhysioReferral.objects.create(
            patient=patient,
            physician=physician,
            reason=reason,
            referred_by=referring_user,
            status="awaiting",
        )

        referral = (
            PhysioReferral.objects
            .select_related("patient", "physician", "referred_by")
            .get(pk=referral.pk)
        )

        return JsonResponse({
            "message": "Referral created successfully.",
            "referral": _referral_to_dict(referral),
        }, status=201)

    except ValueError as exc:
        return _error(str(exc))

    except IntegrityError:
        return _error(
            "The referral could not be saved because of a database "
            "constraint. Check the physician and patient relationships.",
            status=400,
        )

    except Exception as exc:
        return _error(
            "Could not create the referral.",
            status=400,
            details=str(exc),
        )


@csrf_exempt
@require_http_methods(["GET", "PATCH", "PUT", "DELETE"])
def physio_referral_detail_api(request, referral_id):
    """
    GET    /api/reception/physio-referrals/<id>/
    PATCH  /api/reception/physio-referrals/<id>/
    PUT    /api/reception/physio-referrals/<id>/
    DELETE /api/reception/physio-referrals/<id>/
    """
    try:
        referral = (
            PhysioReferral.objects
            .select_related("patient", "physician", "referred_by")
            .get(pk=referral_id)
        )
    except (PhysioReferral.DoesNotExist, ValueError, TypeError):
        return _error("Referral not found.", status=404)

    if request.method == "GET":
        return JsonResponse({
            "referral": _referral_to_dict(referral),
        })

    if request.method == "DELETE":
        referral.delete()

        return JsonResponse({
            "message": "Referral deleted successfully.",
            "id": referral_id,
        })

    try:
        data = _json_body(request)

        if "patient" in data or "patient_id" in data:
            patient_id = data.get("patient", data.get("patient_id"))
            referral.patient = _resolve_patient(patient_id)

        physician_keys = (
            "physician_user_id",
            "user_id",
            "physician",
            "physician_id",
        )

        selected_key = next(
            (key for key in physician_keys if key in data),
            None,
        )

        if selected_key is not None:
            referral.physician = _resolve_physician(data[selected_key])

        if "reason" in data:
            reason = str(data.get("reason") or "").strip()

            if not reason:
                return _error("Please enter a referral reason.")

            referral.reason = reason

        if "status" in data:
            status = str(data.get("status") or "").strip().lower()

            if status not in ("awaiting", "completed"):
                return _error(
                    "Invalid referral status. Use 'awaiting' or 'completed'."
                )

            referral.status = status

        referral.save()

        referral = (
            PhysioReferral.objects
            .select_related("patient", "physician", "referred_by")
            .get(pk=referral.pk)
        )

        return JsonResponse({
            "message": "Referral updated successfully.",
            "referral": _referral_to_dict(referral),
        })

    except ValueError as exc:
        return _error(str(exc))

    except IntegrityError:
        return _error(
            "The referral could not be updated because of a database "
            "constraint. Check the physician and patient relationships.",
            status=400,
        )

    except Exception as exc:
        return _error(
            "Could not update the referral.",
            status=400,
            details=str(exc),
        )
