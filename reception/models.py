from django.db import models
from patients.models import Patient
from django.contrib.auth import get_user_model

User = get_user_model()

class TherapySession(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE)
    therapist = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, limit_choices_to={'role': 'physiotherapist'})
    session_date = models.DateField()
    notes = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, default='pending')