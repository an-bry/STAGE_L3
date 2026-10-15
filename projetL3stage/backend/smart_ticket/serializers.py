from datetime import date
from rest_framework import serializers

from accounts.models import Utilisateur
from .models import (
    Ticket,
    Intervention,
    PieceUtilisee,
    Rapport,
    HistoriqueTicket,
    Commentaire,
    Planification,
    Piece,
    Notification,
    PieceDemandee,
    Devis,
    LigneDevis,
)

from camtrack.models import Equipement
class UtilisateurResumeSerializer(serializers.ModelSerializer):
    """Version allégée pour afficher client/technicien dans un ticket"""
    class Meta:
        model = Utilisateur
        fields = ['id', 'username', 'first_name', 'last_name', 'telephone']


# Champs enrichis communs à plusieurs serializers de lecture du Ticket
TICKET_CHAMPS_ENRICHIS = [
    'categorie', 'equipement', 'equipement_ref', 'site', 'localisation_precise',
    'niveau_impact', 'nombre_utilisateurs_affectes', 'date_heure_apparition',
    'disponibilites_client', 'sla_deadline', 'sla_restant', 'sla_depasse',
]

class TicketSerializer(serializers.ModelSerializer):
    sla_restant = serializers.SerializerMethodField()
    sla_depasse = serializers.ReadOnlyField()

    class Meta:
        model = Ticket
        fields = ['id', 'date_creation', 'priorite', 'statut', 'description', 'client', 'technicien'] + TICKET_CHAMPS_ENRICHIS
        read_only_fields = ['id', 'date_creation', 'priorite', 'statut', 'client', 'technicien'] + TICKET_CHAMPS_ENRICHIS

    def get_sla_restant(self, obj):
        restant = obj.sla_restant
        if restant is None:
            return None
        return int(restant.total_seconds())


class TicketTechnicienSerializer(serializers.ModelSerializer):
    """Vue pour le Technicien : montre les infos du client"""
    client = UtilisateurResumeSerializer(read_only=True)
    sla_restant = serializers.SerializerMethodField()
    sla_depasse = serializers.ReadOnlyField()

    class Meta:
        model = Ticket
        fields = ['id', 'date_creation', 'priorite', 'statut', 'description', 'client'] + TICKET_CHAMPS_ENRICHIS
        read_only_fields = ['id', 'date_creation', 'priorite', 'statut', 'client'] + TICKET_CHAMPS_ENRICHIS

    def get_sla_restant(self, obj):
        restant = obj.sla_restant
        if restant is None:
            return None
        return int(restant.total_seconds())
class TicketCreateSerializer(serializers.ModelSerializer):
    # Facultatif : l'équipement concerné, choisi parmi ceux du client
    equipement_ref = serializers.PrimaryKeyRelatedField(
        queryset=Equipement.objects.select_related('installation__site__demande'),
        required=False,
        allow_null=True,
        error_messages={'does_not_exist': "Cet équipement n'existe pas ou ne vous appartient pas."},
    )

    class Meta:
        model = Ticket
        fields = [
            'description', 'categorie', 'equipement', 'equipement_ref', 'site',
            'localisation_precise', 'niveau_impact', 'nombre_utilisateurs_affectes',
            'date_heure_apparition', 'disponibilites_client',
        ]

    def validate_description(self, value):
        if not value or len(value.strip()) < 10:
            raise serializers.ValidationError("La description doit contenir au moins 10 caractères.")
        return value

    def validate_equipement_ref(self, equipement):
        if equipement is None:
            return None
        utilisateur = self.context['request'].user
        if equipement.installation.site.demande.client_id != utilisateur.id:
            raise serializers.ValidationError("Cet équipement n'existe pas ou ne vous appartient pas.")
        if equipement.statut == 'HORS_SERVICE':
            raise serializers.ValidationError("Cet équipement est hors service.")
        return equipement

    def validate(self, attrs):
        equipement = attrs.get('equipement_ref')
        if equipement:
            # Garde les anciens champs texte cohérents avec l'équipement choisi
            if not attrs.get('equipement'):
                attrs['equipement'] = f"{equipement.get_type_equipement_display()} {equipement.model}"[:150]
            if not attrs.get('site'):
                attrs['site'] = equipement.installation.site.nom[:150]
        return attrs
class TicketAffecterSerializer(serializers.ModelSerializer):
    technicien = serializers.PrimaryKeyRelatedField(
        queryset=Utilisateur.objects.filter(role='TECHNICIEN')
    )

    class Meta:
        model = Ticket
        fields = ['technicien']


