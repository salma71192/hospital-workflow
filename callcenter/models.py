from django.db import models
from django.conf import settings
from patients.models import Patient


class Appointment(models.Model):
    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name="callcenter_appointments",
    )
    therapist = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="therapist_appointments",
    )
    appointment_date = models.DateField()
    appointment_time = models.TimeField()
    notes = models.TextField(blank=True, null=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_callcenter_appointments",
    )

    attendance_status = models.CharField(
        max_length=20,
        choices=[
            ("no_show", "No Show"),
            ("attended", "Attended"),
        ],
        default="no_show",
    )
    attended_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["appointment_date", "appointment_time", "-created_at"]

    def __str__(self):
        patient_name = self.patient.name if self.patient else "Unknown Patient"
        therapist_name = self.therapist.username if self.therapist else "Unknown Therapist"
        return f"{patient_name} - {therapist_name} - {self.appointment_date} {self.appointment_time}"