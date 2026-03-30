from django.db import models


class Patient(models.Model):
    name = models.CharField(max_length=255)
    patient_id = models.CharField(max_length=100, unique=True, null=True, blank=True)
    def __str__(self):
        return f"{self.name} ({self.patient_id})"