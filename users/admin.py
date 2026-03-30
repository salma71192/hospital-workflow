from django.contrib import admin
from .models import User


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("username", "role", "is_superuser", "is_staff")
    search_fields = ("username", "role")
    list_filter = ("role", "is_superuser", "is_staff")