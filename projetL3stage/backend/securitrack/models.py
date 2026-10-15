from datetime import date, timedelta

from django.db import models

from accounts.models import Utilisateur
from camtrack.models import Equipement

SEUIL_EXPIRATION_JOURS = 30


def etat_contrat(date_fin):
    """ACTIF, BIENTOT_EXPIRE (moins de 30 jours) ou EXPIRE, d'après date_fin."""
    aujourdhui = date.today()
    if date_fin < aujourdhui:
        return 'EXPIRE'
    if date_fin <= aujourdhui + timedelta(days=SEUIL_EXPIRATION_JOURS):
        return 'BIENTOT_EXPIRE'
    return 'ACTIF'


class Contrat(models.Model):
    date_debut = models.DateField()
    date_fin = models.DateField()
    client = models.ForeignKey(Utilisateur, on_delete=models.CASCADE, related_name='contrats', limit_choices_to={'role': 'CLIENT'})
    equipements = models.ManyToManyField(Equipement, related_name='contrats', blank=True)

    class Meta:
        db_table = 'contrat'

    def __str__(self):
        return f"Contrat #{self.id}"


class Maintenance(models.Model):
    TYPE_CHOICES = [
        ('PREVENTIVE', 'Préventive'),
        ('CORRECTIVE', 'Corrective'),
    ]
    STATUT_CHOICES = [
        ('PLANIFIEE', 'Planifiée'),
        ('EN_COURS', 'En cours'),
        ('TERMINEE', 'Terminée'),
    ]
    type_maintenance = models.CharField(max_length=10, choices=TYPE_CHOICES)
    statut = models.CharField(max_length=10, choices=STATUT_CHOICES, default='PLANIFIEE')
    date = models.DateField()
    compte_rendu = models.TextField(blank=True)
    technicien = models.ForeignKey(Utilisateur, on_delete=models.SET_NULL, null=True, related_name='maintenances_effectuees', limit_choices_to={'role': 'TECHNICIEN'})
    equipement = models.ForeignKey(Equipement, on_delete=models.CASCADE, related_name='maintenances')

    class Meta:
        db_table = 'maintenance'

    def __str__(self):
        return f"Maintenance {self.type_maintenance} #{self.id}"