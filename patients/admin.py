# patients/admin.py
from django.contrib import admin
from .models import Patient

@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'file_number', 'created_by')
    search_fields = ('full_name', 'file_number')