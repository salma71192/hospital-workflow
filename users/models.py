from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_CHOICES = [
        ("admin", "Admin"),
        ("approvals", "Approvals"),
        ("physio", "Physio"),
        ("reception", "Reception"),
        ("reception_supervisor", "Reception Supervisor"),
        ("visitor", "Visitor"),
        ("visitor_ceo", "Visitor CEO"),
        ("doctor", "Doctor"),
        ("rcm", "RCM"),
        ("callcenter", "Call Center"),
        ("callcenter_supervisor", "Call Center Supervisor"),
    ]

    role = models.CharField(
        max_length=50,
        choices=ROLE_CHOICES,
        blank=True,
        null=True,
    )

    def __str__(self):
        return self.username