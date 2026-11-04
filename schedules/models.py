
from django.conf import settings
from django.db import models

from patients.models import Patient


class TherapistAppointment(models.Model):
    CONFIRMED = "confirmed"
    UNCONFIRMED = "unconfirmed"
    NO_ANSWER = "no_answer"
    PHONE_OFF = "phone_off"
    CANCELLED = "cancelled"
    RESCHEDULED = "rescheduled"

    CONFIRMATION_CHOICES = [
        (UNCONFIRMED, "Unconfirmed"),
        (CONFIRMED, "Confirmed"),
        (NO_ANSWER, "No Answer"),
        (PHONE_OFF, "Phone Off"),
        (CANCELLED, "Cancelled"),
        (RESCHEDULED, "Rescheduled"),
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
        db_index=True,
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

    notes = models.TextField(
        blank=True,
        default="",
    )

    second_call_attempts = models.PositiveIntegerField(
        default=0,
    )

    rescheduled_to_date = models.DateField(
        null=True,
        blank=True,
    )

    rescheduled_to_time = models.TimeField(
        null=True,
        blank=True,
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
            "id",
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

    @property
    def requires_follow_up(self):
        return self.confirmation_status in {
            self.UNCONFIRMED,
            self.NO_ANSWER,
            self.PHONE_OFF,
        }

    def __str__(self):
        return (
            f"{self.therapist} - "
            f"{self.appointment_date} "
            f"{self.appointment_time} - "
            f"{self.patient_name}"
        )


class AppointmentStatusHistory(models.Model):
    appointment = models.ForeignKey(
        TherapistAppointment,
        on_delete=models.CASCADE,
        related_name="status_history",
    )

    action = models.CharField(
        max_length=100,
        default="status_updated",
    )

    old_status = models.CharField(
        max_length=20,
        blank=True,
        default="",
    )

    new_status = models.CharField(
        max_length=20,
        blank=True,
        default="",
    )

    note = models.TextField(
        blank=True,
        default="",
    )

    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="therapist_schedule_changes",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
    )

    class Meta:
        ordering = [
            "-created_at",
            "-id",
        ]

    def __str__(self):
        return (
            f"Appointment {self.appointment_id}: "
            f"{self.old_status} -> {self.new_status}"
        )
