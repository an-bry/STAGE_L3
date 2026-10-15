from datetime import date

from django.db import models

from accounts.models import Utilisateur


class Offre(models.Model):
    """Catalogue d'offres d'abonnement, géré par l'Admin."""
    nom = models.CharField(max_length=100)
    description = models.TextField(blank=True, default='')
    nombre_cameras_inclus = models.PositiveIntegerField()
    prix_abonnement = models.IntegerField(help_text="Prix mensuel en Ar")
    duree_engagement_mois = models.PositiveIntegerField(default=12)
    actif = models.BooleanField(default=True)

    class Meta:
        db_table = 'offre'
        ordering = ['prix_abonnement']

    def __str__(self):
        return f"{self.nom} ({self.nombre_cameras_inclus} caméras)"


class DemandeInstallation(models.Model):
    STATUT_CHOICES = [
        ('EN_ATTENTE', 'En attente'),
        ('VALIDEE', 'Validée'),
        ('REJETEE', 'Rejetée'),
    ]
    date_soumission = models.DateField(auto_now_add=True)
    statut = models.CharField(max_length=10, choices=STATUT_CHOICES, default='EN_ATTENTE')
    client = models.ForeignKey(
        Utilisateur, on_delete=models.CASCADE,
        related_name='demandes_installation',
        limit_choices_to={'role': 'CLIENT'},
    )
    # NOUVEAU : offre choisie (null=True seulement pour les anciennes lignes ;
    # obligatoire côté API)
    offre = models.ForeignKey(
        Offre, on_delete=models.PROTECT,
        null=True, blank=True, related_name='demandes',
    )
    # NOUVEAU : description du besoin saisie par le client
    description = models.TextField(blank=True, default='')

    class Meta:
        db_table = 'demande_installation'
        ordering = ['-date_soumission', '-id']

    def __str__(self):
        return f"Demande #{self.id} - {self.statut}"


class Devis(models.Model):
    montant = models.IntegerField()
    date_etablissement = models.DateField(auto_now_add=True)
    demande = models.OneToOneField(DemandeInstallation, on_delete=models.CASCADE, related_name='devis')

    class Meta:
        db_table = 'devis'

    def __str__(self):
        return f"Devis #{self.id} - {self.montant} Ar"


class LigneDevis(models.Model):
    """Une ligne du devis : matériel / prestation, quantité, prix unitaire."""
    devis = models.ForeignKey(Devis, on_delete=models.CASCADE, related_name='lignes')
    designation = models.CharField(max_length=150)
    quantite = models.PositiveIntegerField()
    prix_unitaire = models.IntegerField(help_text="Prix unitaire en Ar")

    class Meta:
        db_table = 'ligne_devis'
        ordering = ['id']

    @property
    def total(self):
        return self.quantite * self.prix_unitaire

    def __str__(self):
        return f"{self.quantite} x {self.designation}"


class Site(models.Model):
    STATUT_CHOICES = [
        ('EN_ETUDE', 'En étude'),
        ('VALIDE', 'Validé'),
    ]
    date_soumission = models.DateField(auto_now_add=True)
    statut = models.CharField(max_length=10, choices=STATUT_CHOICES, default='EN_ETUDE')
    # NOUVEAU : nom et adresse saisis par le client
    nom = models.CharField(max_length=100, blank=True, default='')
    adresse = models.CharField(max_length=255, blank=True, default='')
    # MODIFIÉ : devient facultatif (rempli plus tard par le technicien)
    adresse_gps = models.CharField(max_length=50, blank=True, default='')
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    notes_faisabilite = models.TextField(blank=True, default='')
    technicien = models.ForeignKey(
        Utilisateur, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='etudes_sites',
        limit_choices_to={'role': 'TECHNICIEN'},
    )
    demande = models.ForeignKey(DemandeInstallation, on_delete=models.CASCADE, related_name='sites')

    class Meta:
        db_table = 'site'

    def __str__(self):
        return f"Site #{self.id} - {self.nom}"


class FichierSite(models.Model):
    """NOUVEAU : photos et plans joints à un site."""
    TYPE_CHOICES = [
        ('PHOTO', 'Photo'),
        ('PLAN', 'Plan'),
    ]
    site = models.ForeignKey(Site, on_delete=models.CASCADE, related_name='fichiers')
    type_fichier = models.CharField(max_length=5, choices=TYPE_CHOICES)
    fichier = models.FileField(upload_to='sites/%Y/%m/')
    date_ajout = models.DateField(auto_now_add=True)

    class Meta:
        db_table = 'fichier_site'

    def __str__(self):
        return f"{self.type_fichier} - site #{self.site_id}"