class InterventionSerializer(serializers.ModelSerializer):
    technicien = UtilisateurResumeSerializer(read_only=True)

    class Meta:
        model = Intervention
        fields = [
            'id', 'date', 'statut', 'diagnostic', 'validation_client', 'technicien', 'ticket',
            'symptomes_constates', 'tests_effectues', 'cause_probable', 'cause_confirmee',
            'resultat_intervention', 'temps_passe_minutes', 'checklist_securite',
        ]
        read_only_fields = ['id', 'date', 'statut', 'validation_client', 'technicien', 'ticket']


class InterventionCreateSerializer(serializers.ModelSerializer):
    """Le Technicien ne saisit que le diagnostic ; le reste est déduit côté vue"""
    class Meta:
        model = Intervention
        fields = ['diagnostic']

    def validate_diagnostic(self, value):
        if not value or len(value.strip()) < 10:
            raise serializers.ValidationError("Le diagnostic doit contenir au moins 10 caractères.")
        return value


class PieceSerializer(serializers.ModelSerializer):
    """Catalogue de pièces avec stock"""
    class Meta:
        model = Piece
        fields = ['id', 'reference', 'designation', 'stock_actuel', 'lieu_stockage', 'prix_unitaire']


class PieceUtiliseeSerializer(serializers.ModelSerializer):
    """Vue en lecture d'une pièce utilisée (avec coût total calculé)"""
    cout_total = serializers.ReadOnlyField()
    piece = PieceSerializer(read_only=True)

    class Meta:
        model = PieceUtilisee
        fields = [
            'id', 'nom', 'reference', 'quantite', 'prix_unitaire', 'cout_total', 'intervention',
            'piece', 'numero_serie', 'statut_piece', 'piece_recuperee',
        ]
        read_only_fields = ['id', 'intervention']


