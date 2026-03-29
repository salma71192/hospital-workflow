from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_RECEPTION = "reception"
    ROLE_PHYSIO = "physio"
    ROLE_VISITOR = "visitor"
    ROLE_DOCTOR = "doctor"
    ROLE_RCM = "rcm"
    ROLE_CALLCENTER = "callcenter"

    ROLE_CHOICES = [
        ("physio", "Physio"),
        ("reception", "Reception"),
        ("visitor", "Visitor"),
        ("doctor", "Doctor"),
        ("rcm", "RCM"),
        ("callcenter", "Call Center"),
    ]

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        blank=True,
        null=True
    )