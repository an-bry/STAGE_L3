from django.db import models
from django.utils import timezone
from datetime import datetime, date, timedelta
from accounts.models import Utilisateur


class Ticket(models.Model):
    PRIORITE_CHOICES = [
        ('FAIBLE', 'Faible'),
        ('MOYENNE', 'Moyenne'),
        ('HAUTE', 'Haute'),
        ('CRITIQUE', 'Critique'),
    ]
    STATUT_CHOICES = [
        ('BROUILLON', 'Brouillon'),
        ('NOUVEAU', 'Nouveau'),
        ('A_QUALIFIER', 'À qualifier'),
        ('AFFECTE', 'Affecté'),
        ('PLANIFIE', 'Planifié'),
        ('EN_COURS', 'En cours'),
        ('EN_ATTENTE', 'En attente'),
        ('RESOLU', 'Résolu'),
        ('CLOTURE', 'Clôturé'),
    ]
    IMPACT_CHOICES = [
        ('FAIBLE', 'Faible'),
        ('MOYEN', 'Moyen'),
        ('ELEVE', 'Élevé'),
        ('CRITIQUE', 'Critique'),
    ]

    date_creation = models.DateField(auto_now_add=True)
    priorite = models.CharField(max_length=8, choices=PRIORITE_CHOICES, default='MOYENNE')
    statut = models.CharField(max_length=11, choices=STATUT_CHOICES, default='NOUVEAU')
    description = models.TextField()

    # Informations enrichies (formulaire de création client)
    categorie = models.CharField(max_length=100, blank=True, default='')
    equipement = models.CharField(max_length=150, blank=True, default='')
    equipement_ref = models.ForeignKey(
        'camtrack.Equipement', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='tickets',
    )
    site = models.CharField(max_length=150, blank=True, default='')
    localisation_precise = models.CharField(max_length=200, blank=True, default='')
    niveau_impact = models.CharField(max_length=8, choices=IMPACT_CHOICES, default='MOYEN')
    nombre_utilisateurs_affectes = models.PositiveIntegerField(default=1)
    date_heure_apparition = models.DateTimeField(null=True, blank=True)
    disponibilites_client = models.CharField(max_length=255, blank=True, default='')

    # SLA
    sla_deadline = models.DateTimeField(null=True, blank=True)

    # Empêche le recalcul automatique d'écraser une priorité fixée à la main par l'Admin
    # (voir Ticket.calculer_priorite / TicketPrioriteManuelleView)
    priorite_modifiee_manuellement = models.BooleanField(default=False)

    client = models.ForeignKey(Utilisateur, on_delete=models.CASCADE, related_name='tickets_crees', limit_choices_to={'role': 'CLIENT'})
    technicien = models.ForeignKey(Utilisateur, on_delete=models.SET_NULL, null=True, blank=True, related_name='tickets_affectes', limit_choices_to={'role': 'TECHNICIEN'})

    class Meta:
        db_table = 'ticket'
        ordering = ['-priorite', 'date_creation']

    @property
    def sla_restant(self):
        """Retourne le temps restant avant la deadline SLA, ou None si non définie."""
        if not self.sla_deadline:
            return None
        return self.sla_deadline - timezone.now()

    @property
    def sla_depasse(self):
        if not self.sla_deadline:
            return False
        return timezone.now() > self.sla_deadline

    def calculer_priorite(self):
        # Une priorité fixée manuellement par l'Admin (TicketPrioriteManuelleView) ne doit
        # jamais être recalculée/écrasée automatiquement par les sauvegardes ultérieures.
        if self.priorite_modifiee_manuellement:
            return self.priorite

        tickets_actifs_client = Ticket.objects.filter(
            client=self.client,
            statut__in=['NOUVEAU', 'A_QUALIFIER', 'AFFECTE', 'PLANIFIE', 'EN_COURS', 'EN_ATTENTE']
        ).exclude(pk=self.pk).count()

        if tickets_actifs_client >= 2:
            return 'HAUTE'

        if self.pk and self.statut == 'NOUVEAU' and self.date_creation:
            if timezone.now().date() - self.date_creation > timedelta(days=2):
                return 'HAUTE'

        return self.priorite if self.priorite else 'MOYENNE'

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        nouvelle_priorite = self.calculer_priorite()
        if nouvelle_priorite != self.priorite:
            self.priorite = nouvelle_priorite
            super().save(update_fields=['priorite'])

    def __str__(self):
        return f"Ticket #{self.id} - {self.statut}"


