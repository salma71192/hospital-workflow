from django.contrib import admin
from .models import TherapySession

@admin.register(TherapySession)
class TherapySessionAdmin(admin.ModelAdmin):
    list_display = ('id', 'patient', 'therapist', 'session_date', 'status')
    list_filter = ('status', 'session_date', 'therapist')
    search_fields = ('patient__full_name', 'therapist__username')