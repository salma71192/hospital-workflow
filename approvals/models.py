from django.db import models
from django.conf import settings
from patients.models import Patient


class PatientApproval(models.Model):
    INSURANCE_CHOICES = [
        ("thiqa", "Thiqa"),
    ]

    patient = models.OneToOneField(
        Patient,
        on_delete=models.CASCADE,
        related_name="approval_record",
    )
    insurance_provider = models.CharField(
        max_length=30,
        choices=INSURANCE_CHOICES,
        default="thiqa",
    )
    authorization_number = models.CharField(max_length=100, blank=True, null=True)
    start_date = models.DateField(blank=True, null=True)
    expiry_date = models.DateField(blank=True, null=True)
    approved_sessions = models.PositiveIntegerField(default=0)
    approved_cpt_codes = models.JSONField(default=list, blank=True)
    notes = models.TextField(blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.patient.name} - {self.insurance_provider}"


class InsuranceBillingCode(models.Model):
    INSURANCE_CHOICES = [
        ("thiqa", "Thiqa"),
    ]

    insurance_provider = models.CharField(
        max_length=30,
        choices=INSURANCE_CHOICES,
        default="thiqa",
    )
    code = models.CharField(max_length=50)
    default_sessions = models.PositiveIntegerField(default=6)

    class Meta:
        unique_together = ("insurance_provider", "code")
        ordering = ["insurance_provider", "code"]

    def __str__(self):
        return f"{self.insurance_provider} - {self.code}"


class ApprovalHistory(models.Model):
    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name="approval_history",
    )
    authorization_number = models.CharField(max_length=100, blank=True, null=True)
    approved_sessions = models.IntegerField(default=0)
    expiry_date = models.DateField(blank=True, null=True)
    insurance_provider = models.CharField(max_length=30, default="thiqa")
    approved_cpt_codes = models.JSONField(default=list, blank=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.patient.name} - {self.authorization_number} ({self.created_at})"