class Intervention(models.Model):
    STATUT_CHOICES = [
        ('EN_COURS', 'En cours'),
        ('TERMINEE', 'Terminée'),
        ('VALIDEE', 'Validée'),
    ]

    date = models.DateField(auto_now_add=True)
    statut = models.CharField(max_length=8, choices=STATUT_CHOICES, default='EN_COURS')
    diagnostic = models.TextField()
    validation_client = models.BooleanField(default=False)

    # Champs enrichis (Lot 5)
    symptomes_constates = models.TextField(blank=True, default='')
    tests_effectues = models.TextField(blank=True, default='')
    cause_probable = models.CharField(max_length=200, blank=True, default='')
    cause_confirmee = models.CharField(max_length=200, blank=True, default='')
    resultat_intervention = models.TextField(blank=True, default='')
    temps_passe_minutes = models.PositiveIntegerField(null=True, blank=True)
    checklist_securite = models.JSONField(default=list, blank=True)

    technicien = models.ForeignKey(
        Utilisateur,
        on_delete=models.CASCADE,
        related_name='interventions',
        limit_choices_to={'role': 'TECHNICIEN'}
    )
    ticket = models.ForeignKey(
        Ticket,
        on_delete=models.CASCADE,
        related_name='interventions'
    )

    class Meta:
        db_table = 'intervention'
        ordering = ['-date', '-id']

    def generer_contenu_rapport(self):
        client = self.ticket.client
        pieces = self.pieces_utilisees.all()

        lignes_pieces = "\n".join(
            f"- {p.nom} x{p.quantite} — {p.prix_unitaire} Ar (sous-total : {p.cout_total} Ar)"
            for p in pieces
        ) or "Aucune pièce utilisée."

        cout_total = sum(p.cout_total for p in pieces)

        details = ""
        if self.symptomes_constates:
            details += f"\nSymptômes constatés :\n{self.symptomes_constates}\n"
        if self.tests_effectues:
            details += f"\nTests effectués :\n{self.tests_effectues}\n"
        if self.cause_confirmee:
            details += f"\nCause confirmée : {self.cause_confirmee}\n"
        elif self.cause_probable:
            details += f"\nCause probable : {self.cause_probable}\n"
        if self.resultat_intervention:
            details += f"\nRésultat de l'intervention :\n{self.resultat_intervention}\n"
        if self.temps_passe_minutes:
            details += f"\nTemps passé : {self.temps_passe_minutes} min\n"

        return (
            f"Rapport d'intervention #{self.id}\n"
            f"Ticket créé par : {client.get_full_name() or client.username} — "
            f"Raison : {self.ticket.description}\n"
            f"Technicien : {self.technicien.get_full_name() or self.technicien.username}\n"
            f"Date : {self.date}\n\n"
            f"Diagnostic :\n{self.diagnostic}\n"
            f"{details}\n"
            f"Pièces utilisées :\n{lignes_pieces}\n\n"
            f"Coût total des pièces : {cout_total} Ar"
        )

    def __str__(self):
        return f"Intervention #{self.id} - Ticket #{self.ticket_id}"


class Piece(models.Model):
    reference = models.CharField(max_length=50, unique=True)
    designation = models.CharField(max_length=150)
    stock_actuel = models.PositiveIntegerField(default=0)
    lieu_stockage = models.CharField(max_length=100, blank=True, default='')
    prix_unitaire = models.PositiveIntegerField(default=0, help_text="Prix unitaire en Ariary")

    class Meta:
        db_table = 'piece_catalogue'
        ordering = ['designation']

    def __str__(self):
        return f"{self.reference} — {self.designation} (stock: {self.stock_actuel})"


