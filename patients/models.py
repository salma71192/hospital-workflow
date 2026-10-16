
import re

from django.db import models
from django.conf import settings


def normalize_patient_id(value):
    """
    Remove all whitespace from a patient file number.
    Example: ' AB 123 ' becomes 'AB123'.
    """
    if value is None:
        return ""

    return re.sub(r"\s+", "", str(value))


class Patient(models.Model):
    name = models.CharField(max_length=255)
    patient_id = models.CharField(max_length=100, unique=True)

    # Approval fields
    current_approval_number = models.CharField(
        max_length=100, blank=True, null=True
    )
    approval_start_date = models.DateField(blank=True, null=True)
    approval_expiry_date = models.DateField(blank=True, null=True)
    approved_sessions = models.PositiveIntegerField(default=0)
    approved_cpt_codes = models.JSONField(default=list, blank=True)

    sessions_taken = models.PositiveIntegerField(default=0)
    taken_with = models.CharField(max_length=255, blank=True, null=True)
    current_future_appointments = models.TextField(
        blank=True, null=True
    )

    insurance_provider = models.CharField(
        max_length=50, blank=True, null=True
    )

    # Registration tracking
    registered_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="registered_patients",
    )

    registered_by_role = models.CharField(
        max_length=50,
        blank=True,
        null=True,
    )

    registered_at = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        # Normalize the file number before saving.
        self.patient_id = normalize_patient_id(self.patient_id)

        if not self.patient_id:
            raise ValueError(
                "Patient file number cannot be empty or contain only spaces."
            )

        # Reject an existing file number, ignoring whitespace differences.
        duplicate_query = Patient.objects.filter(
            patient_id__regex=r"\s"
        )

        # Check all records after normalizing their identifiers.
        for existing in Patient.objects.exclude(pk=self.pk).only(
            "id", "patient_id"
        ).iterator():
            if normalize_patient_id(existing.patient_id) == self.patient_id:
                raise ValueError(
                    f"Patient file number '{self.patient_id}' already exists."
                )

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.patient_id})"
