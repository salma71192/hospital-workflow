from django.db import models


class Patient(models.Model):
    name = models.CharField(max_length=255)
    patient_id = models.CharField(max_length=100, unique=True)
    current_approval_number = models.CharField(max_length=100, blank=True, null=True)
    sessions_taken = models.PositiveIntegerField(default=0)
    taken_with = models.CharField(max_length=255, blank=True, null=True)
    current_future_appointments = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.patient_id})"