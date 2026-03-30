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

        patients_qs = Patient.objects.all().order_by("name")

        if search:
            patients_qs = patients_qs.filter(name__icontains=search) | Patient.objects.filter(
                patient_id__icontains=search
            )

        patients = list(
            patients_qs.values("id", "name", "patient_id")
        )
        return JsonResponse({"patients": patients})

    if request.method == "POST":
        if not (
            request.user.is_superuser
            or getattr(request.user, "role", "") in ["admin", "reception"]
        ):
            return JsonResponse(
                {"error": "Only admin or reception can register patients"},
                status=403,
            )

        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON"}, status=400)

        name = data.get("name")
        patient_id = data.get("patient_id")

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
        )

        return JsonResponse({
            "success": True,
            "message": "Patient registered successfully",
            "patient": {
                "id": patient.id,
                "name": patient.name,
                "patient_id": patient.patient_id,
            },
        })

    return JsonResponse({"error": "Method not allowed"}, status=405)