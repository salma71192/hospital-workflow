from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):

    ROLE_ADMIN = "admin"
    ROLE_PHYSIO = "physio"
    ROLE_CALL_CENTER = "call_center"
    ROLE_BILLING = "billing"

    ROLE_CHOICES = [
    ('reception', 'Receptionist'),
    ('physiotherapist', 'Physiotherapist'),
    ('callcenter', 'Call Center'),
    ('approvals', 'Approvals'),
    ('rcm', 'RCM'),
    ('visitors', 'Visitors'),
    ('admin', 'Admin'),
]

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default="visitors"

    )

    def __str__(self):
        return f"{self.username} - {self.role}"