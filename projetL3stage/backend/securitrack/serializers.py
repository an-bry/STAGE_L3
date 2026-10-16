from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from camtrack.models import Equipement, Site
from camtrack.serializers import FichierSiteSerializer
from accounts.models import Utilisateur
from camtrack.models import Equipement
from datetime import date
from .models import Contrat, Maintenance, etat_contrat
from smart_ticket.models import Ticket
# ───────────── Utilisateurs ─────────────

class UtilisateurAdminSerializer(serializers.ModelSerializer):
    """Lecture et modification d'un utilisateur par l'Admin (le rôle n'est pas modifiable)."""

    class Meta:
        model = Utilisateur
        fields = [
            'id', 'username', 'first_name', 'last_name', 'email', 'role',
            'telephone', 'raison_sociale', 'specialite',
            'is_active', 'date_joined', 'last_login',
        ]
        read_only_fields = ['id', 'role', 'date_joined', 'last_login']


class UtilisateurCreateSerializer(serializers.ModelSerializer):
    """Création d'un utilisateur par l'Admin."""
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = Utilisateur
        fields = [
            'id', 'username', 'password', 'first_name', 'last_name', 'email',
            'role', 'telephone', 'raison_sociale', 'specialite',
        ]

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        mot_de_passe = validated_data.pop('password')
        utilisateur = Utilisateur(**validated_data)
        utilisateur.set_password(mot_de_passe)
        utilisateur.save()
        return utilisateur

    def to_representation(self, instance):
        return UtilisateurAdminSerializer(instance).data


class MotDePasseSerializer(serializers.Serializer):
    nouveau_mot_de_passe = serializers.CharField(write_only=True, min_length=8)

    def validate_nouveau_mot_de_passe(self, value):
        validate_password(value)
        return value


# ───────────── Contrats ─────────────

class EquipementResumeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Equipement
        fields = ['id', 'type_equipement', 'model', 'adresse_ip', 'statut',
                  'date_fin_garantie']


class ContratSerializer(serializers.ModelSerializer):
    """Lecture (Admin et Client) et écriture (Admin) d'un contrat."""
    etat = serializers.SerializerMethodField()
    client_nom = serializers.SerializerMethodField()
    equipements_detail = EquipementResumeSerializer(
        source='equipements', many=True, read_only=True
    )

    class Meta:
        model = Contrat
        fields = ['id', 'client', 'client_nom', 'date_debut', 'date_fin',
                  'equipements', 'equipements_detail', 'etat']

    def get_etat(self, obj):
        return etat_contrat(obj.date_fin)

    def get_client_nom(self, obj):
        return obj.client.raison_sociale or obj.client.get_full_name() or obj.client.username

    def validate(self, attrs):
        instance = self.instance
        date_debut = attrs.get('date_debut', getattr(instance, 'date_debut', None))
        date_fin = attrs.get('date_fin', getattr(instance, 'date_fin', None))
        client = attrs.get('client', getattr(instance, 'client', None))

        if date_debut and date_fin and date_fin <= date_debut:
            raise serializers.ValidationError(
                {'date_fin': "La date de fin doit être après la date de début."}
            )
        if client and client.role != 'CLIENT':
            raise serializers.ValidationError({'client': "Cet utilisateur n'est pas un client."})

        # Chaque équipement doit appartenir à ce client :
        # Equipement -> Installation -> Site -> Demande -> Client
        if 'equipements' in attrs and client:
            for eq in attrs['equipements']:
                proprietaire = eq.installation.site.demande.client_id
                if proprietaire != client.pk:
                    raise serializers.ValidationError(
                        {'equipements': f"L'équipement #{eq.pk} n'appartient pas à ce client."}
                    )
        return attrs