class PieceUtiliseeCreateSerializer(serializers.ModelSerializer):
    """
    Le Technicien peut soit référencer une pièce du catalogue (nom/référence/prix
    dérivés automatiquement, stock décrémenté), soit saisir une pièce libre.
    """
    piece = serializers.PrimaryKeyRelatedField(queryset=Piece.objects.all(), required=False, allow_null=True)

    class Meta:
        model = PieceUtilisee
        fields = ['nom', 'reference', 'quantite', 'prix_unitaire', 'piece', 'numero_serie', 'statut_piece', 'piece_recuperee']
        extra_kwargs = {'nom': {'required': False}}

    def validate_quantite(self, value):
        if value < 1:
            raise serializers.ValidationError("La quantité doit être au moins 1.")
        return value

    def validate_prix_unitaire(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("Le prix unitaire ne peut pas être négatif.")
        return value

    def validate(self, data):
        piece = data.get('piece')
        quantite = data.get('quantite', 1)

        if piece:
            if piece.stock_actuel < quantite:
                raise serializers.ValidationError(
                    {"piece": f"Stock insuffisant pour '{piece.designation}' (disponible : {piece.stock_actuel})."}
                )
            data['nom'] = piece.designation
            data['reference'] = piece.reference
            data['prix_unitaire'] = piece.prix_unitaire
        elif not data.get('nom') or len(data['nom'].strip()) < 2:
            raise serializers.ValidationError(
                {"nom": "Le nom est requis (au moins 2 caractères) pour une pièce non référencée."}
            )

        return data


class RapportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rapport
        fields = ['id', 'contenu', 'type_rapport', 'date_creation']


# ============================================================
# LOT 10 — Pièces demandées + Devis (définis AVANT les serializers qui les utilisent)
# ============================================================
class PieceDemandeeSerializer(serializers.ModelSerializer):
    """Lecture : pièce demandée par le Technicien (volontairement SANS prix)"""
    class Meta:
        model = PieceDemandee
        fields = ['id', 'piece', 'nom', 'reference', 'quantite']
        read_only_fields = ['id', 'piece', 'nom', 'reference', 'quantite']


class PieceDemandeeCreateSerializer(serializers.ModelSerializer):
    """Le Technicien cite une pièce du catalogue OU saisit une pièce libre (sans prix)."""
    piece = serializers.PrimaryKeyRelatedField(queryset=Piece.objects.all(), required=False, allow_null=True)

    class Meta:
        model = PieceDemandee
        fields = ['id', 'piece', 'nom', 'reference', 'quantite']
        read_only_fields = ['id']
        extra_kwargs = {'nom': {'required': False}}

    def validate_quantite(self, value):
        if value < 1:
            raise serializers.ValidationError("La quantité doit être au moins 1.")
        return value

    def validate(self, data):
        piece = data.get('piece')
        if piece:
            data['nom'] = piece.designation
            data['reference'] = piece.reference
        elif not data.get('nom') or len(data['nom'].strip()) < 2:
            raise serializers.ValidationError(
                {"nom": "Le nom est requis (au moins 2 caractères) pour une pièce non référencée."}
            )
        return data


class LigneDevisSerializer(serializers.ModelSerializer):
    sous_total = serializers.ReadOnlyField()

    class Meta:
        model = LigneDevis
        fields = ['id', 'piece', 'designation', 'quantite', 'prix_unitaire', 'sous_total']
        read_only_fields = fields


class DevisSerializer(serializers.ModelSerializer):
    """Lecture d'un devis complet (lignes + totaux calculés)"""
    cree_par = UtilisateurResumeSerializer(read_only=True)
    lignes = LigneDevisSerializer(many=True, read_only=True)
    montant_pieces = serializers.ReadOnlyField()
    montant_total = serializers.ReadOnlyField()

    class Meta:
        model = Devis
        fields = [
            'id', 'ticket', 'revision', 'statut', 'lignes',
            'montant_pieces', 'montant_main_oeuvre', 'remise', 'montant_total',
            'commentaire', 'motif_refus', 'cree_par',
            'date_creation', 'date_envoi', 'date_reponse',
        ]
        read_only_fields = fields


# ============================================================
# Serializers qui dépendent des précédents
# ============================================================
class InterventionSuiviSerializer(serializers.ModelSerializer):
    technicien = UtilisateurResumeSerializer(read_only=True)
    pieces_utilisees = PieceUtiliseeSerializer(many=True, read_only=True)
    pieces_demandees = PieceDemandeeSerializer(many=True, read_only=True)
    rapport = RapportSerializer(read_only=True)

    class Meta:
        model = Intervention
        fields = [
            'id', 'date', 'statut', 'diagnostic', 'validation_client',
            'technicien', 'pieces_utilisees', 'pieces_demandees',
            'rapport',
            'symptomes_constates', 'tests_effectues', 'cause_probable', 'cause_confirmee',
            'resultat_intervention', 'temps_passe_minutes', 'checklist_securite',
        ]


class TicketAdminSerializer(serializers.ModelSerializer):
    """Vue détaillée pour l'Admin : montre les infos du client et du technicien"""
    client = UtilisateurResumeSerializer(read_only=True)
    technicien = UtilisateurResumeSerializer(read_only=True)
    sla_restant = serializers.SerializerMethodField()
    sla_depasse = serializers.ReadOnlyField()
    interventions = InterventionSuiviSerializer(many=True, read_only=True)

    class Meta:
        model = Ticket
        fields = [
            'id', 'date_creation', 'priorite', 'statut', 'description',
            'client', 'technicien', 'interventions',
        ] + TICKET_CHAMPS_ENRICHIS + ['priorite_modifiee_manuellement']
        read_only_fields = [
            'id', 'date_creation', 'priorite', 'statut', 'client', 'technicien',
        ] + TICKET_CHAMPS_ENRICHIS + ['priorite_modifiee_manuellement']

    def get_sla_restant(self, obj):
        restant = obj.sla_restant
        if restant is None:
            return None
        return int(restant.total_seconds())


class TicketSuiviSerializer(serializers.ModelSerializer):
    """Vue complète d'un ticket pour le Client : ticket + intervention + pièces + rapport"""
    technicien = UtilisateurResumeSerializer(read_only=True)
    intervention = serializers.SerializerMethodField()
    devis = serializers.SerializerMethodField()
    sla_restant = serializers.SerializerMethodField()
    sla_depasse = serializers.ReadOnlyField()

    class Meta:
        model = Ticket
        fields = [
            'id', 'date_creation', 'priorite', 'statut', 'description',
            'technicien', 'intervention', 'devis'
        ] + TICKET_CHAMPS_ENRICHIS

    def get_devis(self, ticket):
        """Dernier devis visible par le Client (jamais le brouillon de l'Admin)."""
        devis = ticket.devis.exclude(statut='BROUILLON').order_by('-revision').first()
        if devis is None:
            return None
        return DevisSerializer(devis).data

    def get_intervention(self, ticket):
        derniere_intervention = ticket.interventions.order_by('-id').first()
        if derniere_intervention is None:
            return None
        return InterventionSuiviSerializer(derniere_intervention).data

    def get_sla_restant(self, obj):
        restant = obj.sla_restant
        if restant is None:
            return None
        return int(restant.total_seconds())


class HistoriqueTicketSerializer(serializers.ModelSerializer):
    auteur = UtilisateurResumeSerializer(read_only=True)
    champ_modifie_display = serializers.CharField(source='get_champ_modifie_display', read_only=True)

    class Meta:
        model = HistoriqueTicket
        fields = ['id', 'champ_modifie', 'champ_modifie_display', 'ancienne_valeur', 'nouvelle_valeur', 'justification', 'auteur', 'date']


class TicketPrioriteManuelleSerializer(serializers.Serializer):
    priorite = serializers.ChoiceField(choices=Ticket.PRIORITE_CHOICES)
    justification = serializers.CharField(min_length=10)


class CommentaireSerializer(serializers.ModelSerializer):
    """Lecture d'un commentaire (avec auteur imbriqué + flag de suppression possible)"""
    auteur = UtilisateurResumeSerializer(read_only=True)
    peut_supprimer = serializers.SerializerMethodField()

    class Meta:
        model = Commentaire
        fields = ['id', 'contenu', 'visibilite', 'auteur', 'date', 'peut_supprimer']
        read_only_fields = ['id', 'auteur', 'date']

    def get_peut_supprimer(self, obj):
        request = self.context.get('request')
        if not request:
            return False
        user = request.user
        return user.role == 'ADMIN' or obj.auteur_id == user.id


class CommentaireCreateSerializer(serializers.ModelSerializer):
    """Écriture : l'auteur et le ticket sont déduits côté vue"""
    class Meta:
        model = Commentaire
        fields = ['contenu', 'visibilite']

    def validate_contenu(self, value):
        if not value or len(value.strip()) < 2:
            raise serializers.ValidationError("Le commentaire ne peut pas être vide.")
        return value

    def to_representation(self, instance):
        """Après création, on renvoie le commentaire COMPLET (avec auteur + date)."""
        return CommentaireSerializer(instance).data


class PlanificationSerializer(serializers.ModelSerializer):
    """Lecture — technicien imbriqué + heure de fin calculée"""
    technicien = UtilisateurResumeSerializer(read_only=True)
    heure_fin = serializers.TimeField(read_only=True)

    class Meta:
        model = Planification
        fields = ['id', 'ticket', 'technicien', 'date', 'heure_debut', 'heure_fin', 'duree_estimee_minutes', 'statut', 'date_creation']


class PlanificationCreateSerializer(serializers.ModelSerializer):
    """Écriture : le technicien est déduit du ticket (déjà affecté), pas saisi ici"""
    class Meta:
        model = Planification
        fields = ['date', 'heure_debut', 'duree_estimee_minutes']

    def validate_date(self, value):
        if value < date.today():
            raise serializers.ValidationError("La date ne peut pas être dans le passé.")
        return value

    def validate_duree_estimee_minutes(self, value):
        if value < 15:
            raise serializers.ValidationError("La durée estimée doit être d'au moins 15 minutes.")
        return value


class InterventionDiagnosticDetailSerializer(serializers.ModelSerializer):
    """Mise à jour progressive du diagnostic pendant que l'intervention est EN_COURS"""
    class Meta:
        model = Intervention
        fields = ['symptomes_constates', 'tests_effectues', 'cause_probable', 'cause_confirmee', 'resultat_intervention', 'checklist_securite']


class InterventionTerminerSerializer(serializers.Serializer):
    """Body optionnel accepté au moment de terminer l'intervention"""
    temps_passe_minutes = serializers.IntegerField(min_value=1, required=False)


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'message', 'lien', 'lu', 'date']
        read_only_fields = ['id', 'message', 'lien', 'date']


