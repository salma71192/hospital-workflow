from django.db import models
from django.conf import settings
from patients.models import Patient


class Task(models.Model):

    TASK_TYPES = [
        ("physio_session", "Physio Session"),
    ]

    STATUS = [
        ("pending", "Pending"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    ]

    task_type = models.CharField(max_length=50, choices=TASK_TYPES)

    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE
    )

    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="tasks"
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_tasks"
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS,
        default="pending"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.patient} - {self.task_type}"