class MaintenanceSerializer(serializers.ModelSerializer):
    technicien_nom = serializers.SerializerMethodField()
    equipement_detail = EquipementResumeSerializer(source='equipement', read_only=True)
    site_nom = serializers.CharField(source='equipement.installation.site.nom', read_only=True)
    client_nom = serializers.SerializerMethodField()
    en_retard = serializers.SerializerMethodField()

    class Meta:
        model = Maintenance
        fields = ['id', 'type_maintenance', 'statut', 'date', 'compte_rendu',
                  'technicien', 'technicien_nom', 'equipement', 'equipement_detail',
                  'site_nom', 'client_nom', 'en_retard']
        read_only_fields = ['id', 'type_maintenance', 'statut', 'compte_rendu']

    def get_technicien_nom(self, obj):
        t = obj.technicien
        return (t.get_full_name() or t.username) if t else None

    def get_client_nom(self, obj):
        c = obj.equipement.installation.site.demande.client
        return c.raison_sociale or c.get_full_name() or c.username

    def get_en_retard(self, obj):
        return obj.statut == 'PLANIFIEE' and obj.date < date.today()

    def validate_technicien(self, value):
        if value and not value.is_active:
            raise serializers.ValidationError("Ce technicien est désactivé.")
        return value

    def validate_equipement(self, value):
        if value.statut == 'HORS_SERVICE':
            raise serializers.ValidationError("Cet équipement est hors service.")
        return value

    def validate_date(self, value):
        if value < date.today():
            raise serializers.ValidationError("La date ne peut pas être dans le passé.")
        return value

    def validate(self, attrs):
        instance = self.instance
        equipement = attrs.get('equipement', getattr(instance, 'equipement', None))
        jour = attrs.get('date', getattr(instance, 'date', None))

        if instance and equipement != instance.equipement:
            raise serializers.ValidationError({'equipement': "L'équipement ne peut pas être modifié."})

        if equipement and jour:
            if not Contrat.objects.filter(
                equipements=equipement, date_debut__lte=jour, date_fin__gte=jour
            ).exists():
                raise serializers.ValidationError(
                    {'date': "Aucun contrat ne couvre cet équipement à cette date."}
                )
            doublon = Maintenance.objects.filter(
                equipement=equipement, date=jour,
                type_maintenance='PREVENTIVE', statut='PLANIFIEE',
            )
            if instance:
                doublon = doublon.exclude(pk=instance.pk)
            if doublon.exists():
                raise serializers.ValidationError(
                    {'date': "Une maintenance est déjà planifiée ce jour-là pour cet équipement."}
                )
        return attrs


class TerminerMaintenanceSerializer(serializers.Serializer):
    compte_rendu = serializers.CharField(min_length=10)
class EquipementSerializer(serializers.ModelSerializer):
    garantie_expiree = serializers.ReadOnlyField()
    garantie_jours_restants = serializers.ReadOnlyField()
    installation_statut = serializers.CharField(source='installation.statut', read_only=True)
    site_nom = serializers.CharField(source='installation.site.nom', read_only=True)
    client_nom = serializers.SerializerMethodField()
    nb_maintenances = serializers.SerializerMethodField()
    # lien  vers CAMTRACK
    demande = serializers.IntegerField(source='installation.site.demande.id', read_only=True)
    site = serializers.IntegerField(source='installation.site.id', read_only=True)
    client = serializers.IntegerField(source='installation.site.demande.client.id', read_only=True)
    class Meta:
        model = Equipement
        fields = ['id', 'type_equipement', 'model', 'adresse_ip', 'statut',
                  'date_debut_garantie', 'date_fin_garantie',
                  'garantie_expiree', 'garantie_jours_restants',
                  'installation', 'installation_statut', 'site', 'site_nom',
                  'client', 'client_nom', 'demande', 'nb_maintenances']

    def get_client_nom(self, obj):
        c = obj.installation.site.demande.client
        return c.raison_sociale or c.get_full_name() or c.username

    def get_nb_maintenances(self, obj):
        n = getattr(obj, 'nb_maintenances', None)
        return n if n is not None else obj.maintenances.count()

    def validate(self, attrs):
        instance = self.instance
        if instance:
            for champ in ('type_equipement', 'installation'):
                if champ in attrs and attrs[champ] != getattr(instance, champ):
                    raise serializers.ValidationError({champ: "Ce champ ne peut pas être modifié."})

        installation = attrs.get('installation', getattr(instance, 'installation', None))
        debut = attrs.get('date_debut_garantie', getattr(instance, 'date_debut_garantie', None))
        fin = attrs.get('date_fin_garantie', getattr(instance, 'date_fin_garantie', None))
        ip = attrs.get('adresse_ip', getattr(instance, 'adresse_ip', None))
        statut = attrs.get('statut', getattr(instance, 'statut', 'ACTIF'))

        if not instance and installation and installation.statut == 'TERMINEE':
            raise serializers.ValidationError({'installation': "Cette installation est terminée."})

        if debut and fin and fin <= debut:
            raise serializers.ValidationError(
                {'date_fin_garantie': "Doit être postérieure à la date de début de garantie."}
            )

        if ip and installation and statut != 'HORS_SERVICE':
            doublon = Equipement.objects.filter(
                installation__site=installation.site, adresse_ip=ip
            ).exclude(statut='HORS_SERVICE')
            if instance:
                doublon = doublon.exclude(pk=instance.pk)
            if doublon.exists():
                raise serializers.ValidationError(
                    {'adresse_ip': "Cette adresse IP est déjà utilisée sur ce site."}
                )

        if instance and statut == 'HORS_SERVICE' and instance.statut != 'HORS_SERVICE':
            n = instance.maintenances.filter(statut='PLANIFIEE').count()
            if n:
                raise serializers.ValidationError(
                    {'statut': f"Cet équipement a {n} maintenance(s) planifiée(s) : supprimez-les d'abord."}
                )
        return attrs
   


