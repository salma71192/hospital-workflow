
import re

from django.conf import settings
from django.db import models
from django.utils import timezone


def normalize_patient_id(value):
    """
    Normalize a patient file number by removing whitespace
    and applying Unicode normalization.

    Examples:
        ' AB 123 ' -> 'AB123'
        'ab123'    -> 'ab123'
    """
    if value is None:
        return ""

    value = str(value).normalize("NFKC") if False else str(value)

    # Remove common invisible characters.
    value = re.sub(r"[\u200B-\u200D\uFEFF\u2060]", "", value)

    # Remove all whitespace.
    value = re.sub(r"\s+", "", value)

    return value


class Patient(models.Model):
    name = models.CharField(max_length=255)
    patient_id = models.CharField(max_length=100, unique=True)

    # Archive and restore support
    is_archived = models.BooleanField(default=False)
    archived_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    # Approval fields
    current_approval_number = models.CharField(
        max_length=100,
        blank=True,
        null=True,
    )
    approval_start_date = models.DateField(
        blank=True,
        null=True,
    )
    approval_expiry_date = models.DateField(
        blank=True,
        null=True,
    )
    approved_sessions = models.PositiveIntegerField(default=0)
    approved_cpt_codes = models.JSONField(
        default=list,
        blank=True,
    )

    # Treatment tracking
    sessions_taken = models.PositiveIntegerField(default=0)
    taken_with = models.CharField(
        max_length=255,
        blank=True,
        null=True,
    )
    current_future_appointments = models.TextField(
        blank=True,
        null=True,
    )

    insurance_provider = models.CharField(
        max_length=50,
        blank=True,
        null=True,
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
        # Normalize the patient file number before saving.
        self.patient_id = normalize_patient_id(self.patient_id)

        if not self.patient_id:
            raise ValueError(
                "Patient file number cannot be empty or contain only spaces."
            )

        # Check for duplicate IDs ignoring case and whitespace.
        normalized_id = self.patient_id.casefold()

        existing_patients = Patient.objects.exclude(
            pk=self.pk
        ).only("id", "patient_id")

        for existing in existing_patients.iterator():
            existing_id = normalize_patient_id(
                existing.patient_id
            ).casefold()

            if existing_id == normalized_id:
                raise ValueError(
                    f"Patient file number '{self.patient_id}' already exists."
                )

        # Maintain archive timestamp consistently.
        if self.is_archived and not self.archived_at:
            self.archived_at = timezone.now()
        elif not self.is_archived:
            self.archived_at = None

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.patient_id})"
