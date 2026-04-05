from django.db import models
from django.conf import settings
from patients.models import Patient


class PatientApproval(models.Model):
    INSURANCE_CHOICES = [
        ("thiqa", "Thiqa"),
        ("daman", "Daman"),
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
    authorization_number = models.CharField(
        max_length=100,
        blank=True,
        null=True,
    )
    start_date = models.DateField(blank=True, null=True)
    expiry_date = models.DateField(blank=True, null=True)
    approved_sessions = models.PositiveIntegerField(default=0)
    approved_cpt_codes = models.JSONField(default=list, blank=True)
    notes = models.TextField(blank=True, null=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_patient_approvals",
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="updated_patient_approvals",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.patient.name} - {self.insurance_provider}"


class InsuranceBillingCode(models.Model):
    INSURANCE_CHOICES = [
        ("thiqa", "Thiqa"),
        ("daman", "Daman"),
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
    STATUS_CHOICES = [
        ("active", "Active"),
        ("deleted", "Deleted"),
    ]

    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name="approval_history",
    )
    authorization_number = models.CharField(
        max_length=100,
        blank=True,
        null=True,
    )
    approved_sessions = models.IntegerField(default=0)
    start_date = models.DateField(blank=True, null=True)
    expiry_date = models.DateField(blank=True, null=True)
    insurance_provider = models.CharField(max_length=30, default="thiqa")
    approved_cpt_codes = models.JSONField(default=list, blank=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="active",
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="updated_approval_history_records",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return f"{self.patient.name} - {self.authorization_number} ({self.status})"


class ApprovalAlert(models.Model):
    ALERT_TYPES = [
        ("expired", "Expired"),
        ("near_expiry", "Near Expiry"),
        ("rejected", "Rejected"),
    ]

    STATUS_CHOICES = [
        ("open", "Open"),
        ("resolved", "Resolved"),
    ]

    RESOLUTION_CHOICES = [
        ("renewed", "Renewed"),
        ("call_center_notified", "Call Center Notified"),
        ("patient_notified", "Patient Notified"),
    ]

    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name="approval_alerts",
    )
    alert_type = models.CharField(max_length=30, choices=ALERT_TYPES)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="open",
    )
    resolution_action = models.CharField(
        max_length=40,
        choices=RESOLUTION_CHOICES,
        blank=True,
        null=True,
    )
    notes = models.TextField(blank=True, null=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_approval_alerts",
    )
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="resolved_approval_alerts",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.patient.name} - {self.alert_type} - {self.status}"