class PieceUtilisee(models.Model):
    STATUT_CHOICES = [
        ('REMPLACEE', 'Remplacée'),
        ('REPAREE', 'Réparée'),
        ('A_COMMANDER', 'À commander'),
    ]

    nom = models.CharField(max_length=100)
    reference = models.CharField(max_length=50, blank=True, default='')
    quantite = models.PositiveIntegerField(default=1)
    prix_unitaire = models.PositiveIntegerField(default=0, help_text="Prix unitaire en Ariary")

    piece = models.ForeignKey(
        'Piece',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='utilisations'
    )
    numero_serie = models.CharField(max_length=100, blank=True, default='')
    statut_piece = models.CharField(max_length=11, choices=STATUT_CHOICES, default='REMPLACEE')
    piece_recuperee = models.BooleanField(default=False)

    intervention = models.ForeignKey(
        Intervention,
        on_delete=models.CASCADE,
        related_name='pieces_utilisees'
    )

    class Meta:
        db_table = 'piece_utilisee'

    @property
    def cout_total(self):
        return self.quantite * self.prix_unitaire

    def __str__(self):
        return f"{self.nom} x{self.quantite} (Intervention #{self.intervention_id})"


class Rapport(models.Model):
    TYPE_CHOICES = [
        ('INSTALLATION', 'Installation'),
        ('INTERVENTION', 'Intervention'),
    ]

    contenu = models.TextField()
    type_rapport = models.CharField(max_length=13, choices=TYPE_CHOICES, default='INTERVENTION')
    date_creation = models.DateField(auto_now_add=True)

    intervention = models.OneToOneField(
        Intervention,
        on_delete=models.CASCADE,
        related_name='rapport',
        null=True,
        blank=True
    )

    class Meta:
        db_table = 'rapport'

    def __str__(self):
        return f"Rapport #{self.id} ({self.type_rapport})"


class HistoriqueTicket(models.Model):
    CHAMP_CHOICES = [
        ('STATUT', 'Statut'),
        ('PRIORITE', 'Priorité'),
        ('TECHNICIEN', 'Technicien affecté'),
        ('PLANIFICATION', 'Planification'),
    ]

    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='historique')
    champ_modifie = models.CharField(max_length=20, choices=CHAMP_CHOICES)
    ancienne_valeur = models.CharField(max_length=100, blank=True, default='')
    nouvelle_valeur = models.CharField(max_length=100)
    justification = models.TextField(blank=True, default='')
    auteur = models.ForeignKey(Utilisateur, on_delete=models.SET_NULL, null=True, related_name='changements_ticket')
    date = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'historique_ticket'
        ordering = ['-date']

    def __str__(self):
        return f"Ticket #{self.ticket_id} — {self.champ_modifie} : {self.ancienne_valeur} → {self.nouvelle_valeur}"


def enregistrer_historique(ticket, champ_modifie, ancienne_valeur, nouvelle_valeur, auteur, justification=''):
    """Helper pour tracer un changement dans HistoriqueTicket."""
    HistoriqueTicket.objects.create(
        ticket=ticket,
        champ_modifie=champ_modifie,
        ancienne_valeur=str(ancienne_valeur),
        nouvelle_valeur=str(nouvelle_valeur),
        justification=justification,
        auteur=auteur,
    )


class Commentaire(models.Model):
    VISIBILITE_CHOICES = [
        ('INTERNE', 'Interne'),
        ('PUBLIC', 'Public'),
    ]

    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='commentaires')
    auteur = models.ForeignKey(Utilisateur, on_delete=models.SET_NULL, null=True, related_name='commentaires')
    contenu = models.TextField()
    visibilite = models.CharField(max_length=7, choices=VISIBILITE_CHOICES, default='PUBLIC')
    date = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'commentaire'
        ordering = ['date']

    def __str__(self):
        return f"Commentaire #{self.id} sur Ticket #{self.ticket_id} ({self.visibilite})"


