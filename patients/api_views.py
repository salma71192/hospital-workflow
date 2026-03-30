from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

from .models import Patient


@csrf_exempt
def patients_api(request):
    if request.method == "GET":
        patients = list(Patient.objects.values("id", "name", "patient_id"))
        return JsonResponse({"patients": patients})

    if request.method == "POST":
        if not request.user.is_authenticated:
            return JsonResponse({"error": "Not authenticated"}, status=401)

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