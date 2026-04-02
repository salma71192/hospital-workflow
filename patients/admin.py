from django.contrib import admin
from .models import Patient


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "patient_id",
        "current_approval_number",
        "approval_start_date",
        "approval_expiry_date",
        "approved_sessions",
        "insurance_provider",
        "sessions_taken",
        "taken_with",
        "created_at",
    )

    search_fields = (
        "name",
        "patient_id",
        "current_approval_number",
        "insurance_provider",
        "taken_with",
    )

    list_filter = (
        "insurance_provider",
        "approval_start_date",
        "approval_expiry_date",
        "created_at",
    )

    ordering = ("-created_at",)