class Installation(models.Model):
    STATUT_CHOICES = [
        ('PLANIFIEE', 'Planifiée'),
        ('EN_COURS', 'En cours'),
        ('TERMINEE', 'Terminée'),
    ]
    date_installation = models.DateField(null=True, blank=True)
    statut = models.CharField(max_length=10, choices=STATUT_CHOICES, default='PLANIFIEE')
    site = models.ForeignKey(Site, on_delete=models.CASCADE, related_name='installations')
    technicien = models.ForeignKey(
        Utilisateur, on_delete=models.SET_NULL, null=True,
        related_name='installations_realisees',
        limit_choices_to={'role': 'TECHNICIEN'},
    )

    class Meta:
        db_table = 'installation'

    def __str__(self):
        return f"Installation #{self.id}"

    def generer_contenu_rapport(self):
        """Texte du rapport généré à la fin de l'installation."""
        client = self.site.demande.client
        technicien = self.technicien
        nom_technicien = (
            (technicien.get_full_name() or technicien.username) if technicien else 'Non renseigné'
        )

        lignes_equipements = "\n".join(
            f"- {e.get_type_equipement_display()} — {e.model} (IP: {e.adresse_ip or 'non définie'}) "
            f"— garantie du {e.date_debut_garantie} au {e.date_fin_garantie}"
            for e in self.equipements.all()
        ) or "Aucun équipement renseigné."

        return (
            f"Rapport d'installation #{self.id}\n"
            f"Client : {client.get_full_name() or client.username}\n"
            f"Site : {self.site.nom} — {self.site.adresse}\n"
            f"Technicien : {nom_technicien}\n"
            f"Date d'installation : {self.date_installation or 'Non renseignée'}\n\n"
            f"Équipements installés :\n{lignes_equipements}"
        )


class Equipement(models.Model):
    TYPE_CHOICES = [
        ('CAMERA', 'Caméra'),
        ('NVR_DVR', 'NVR/DVR'),
    ]
    STATUT_CHOICES = [
        ('ACTIF', 'Actif'),
        ('EN_PANNE', 'En panne'),
        ('HORS_SERVICE', 'Hors service'),
    ]
    type_equipement = models.CharField(max_length=7, choices=TYPE_CHOICES)
    adresse_ip = models.GenericIPAddressField(blank=True, null=True)
    date_debut_garantie = models.DateField()
    date_fin_garantie = models.DateField()
    model = models.CharField(max_length=50)
    statut = models.CharField(max_length=12, choices=STATUT_CHOICES, default='ACTIF')
    installation = models.ForeignKey(Installation, on_delete=models.CASCADE, related_name='equipements')

    @property
    def garantie_expiree(self):
        return date.today() > self.date_fin_garantie

    @property
    def garantie_jours_restants(self):
        delta = self.date_fin_garantie - date.today()
        return delta.days  # négatif si déjà expirée

    class Meta:
        db_table = 'equipement'

    def __str__(self):
        return f"{self.type_equipement} - {self.model}"


class FichierInstallation(models.Model):
    """Photos prises pendant l'installation (distinct des photos du site à l'étude)."""
    installation = models.ForeignKey(Installation, on_delete=models.CASCADE, related_name='fichiers')
    fichier = models.FileField(upload_to='installations/%Y/%m/')
    date_ajout = models.DateField(auto_now_add=True)

    class Meta:
        db_table = 'fichier_installation'

    def __str__(self):
        return f"Photo installation #{self.installation_id}"


class RapportInstallation(models.Model):
    contenu = models.TextField()
    date_creation = models.DateField(auto_now_add=True)
    validation_client = models.BooleanField(default=False)
    date_validation = models.DateTimeField(null=True, blank=True)

    installation = models.OneToOneField(
        Installation, on_delete=models.CASCADE, related_name='rapport'
    )

    class Meta:
        db_table = 'rapport_installation'

    def __str__(self):
        return f"Rapport installation #{self.installation_id} ({'validé' if self.validation_client else 'en attente'})"


class Commentaire(models.Model):
    VISIBILITE_CHOICES = [
        ('INTERNE', 'Interne'),
        ('PUBLIC', 'Public'),
    ]

    demande = models.ForeignKey(DemandeInstallation, on_delete=models.CASCADE, related_name='commentaires')
    auteur = models.ForeignKey(Utilisateur, on_delete=models.SET_NULL, null=True, related_name='commentaires_camtrack')
    contenu = models.TextField()
    visibilite = models.CharField(max_length=7, choices=VISIBILITE_CHOICES, default='PUBLIC')
    date = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'commentaire_camtrack'
        ordering = ['date']

    def __str__(self):
        return f"Commentaire #{self.id} sur Demande #{self.demande_id} ({self.visibilite})"