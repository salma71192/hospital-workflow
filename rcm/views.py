
import json
from datetime import date

from django.db import IntegrityError
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from patients.models import Patient
from .models import Claim, RenewalAlert


def get_patient(patient_id):
    try:
        return Patient.objects.get(pk=patient_id)
    except (Patient.DoesNotExist, ValueError, TypeError):
        return None


def claim_to_dict(claim):
    patient = claim.patient
    patient_name = (
        getattr(patient, "name", None)
        or getattr(patient, "full_name", None)
        or getattr(patient, "patient_name", None)
        or str(patient)
    )

    return {
        "id": claim.id,
        "patientId": claim.patient_id,
        "patientName": patient_name,
        "claimId": claim.claim_id,
        "status": claim.status,
        "rejectionReason": claim.rejection_reason,
        "createdAt": claim.created_at.isoformat(),
        "updatedAt": claim.updated_at.isoformat(),
    }


def alert_to_dict(alert):
    patient = alert.patient
    patient_name = (
        getattr(patient, "name", None)
        or getattr(patient, "full_name", None)
        or getattr(patient, "patient_name", None)
        or str(patient)
    )
    file_number = (
        getattr(patient, "patient_id", None)
        or getattr(patient, "file_number", None)
        or "-"
    )

    return {
        "id": alert.id,
        "patientId": alert.patient_id,
        "patientName": patient_name,
        "patientFileNumber": str(file_number),
        "renewalDate": alert.renewal_date.isoformat(),
        "createdAt": alert.created_at.isoformat(),
    }


def read_json(request):
    try:
        return json.loads(request.body or b"{}"), None
    except (json.JSONDecodeError, UnicodeDecodeError):
        return None, JsonResponse(
            {"error": "Invalid JSON request body."},
            status=400,
        )


@csrf_exempt
@require_http_methods(["GET", "POST"])
def claims_list_create(request):
    if request.method == "GET":
        patient_id = request.GET.get("patient_id")
        queryset = Claim.objects.select_related("patient")

        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)

        return JsonResponse({
            "results": [claim_to_dict(item) for item in queryset]
        })

    data, error = read_json(request)
    if error:
        return error

    patient_id = data.get("patientId")
    claim_id = str(data.get("claimId", "")).strip()
    status = data.get("status", "Pending")
    rejection_reason = str(data.get("rejectionReason", "")).strip()

    if not patient_id:
        return JsonResponse({"error": "Patient is required."}, status=400)

    patient = get_patient(patient_id)
    if not patient:
        return JsonResponse({"error": "Patient was not found."}, status=404)

    if not claim_id:
        return JsonResponse({"error": "Claim ID is required."}, status=400)

    if status not in {"Approved", "Rejected", "Pending"}:
        return JsonResponse({"error": "Invalid claim status."}, status=400)

    if status == "Rejected" and not rejection_reason:
        return JsonResponse(
            {"error": "A rejection reason is required."},
            status=400,
        )

    try:
        claim = Claim.objects.create(
            patient=patient,
            claim_id=claim_id,
            status=status,
            rejection_reason=rejection_reason if status == "Rejected" else "",
        )
    except IntegrityError:
        return JsonResponse(
            {"error": "This Claim ID already exists for this patient."},
            status=409,
        )

    return JsonResponse({"claim": claim_to_dict(claim)}, status=201)


@csrf_exempt
@require_http_methods(["GET", "POST"])
def renewal_alerts_list_create(request):
    if request.method == "GET":
        patient_id = request.GET.get("patient_id")
        queryset = RenewalAlert.objects.select_related("patient")

        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)

        return JsonResponse({
            "results": [alert_to_dict(item) for item in queryset]
        })

    data, error = read_json(request)
    if error:
        return error

    patient_id = data.get("patientId")
    renewal_date = data.get("renewalDate")

    if not patient_id:
        return JsonResponse({"error": "Patient is required."}, status=400)

    patient = get_patient(patient_id)
    if not patient:
        return JsonResponse({"error": "Patient was not found."}, status=404)

    if not renewal_date:
        return JsonResponse({"error": "Renewal date is required."}, status=400)

    try:
        parsed_date = date.fromisoformat(renewal_date)
    except (ValueError, TypeError):
        return JsonResponse(
            {"error": "Renewal date must use YYYY-MM-DD format."},
            status=400,
        )

    alert = RenewalAlert.objects.create(
        patient=patient,
        renewal_date=parsed_date,
    )

    return JsonResponse({"alert": alert_to_dict(alert)}, status=201)
