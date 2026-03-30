from django.contrib import admin
from .models import Patient


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "patient_id",
        "current_approval_number",
        "sessions_taken",
        "taken_with",
        "created_at",
    )
    search_fields = ("name", "patient_id", "current_approval_number", "taken_with")