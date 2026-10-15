from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.db import models


class Utilisateur(AbstractUser):
    ROLE_CHOICES = [
        ('ADMIN', 'Administrateur'),
        ('CLIENT', 'Client'),
        ('TECHNICIEN', 'Technicien'),
    ]

    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    telephone = models.CharField(max_length=15, blank=True, null=True)
    raison_sociale = models.CharField(max_length=100, blank=True, null=True)
    specialite = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        db_table = 'utilisateur'

    def clean(self):
        super().clean()
        if self.role == 'CLIENT' and self.specialite:
            raise ValidationError("Un client ne doit pas avoir de spécialité.")
        if self.role == 'TECHNICIEN' and self.raison_sociale:
            raise ValidationError("Un technicien ne doit pas avoir de raison sociale.")
        if self.role == 'ADMIN' and (self.raison_sociale or self.specialite):
            raise ValidationError("Un admin ne doit avoir ni raison sociale ni spécialité.")

    def __str__(self):
        return f"{self.username} - {self.role}"