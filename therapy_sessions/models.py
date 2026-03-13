from django.db import models
from patients.models import Patient
from django.contrib.auth import get_user_model

User = get_user_model()

class TherapySession(models.Model):
    patient = models.ForeignKey(
        Patient, 
        on_delete=models.CASCADE, 
        related_name='therapy_sessions'
    )
    therapist = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        limit_choices_to={'role': 'physiotherapist'},
        related_name='assigned_sessions'
    )
    session_date = models.DateField()
    notes = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.patient.full_name} - {self.session_date}"