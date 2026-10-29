
from django.db import models
from patients.models import Patient
from users.models import User


class Physician(models.Model):
    name = models.CharField(
        max_length=255,
        unique=True,
        db_index=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = ["name"]
        verbose_name = "Physician"
        verbose_name_plural = "Physicians"

    def save(self, *args, **kwargs):
        self.name = self.name.strip()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class PatientAssignment(models.Model):
    CATEGORY_CHOICES = [
        ("appointment", "Has Appointment"),
        ("walk_in", "Walk In"),
        ("cash", "Cash"),
        ("initial_evaluation", "Initial Evaluation"),
        ("task_without_eligibility", "Task Without Eligibility"),
    ]

    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name="assignments",
    )

    therapist = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="therapist_assignments",
        limit_choices_to={"role": "physio"},
    )

    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_assignments",
    )

    assignment_date = models.DateField()

    category = models.CharField(
        max_length=40,
        choices=CATEGORY_CHOICES,
        default="appointment",
    )

    visit_number = models.PositiveIntegerField(
        default=1,
    )

    referring_physician = models.CharField(
        max_length=150,
        blank=True,
        default="",
    )

    speciality = models.CharField(
        max_length=150,
        blank=True,
        default="",
        db_index=True,
    )

    notes = models.TextField(
        blank=True,
        null=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = ["-assignment_date", "-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["patient", "assignment_date"],
                name="unique_patient_assignment_per_day",
            )
        ]

    def __str__(self):
        return (
            f"{self.patient.name} - "
            f"{self.category} - "
            f"{self.assignment_date}"
        )


class PhysioReferral(models.Model):
    STATUS_CHOICES = [
        ("awaiting", "Awaiting Follow-up"),
        ("completed", "Completed"),
    ]

    patient = models.ForeignKey(
        Patient,
        on_delete=models.PROTECT,
        related_name="physio_referrals",
    )

    physician = models.ForeignKey(
        Physician,
        on_delete=models.PROTECT,
        related_name="physio_referrals",
    )

    referred_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_physio_referrals",
    )

    reason = models.TextField()

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="awaiting",
        db_index=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Physio Referral"
        verbose_name_plural = "Physio Referrals"

    def __str__(self):
        patient_name = (
            getattr(self.patient, "name", None)
            or f"Patient #{self.patient_id}"
        )

        return (
            f"{patient_name} - "
            f"{self.get_status_display()} - "
            f"{self.created_at:%Y-%m-%d}"
        )