class LigneDevisInputSerializer(serializers.Serializer):
    """Une ligne saisie par l'Admin : pièce du catalogue (prix repris par défaut) ou ligne libre."""
    piece = serializers.PrimaryKeyRelatedField(queryset=Piece.objects.all(), required=False, allow_null=True)
    designation = serializers.CharField(max_length=150, required=False, allow_blank=True)
    quantite = serializers.IntegerField(min_value=1, default=1)
    prix_unitaire = serializers.IntegerField(min_value=0, required=False)

    def validate(self, data):
        piece = data.get('piece')
        if piece:
            if not data.get('designation'):
                data['designation'] = piece.designation
            if data.get('prix_unitaire') is None:
                data['prix_unitaire'] = piece.prix_unitaire
        else:
            if not data.get('designation') or len(data['designation'].strip()) < 2:
                raise serializers.ValidationError(
                    {"designation": "La désignation est requise (au moins 2 caractères) pour une ligne libre."}
                )
            if data.get('prix_unitaire') is None:
                raise serializers.ValidationError({"prix_unitaire": "Le prix unitaire est requis pour une ligne libre."})
        return data


class DevisEcritureSerializer(serializers.Serializer):
    """Création / modification d'un devis par l'Admin (tous les champs sont optionnels)"""
    montant_main_oeuvre = serializers.IntegerField(min_value=0, required=False)
    remise = serializers.IntegerField(min_value=0, required=False)
    commentaire = serializers.CharField(required=False, allow_blank=True)
    lignes = LigneDevisInputSerializer(many=True, required=False)


class DevisRefusSerializer(serializers.Serializer):
    motif = serializers.CharField(min_length=5)