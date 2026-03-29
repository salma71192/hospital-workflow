from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_CHOICES = [
        ("admin", "Admin"),
        ("physio", "Physio"),
        ("reception", "Reception"),
        ("visitor", "Visitor"),
        ("doctor", "Doctor"),
        ("rcm", "RCM"),
        ("callcenter", "Call Center"),
    ]

    role = models.CharField(
        max_length=50,
        choices=ROLE_CHOICES,
        blank=True,
        null=True,
    )

    def __str__(self):
        return self.username