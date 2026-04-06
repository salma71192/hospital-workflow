from django.db import models
from django.conf import settings


class Patient(models.Model):
    name = models.CharField(max_length=255)
    patient_id = models.CharField(max_length=100, unique=True)

    # -----------------------------
    # Approval fields (keep as is)
    # -----------------------------
    current_approval_number = models.CharField(max_length=100, blank=True, null=True)
    approval_start_date = models.DateField(blank=True, null=True)
    approval_expiry_date = models.DateField(blank=True, null=True)
    approved_sessions = models.PositiveIntegerField(default=0)
    approved_cpt_codes = models.JSONField(default=list, blank=True)

    sessions_taken = models.PositiveIntegerField(default=0)
    taken_with = models.CharField(max_length=255, blank=True, null=True)
    current_future_appointments = models.TextField(blank=True, null=True)

    insurance_provider = models.CharField(max_length=50, blank=True, null=True)

    # -----------------------------
    # 🔥 NEW: Registration tracking
    # -----------------------------
    registered_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="registered_patients"
    )

    registered_by_role = models.CharField(
        max_length=50,
        blank=True,
        null=True
    )

    registered_at = models.DateTimeField(auto_now_add=True)

    # -----------------------------
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.patient_id})"