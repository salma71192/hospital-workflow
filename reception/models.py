from django.db import models
from patients.models import Patient
from users.models import User


class PatientAssignment(models.Model):
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
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-assignment_date", "-created_at"]

    def __str__(self):
        return f"{self.patient.name} -> {self.therapist.username} on {self.assignment_date}"