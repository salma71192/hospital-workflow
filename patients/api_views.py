from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Q
import json

from .models import Patient


@csrf_exempt
def patients_api(request):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Not authenticated"}, status=401)

    if request.method == "GET":
        search = request.GET.get("search", "").strip()
        patients_qs = Patient.objects.select_related("registered_by").all().order_by("-created_at")

        if search:
            patients_qs = patients_qs.filter(
                Q(name__icontains=search) | Q(patient_id__icontains=search)
            ).order_by("-created_at")

        patients = []
        for patient in patients_qs:
            patients.append({
                "id": patient.id,
                "name": patient.name,
                "patient_id": patient.patient_id,
                "current_approval_number": patient.current_approval_number,
                "approval_start_date": str(patient.approval_start_date) if patient.approval_start_date else "",
                "approval_expiry_date": str(patient.approval_expiry_date) if patient.approval_expiry_date else "",
                "approved_sessions": patient.approved_sessions,
                "approved_cpt_codes": patient.approved_cpt_codes or [],
                "sessions_taken": patient.sessions_taken,
                "taken_with": patient.taken_with,
                "current_future_appointments": patient.current_future_appointments,
                "insurance_provider": patient.insurance_provider,
                "created_at": patient.created_at.isoformat() if patient.created_at else "",
                "registered_by": patient.registered_by.username if patient.registered_by else "",
                "registered_by_role": patient.registered_by_role or "",
            })

        return JsonResponse({"patients": patients})

    if request.method == "POST":
        if not (
            request.user.is_superuser
            or getattr(request.user, "role", "") in [
                "admin",
                "reception",
                "reception_supervisor",
                "approvals",
                "callcenter",
                "callcenter_supervisor",
            ]
        ):
            return JsonResponse(
                {"error": "Not allowed to create patients"},
                status=403,
            )

        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON"}, status=400)

        name = (data.get("name") or "").strip()
        patient_id = (data.get("patient_id") or "").strip()

        if not name or not patient_id:
            return JsonResponse(
                {"error": "Name and patient ID are required"},
                status=400,
            )

        if Patient.objects.filter(patient_id=patient_id).exists():
            return JsonResponse(
                {"error": "Patient ID already exists"},
                status=400,
            )

        patient = Patient.objects.create(
            name=name,
            patient_id=patient_id,
            registered_by=request.user,
            registered_by_role=getattr(request.user, "role", "") or (
                "admin" if request.user.is_superuser else ""
            ),
        )

        return JsonResponse({
            "success": True,
            "message": "Patient file created successfully",
            "patient": {
                "id": patient.id,
                "name": patient.name,
                "patient_id": patient.patient_id,
                "current_approval_number": patient.current_approval_number,
                "approval_start_date": str(patient.approval_start_date) if patient.approval_start_date else "",
                "approval_expiry_date": str(patient.approval_expiry_date) if patient.approval_expiry_date else "",
                "approved_sessions": patient.approved_sessions,
                "approved_cpt_codes": patient.approved_cpt_codes or [],
                "sessions_taken": patient.sessions_taken,
                "taken_with": patient.taken_with,
                "current_future_appointments": patient.current_future_appointments,
                "insurance_provider": patient.insurance_provider,
                "created_at": patient.created_at.isoformat() if patient.created_at else "",
                "registered_by": patient.registered_by.username if patient.registered_by else "",
                "registered_by_role": patient.registered_by_role or "",
            },
        })

    return JsonResponse({"error": "Method not allowed"}, status=405)


@csrf_exempt
def patient_detail_api(request, patient_id):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Not authenticated"}, status=401)

    try:
        patient = Patient.objects.select_related("registered_by").get(id=patient_id)
    except Patient.DoesNotExist:
        return JsonResponse({"error": "Patient not found"}, status=404)

    if request.method == "GET":
        return JsonResponse({
            "patient": {
                "id": patient.id,
                "name": patient.name,
                "patient_id": patient.patient_id,
                "current_approval_number": patient.current_approval_number,
                "approval_start_date": str(patient.approval_start_date) if patient.approval_start_date else "",
                "approval_expiry_date": str(patient.approval_expiry_date) if patient.approval_expiry_date else "",
                "approved_sessions": patient.approved_sessions,
                "approved_cpt_codes": patient.approved_cpt_codes or [],
                "sessions_taken": patient.sessions_taken,
                "taken_with": patient.taken_with,
                "current_future_appointments": patient.current_future_appointments,
                "insurance_provider": patient.insurance_provider or "",
                "created_at": patient.created_at.isoformat() if patient.created_at else "",
                "registered_by": patient.registered_by.username if patient.registered_by else "",
                "registered_by_role": patient.registered_by_role or "",
            }
        })

    return JsonResponse({"error": "Method not allowed"}, status=405)