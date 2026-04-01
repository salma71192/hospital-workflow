from django.contrib import admin
from .models import Patient


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "patient_id",
        "current_approval_number",
        "approved_sessions",
        "utilized_sessions",
        "number_of_evaluations",
        "booking",
        "taken_with",
        "created_at",
    )
    search_fields = (
        "name",
        "patient_id",
        "current_approval_number",
        "booking",
        "taken_with",
    )
    list_filter = ("created_at",)