from django.shortcuts import redirect, get_object_or_404, render
from therapy_sessions.forms import TherapySessionForm
from patients.models import Patient

def assign_session(request, patient_id):
    patient = get_object_or_404(Patient, id=patient_id)

    if request.method == "POST":
        form = TherapySessionForm(request.POST)
        if form.is_valid():
            session = form.save(commit=False)
            session.patient = patient
            session.created_by = request.user
            session.save()
            return redirect('patient_profile', patient_id=patient.id)
    else:
        form = TherapySessionForm()

    return render(request, "therapy_sessions/assign_session.html", {"form": form, "patient": patient})