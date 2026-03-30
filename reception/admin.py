from django.contrib import admin
from .models import PatientAssignment


@admin.register(PatientAssignment)
class PatientAssignmentAdmin(admin.ModelAdmin):
    list_display = ("patient", "therapist", "assignment_date", "created_at")
    search_fields = ("patient__name", "patient__patient_id", "therapist__username")
    list_filter = ("assignment_date", "therapist")