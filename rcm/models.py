
from django.conf import settings
from django.db import models
from patients.models import Patient


class Claim(models.Model):
    STATUS_CHOICES = [
        ("Approved", "Approved"),
        ("Rejected", "Rejected"),
        ("Pending", "Pending"),
    ]

    patient = models.ForeignKey(
        Patient,
        on_delete=models.PROTECT,
        related_name="rcm_claims",
    )

    # Keep the existing claim ID and uniqueness rule.
    claim_id = models.CharField(max_length=100)

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="Pending",
    )

    rejection_reason = models.TextField(blank=True, default="")

    # Nullable so existing claims remain intact after migration.
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="rcm_claims_created",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["patient", "claim_id"],
                name="unique_claim_id_per_patient",
            )
        ]

    def __str__(self):
        return f"{self.claim_id} - {self.patient_id}"


class RenewalAlert(models.Model):
    patient = models.ForeignKey(
        Patient,
        on_delete=models.PROTECT,
        related_name="rcm_renewal_alerts",
    )

    renewal_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["renewal_date", "-created_at"]

    def __str__(self):
        return (
            f"Renewal for patient {self.patient_id} "
            f"on {self.renewal_date}"
        )