class Planification(models.Model):
    STATUT_CHOICES = [
        ('PLANIFIEE', 'Planifiée'),
        ('ANNULEE', 'Annulée'),
    ]

    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='planifications')
    technicien = models.ForeignKey(
        Utilisateur, on_delete=models.CASCADE, related_name='planifications',
        limit_choices_to={'role': 'TECHNICIEN'}
    )
    date = models.DateField()
    heure_debut = models.TimeField()
    duree_estimee_minutes = models.PositiveIntegerField(default=60)
    statut = models.CharField(max_length=9, choices=STATUT_CHOICES, default='PLANIFIEE')
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'planification'
        ordering = ['date', 'heure_debut']

    @property
    def heure_fin(self):
        debut = datetime.combine(self.date, self.heure_debut)
        return (debut + timedelta(minutes=self.duree_estimee_minutes)).time()

    def __str__(self):
        return f"Planification #{self.id} - Ticket #{self.ticket_id} - {self.date} {self.heure_debut}"


class Notification(models.Model):
    utilisateur = models.ForeignKey(Utilisateur, on_delete=models.CASCADE, related_name='notifications')
    message = models.CharField(max_length=255)
    lien = models.CharField(max_length=100, blank=True, default='')  # ex: "ticket:12"
    lu = models.BooleanField(default=False)
    date = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notification'
        ordering = ['-date']

    def __str__(self):
        return f"Notif → {self.utilisateur.username} : {self.message[:40]}"


# ==== Lot 10 - Devis ====
class PieceDemandee(models.Model):
    """
    Pièce jugée nécessaire par le Technicien pendant le diagnostic (AVANT le devis).
    Aucun prix ici : c'est l'Admin qui chiffre dans le Devis.
    Ne touche pas au stock (le stock ne bouge qu'avec PieceUtilisee).
    """
    intervention = models.ForeignKey(Intervention, on_delete=models.CASCADE, related_name='pieces_demandees')
    piece = models.ForeignKey('Piece', on_delete=models.SET_NULL, null=True, blank=True, related_name='demandes')
    nom = models.CharField(max_length=100)
    reference = models.CharField(max_length=50, blank=True, default='')
    quantite = models.PositiveIntegerField(default=1)

    class Meta:
        db_table = 'ticket_piece_demandee'
        ordering = ['id']

    def __str__(self):
        return f"{self.nom} x{self.quantite} (demandée, Intervention #{self.intervention_id})"


class Devis(models.Model):
    STATUT_CHOICES = [
        ('BROUILLON', 'Brouillon'),
        ('ENVOYE', 'Envoyé'),
        ('ACCEPTE', 'Accepté'),
        ('REFUSE', 'Refusé'),
    ]

    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='devis')
    revision = models.PositiveIntegerField(default=1)
    statut = models.CharField(max_length=10, choices=STATUT_CHOICES, default='BROUILLON')
    montant_main_oeuvre = models.PositiveIntegerField(default=0, help_text="Main d'oeuvre en Ariary")
    remise = models.PositiveIntegerField(default=0, help_text="Remise en Ariary")
    commentaire = models.TextField(blank=True, default='')
    motif_refus = models.TextField(blank=True, default='')
    cree_par = models.ForeignKey(Utilisateur, on_delete=models.SET_NULL, null=True, related_name='devis_ticket_crees')
    date_creation = models.DateTimeField(auto_now_add=True)
    date_envoi = models.DateTimeField(null=True, blank=True)
    date_reponse = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'ticket_devis'
        ordering = ['-revision']

    @property
    def montant_pieces(self):
        return sum(l.quantite * l.prix_unitaire for l in self.lignes.all())

    @property
    def montant_total(self):
        return max(self.montant_pieces + self.montant_main_oeuvre - self.remise, 0)

    def __str__(self):
        return f"Devis #{self.id} (rév. {self.revision}) - Ticket #{self.ticket_id} - {self.statut}"


class LigneDevis(models.Model):
    devis = models.ForeignKey(Devis, on_delete=models.CASCADE, related_name='lignes')
    piece = models.ForeignKey('Piece', on_delete=models.SET_NULL, null=True, blank=True, related_name='lignes_devis')
    designation = models.CharField(max_length=150)
    quantite = models.PositiveIntegerField(default=1)
    prix_unitaire = models.PositiveIntegerField(default=0, help_text="Prix unitaire en Ariary")

    class Meta:
        db_table = 'ticket_ligne_devis'
        ordering = ['id']

    @property
    def sous_total(self):
        return self.quantite * self.prix_unitaire

    def __str__(self):
        return f"{self.designation} x{self.quantite} (Devis #{self.devis_id})"