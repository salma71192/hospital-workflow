from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

from .models import Patient


@csrf_exempt
def patients_api(request):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Not authenticated"}, status=401)

    if request.method == "GET":
        search = request.GET.get("search", "").strip()
        patients_qs = Patient.objects.all().order_by("-created_at")

        if search:
            patients_qs = patients_qs.filter(name__icontains=search) | Patient.objects.filter(
                patient_id__icontains=search
            )

        patients = list(
            patients_qs.values(
                "id",
                "name",
                "patient_id",
                "current_approval_number",
                "sessions_taken",
                "taken_with",
                "current_future_appointments",
                "created_at",
            )
        )
        return JsonResponse({"patients": patients})

    if request.method == "POST":
        if not (
            request.user.is_superuser
            or getattr(request.user, "role", "") in ["admin", "reception", "reception_supervisor"]
        ):
            return JsonResponse(
                {"error": "Only admin or reception can create patient files"},
                status=403,
            )

        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON"}, status=400)

        name = data.get("name")
        patient_id = data.get("patient_id")
        current_approval_number = data.get("current_approval_number")
        sessions_taken = data.get("sessions_taken", 0)
        taken_with = data.get("taken_with")
        current_future_appointments = data.get("current_future_appointments")

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
            current_approval_number=current_approval_number or None,
            sessions_taken=sessions_taken or 0,
            taken_with=taken_with or None,
            current_future_appointments=current_future_appointments or None,
        )

        return JsonResponse({
            "success": True,
            "message": "Patient file created successfully",
            "patient": {
                "id": patient.id,
                "name": patient.name,
                "patient_id": patient.patient_id,
                "current_approval_number": patient.current_approval_number,
                "sessions_taken": patient.sessions_taken,
                "taken_with": patient.taken_with,
                "current_future_appointments": patient.current_future_appointments,
            },
        })

    return JsonResponse({"error": "Method not allowed"}, status=405)