class SiteSerializer(serializers.ModelSerializer):
    fichiers = FichierSiteSerializer(many=True, read_only=True)
    technicien_nom = serializers.SerializerMethodField()
    demande_statut = serializers.CharField(source='demande.statut', read_only=True)
    client_nom = serializers.SerializerMethodField()
    nb_installations = serializers.SerializerMethodField()

    class Meta:
        model = Site
        fields = ['id', 'nom', 'adresse', 'adresse_gps', 'latitude', 'longitude',
                  'statut', 'notes_faisabilite', 'technicien', 'technicien_nom',
                  'demande', 'demande_statut', 'client_nom', 'date_soumission',
                  'nb_installations', 'fichiers']
        read_only_fields = ['id', 'statut', 'adresse_gps', 'technicien', 'date_soumission']
        extra_kwargs = {'nom': {'allow_blank': False}, 'adresse': {'allow_blank': False}}

    def get_technicien_nom(self, obj):
        return obj.technicien.username if obj.technicien else None

    def get_client_nom(self, obj):
        c = obj.demande.client
        return c.raison_sociale or c.get_full_name() or c.username

    def get_nb_installations(self, obj):
        n = getattr(obj, 'nb_installations', None)
        return n if n is not None else obj.installations.count()

    def validate(self, attrs):
        instance = self.instance
        if instance:
            if 'demande' in attrs and attrs['demande'] != instance.demande:
                raise serializers.ValidationError({'demande': "Ce champ ne peut pas être modifié."})
            if instance.installations.exists():
                raise serializers.ValidationError(
                    {'detail': "Ce site a déjà une installation : modification impossible."}
                )
        else:
            for champ in ('nom', 'adresse'):
                if not attrs.get(champ):
                    raise serializers.ValidationError({champ: "Ce champ est obligatoire."})
            if attrs['demande'].statut == 'REJETEE':
                raise serializers.ValidationError({'demande': "Cette demande a été rejetée."})

        lat = attrs.get('latitude', getattr(instance, 'latitude', None))
        lng = attrs.get('longitude', getattr(instance, 'longitude', None))
        if (lat is None) != (lng is None):
            raise serializers.ValidationError(
                "La latitude et la longitude doivent être envoyées ensemble (les deux, ou aucune)."
            )
        if lat is not None and not (-90 <= lat <= 90):
            raise serializers.ValidationError({'latitude': "Doit être comprise entre -90 et 90."})
        if lng is not None and not (-180 <= lng <= 180):
            raise serializers.ValidationError({'longitude': "Doit être comprise entre -180 et 180."})
        return attrs
# ───────────── Liaison ticket <-> équipement ─────────────

class LierTicketSerializer(serializers.Serializer):
    equipement = serializers.PrimaryKeyRelatedField(
        queryset=Equipement.objects.all(), allow_null=True
    )
    marquer_en_panne = serializers.BooleanField(default=False)


class TicketResumeSerializer(serializers.ModelSerializer):
    equipement_detail = EquipementResumeSerializer(source='equipement_ref', read_only=True)
    sla_depasse = serializers.ReadOnlyField()

    class Meta:
        model = Ticket
        fields = ['id', 'statut', 'priorite', 'description', 'date_creation',
                  'client', 'technicien', 'equipement', 'equipement_ref',
                  'equipement_detail', 'sla_deadline', 'sla_depasse']