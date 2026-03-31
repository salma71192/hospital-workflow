from django.db import models


class Patient(models.Model):
    name = models.CharField(max_length=255)
    patient_id = models.CharField(max_length=100, unique=True)
    current_approval_number = models.CharField(max_length=100, blank=True, null=True)

    approved_sessions = models.PositiveIntegerField(default=0)
    utilized_sessions = models.PositiveIntegerField(default=0)
    number_of_evaluations = models.PositiveIntegerField(default=0)
    booking = models.CharField(max_length=255, blank=True, null=True)

    taken_with = models.CharField(max_length=255, blank=True, null=True)
    current_future_appointments = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.patient_id})"