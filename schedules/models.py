
from django.conf import settings
from django.db import models

from patients.models import Patient


class TherapistAppointment(models.Model):

    CONFIRMED = "confirmed"
    UNCONFIRMED = "unconfirmed"

    CONFIRMATION_CHOICES = [
        (CONFIRMED, "Confirmed"),
        (UNCONFIRMED, "Not Confirmed"),
    ]

    FOLLOWUP = "followup"
    EVALUATION = "evaluation"

    APPOINTMENT_TYPE_CHOICES = [
        (FOLLOWUP, "Follow-up"),
        (EVALUATION, "Evaluation"),
    ]

    therapist = models.CharField(
        max_length=255,
        db_index=True,
    )

    appointment_date = models.DateField(
        db_index=True,
    )

    appointment_time = models.TimeField()

    patient = models.ForeignKey(
        Patient,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="therapist_appointments",
    )

    patient_name = models.CharField(
        max_length=255,
    )

    confirmation_status = models.CharField(
        max_length=20,
        choices=CONFIRMATION_CHOICES,
        default=UNCONFIRMED,
    )

    appointment_type = models.CharField(
        max_length=20,
        choices=APPOINTMENT_TYPE_CHOICES,
        default=FOLLOWUP,
    )

    source = models.CharField(
        max_length=100,
        default="concepts",
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_therapist_appointments",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = [
            "appointment_date",
            "appointment_time",
            "patient_name",
        ]

        indexes = [
            models.Index(
                fields=[
                    "therapist",
                    "appointment_date",
                    "appointment_time",
                ],
                name="therapist_schedule_idx",
            ),
        ]

    @property
    def file_number(self):
        if self.patient_id and self.patient:
            return self.patient.patient_id
        return ""

    def __str__(self):
        return (
            f"{self.therapist} - "
            f"{self.appointment_date} "
            f"{self.appointment_time} - "
            f"{self.patient_name}"
        )
