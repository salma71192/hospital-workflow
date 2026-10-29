
from django.conf import settings
from django.db import models
from patients.models import Patient


class Claim(models.Model):
    STATUS_CHOICES = [
        ("Approved", "Approved"),
        ("Rejected", "Rejected"),
        ("Pending", "Pending"),
        ("Submitted", "Submitted"),
    ]

    patient = models.ForeignKey(
        Patient,
        on_delete=models.PROTECT,
        related_name="rcm_claims",
    )

    claim_id = models.CharField(max_length=100)

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="Pending",
    )

    rejection_reason = models.TextField(
        blank=True,
        default="",
    )

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
        ordering = ["-created_at", "-pk"]
        constraints = [
            models.UniqueConstraint(
                fields=["patient", "claim_id"],
                name="unique_claim_id_per_patient",
            )
        ]

    def __str__(self):
        return f"{self.claim_id} - {self.patient_id}"


class ClaimHistory(models.Model):
    """
    Permanent audit record for claim creation, rejection,
    resubmission, approval, status changes, and renewals.
    """

    EVENT_CHOICES = [
        ("Created", "Created"),
        ("Rejected", "Rejected"),
        ("Resubmitted", "Resubmitted"),
        ("Submitted", "Submitted"),
        ("Approved", "Approved"),
        ("Status Changed", "Status Changed"),
        ("Renewal Scheduled", "Renewal Scheduled"),
    ]

    claim = models.ForeignKey(
        Claim,
        on_delete=models.PROTECT,
        related_name="history_records",
    )

    event = models.CharField(
        max_length=30,
        choices=EVENT_CHOICES,
    )

    previous_status = models.CharField(
        max_length=20,
        blank=True,
        default="",
    )

    new_status = models.CharField(
        max_length=20,
        blank=True,
        default="",
    )

    rejection_reason = models.TextField(
        blank=True,
        default="",
    )

    notes = models.TextField(
        blank=True,
        default="",
    )

    renewal_date = models.DateField(
        null=True,
        blank=True,
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="rcm_claim_history_created",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at", "pk"]

    def __str__(self):
        return (
            f"{self.claim.claim_id} - "
            f"{self.event} - {self.created_at}"
        )


class RenewalAlert(models.Model):
    ALERT_TYPE_CHOICES = [
        ("renewal", "Renewal"),
        ("rejection", "Rejection"),
    ]

    STATUS_CHOICES = [
        ("Pending", "Pending"),
        ("Submitted", "Submitted"),
        ("Approved", "Approved"),
        ("Rejected", "Rejected"),
    ]

    patient = models.ForeignKey(
        Patient,
        on_delete=models.PROTECT,
        related_name="rcm_renewal_alerts",
    )

    # Link to the existing claim when available.
    claim = models.ForeignKey(
        Claim,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="renewal_alerts",
    )

    # Preserve the Claim ID for display and history.
    claim_id_value = models.CharField(
        max_length=100,
        blank=True,
        default="",
    )

    alert_type = models.CharField(
        max_length=20,
        choices=ALERT_TYPE_CHOICES,
        default="renewal",
    )

    renewal_date = models.DateField()

    rejection_reason = models.TextField(
        blank=True,
        default="",
    )

    message = models.TextField(
        blank=True,
        default="",
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="Pending",
    )

    submission_date = models.DateTimeField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["renewal_date", "-created_at", "-pk"]

    def save(self, *args, **kwargs):
        """
        Keep the renewal alert's status aligned with its linked claim.

        The claim is authoritative when a linked claim exists.
        The alert's own status is retained when no claim is linked.
        """
        if self.claim_id:
            # Use the linked claim's current database status so that
            # an outdated in-memory claim object does not override it.
            claim_status = (
                Claim.objects.filter(pk=self.claim_id)
                .values_list("status", flat=True)
                .first()
            )

            if claim_status in {"Pending", "Submitted", "Approved", "Rejected"}:
                self.status = claim_status

            if not self.claim_id_value:
                claim = Claim.objects.filter(pk=self.claim_id).only(
                    "claim_id"
                ).first()

                if claim:
                    self.claim_id_value = claim.claim_id

        update_fields = kwargs.get("update_fields")

        # If the caller uses update_fields, include synchronized fields
        # so that the status and preserved Claim ID are actually saved.
        if update_fields is not None:
            update_fields = set(update_fields)
            update_fields.update({"status", "claim_id_value"})
            kwargs["update_fields"] = update_fields

        super().save(*args, **kwargs)

    def __str__(self):
        return (
            f"{self.alert_type.title()} alert for "
            f"patient {self.patient_id} on {self.renewal_date}"
        )
