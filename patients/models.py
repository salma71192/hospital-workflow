# patients/models.py
from django.db import models
from django.conf import settings

class Patient(models.Model):
    full_name = models.CharField(max_length=255)
    file_number = models.CharField(max_length=50, unique=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.full_name} ({self.file_number})"