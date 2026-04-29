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
        therapist_name = (
            self.therapist.username if self.therapist else "Unknown Therapist"
        )
        return (
            f"{patient_name} - {therapist_name} - "
            f"{self.appointment_date} {self.appointment_time}"
        )


class WaitingListEntry(models.Model):
    TIME_PERIOD_CHOICES = [
        ("", "Any Time"),
        ("morning", "Morning"),
        ("afternoon", "Afternoon"),
        ("evening", "Evening"),
    ]

    STATUS_CHOICES = [
        ("waiting", "Waiting"),
        ("notified", "Notified"),
        ("booked", "Booked"),
        ("cancelled", "Cancelled"),
    ]

    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name="waiting_list_entries",
    )

    preferred_therapist = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="waiting_list_entries_as_therapist",
    )

    preferred_date = models.DateField(null=True, blank=True)

    preferred_time_period = models.CharField(
        max_length=20,
        choices=TIME_PERIOD_CHOICES,
        blank=True,
        default="",
    )

    notes = models.TextField(blank=True, default="")

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="waiting",
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_waiting_list_entries",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    # Used for history filtering by same day when item is booked/cancelled/notified
    status_changed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "created_at"]),
            models.Index(fields=["preferred_date", "status"]),
            models.Index(fields=["created_by", "status"]),
            models.Index(fields=["preferred_therapist", "status"]),
        ]

    def __str__(self):
        patient_name = self.patient.name if self.patient else "Unknown Patient"
        therapist = (
            self.preferred_therapist.username
            if self.preferred_therapist
            else "Any Therapist"
        )
        period = self.preferred_time_period or "Any Time"

        return f"{patient_name} - {therapist} - {period} - {self.status}"