from django.db import models
from patients.models import Patient
from users.models import User


class PatientAssignment(models.Model):
    CATEGORY_CHOICES = [
        ("appointment", "Has Appointment"),
        ("walk_in", "Walk In"),
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
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-assignment_date", "-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["patient", "assignment_date"],
                name="unique_patient_assignment_per_day",
            )
        ]

    def __str__(self):
        return f"{self.patient.name} - {self.category} - {self.assignment_date}"