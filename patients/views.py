from django.shortcuts import render, get_object_or_404
from patients.models import Patient
from therapy_sessions.models import TherapySession

def search_patient(request):

    query = request.GET.get("q")
    patients = []

    if query:
        patients = Patient.objects.filter(
            full_name__icontains=query
        ) | Patient.objects.filter(
            file_number__icontains=query
        )

    return render(request, "patients/search_results.html", {
        "patients": patients,
        "query": query
    })

def patient_profile(request, patient_id):
    patient = get_object_or_404(Patient, id=patient_id)

    # fetch all sessions for this patient
    sessions = TherapySession.objects.filter(patient=patient).order_by('-session_date')

    context = {
        "patient": patient,
        "sessions": sessions,
    }
    return render(request, "patients/patient_profile.html", context)