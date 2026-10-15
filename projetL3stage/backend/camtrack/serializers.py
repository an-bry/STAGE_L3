from django.db import transaction
from rest_framework import serializers
from accounts.models import Utilisateur
from .models import FichierInstallation, Offre, DemandeInstallation, Devis, LigneDevis, Site, FichierSite
from .models import Installation, Equipement,Installation, Equipement
from .models import RapportInstallation  
from .models import Commentaire  

# Règles sur les fichiers joints
EXT_PHOTOS = {'jpg', 'jpeg', 'png', 'webp'}
EXT_PLANS = {'pdf', 'jpg', 'jpeg', 'png'}
TAILLE_MAX = 5 * 1024 * 1024  # 5 Mo


def _verifier_fichier(f, extensions):
    ext = f.name.rsplit('.', 1)[-1].lower() if '.' in f.name else ''
    if ext not in extensions:
        raise serializers.ValidationError(
            f"'{f.name}' : format non accepté (autorisés : {', '.join(sorted(extensions))})."
        )
    if f.size > TAILLE_MAX:
        raise serializers.ValidationError(f"'{f.name}' dépasse 5 Mo.")


class ListeFichiersField(serializers.ListField):
    """
    Liste de fichiers OPTIONNELLE : ignore les valeurs vides ou textuelles
    (ex. une ligne 'photos' sans fichier dans Postman).
    """
    def get_value(self, dictionary):
        if hasattr(dictionary, 'getlist'):
            fichiers = [
                f for f in dictionary.getlist(self.field_name) if hasattr(f, 'read')
            ]
            return fichiers if fichiers else serializers.empty
        return super().get_value(dictionary)


# ------------------------------------------------------------
# OFFRES
# ------------------------------------------------------------
class OffreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Offre
        fields = [
            'id', 'nom', 'description', 'nombre_cameras_inclus',
            'prix_abonnement', 'duree_engagement_mois', 'actif',
        ]

    def validate_prix_abonnement(self, value):
        if value <= 0:
            raise serializers.ValidationError("Le prix doit être supérieur à 0.")
        return value

    def validate_nombre_cameras_inclus(self, value):
        if value < 1:
            raise serializers.ValidationError("Au moins 1 caméra doit être incluse.")
        return value


# ------------------------------------------------------------
# DEVIS
# ------------------------------------------------------------
class LigneDevisSerializer(serializers.ModelSerializer):
    total = serializers.IntegerField(read_only=True)

    class Meta:
        model = LigneDevis
        fields = ['id', 'designation', 'quantite', 'prix_unitaire', 'total']


class DevisSerializer(serializers.ModelSerializer):
    lignes = LigneDevisSerializer(many=True, read_only=True)

    class Meta:
        model = Devis
        fields = ['id', 'montant', 'date_etablissement', 'lignes']
        read_only_fields = ['id', 'montant', 'date_etablissement']


class LigneDevisCreateSerializer(serializers.Serializer):
    designation = serializers.CharField(max_length=150)
    quantite = serializers.IntegerField(min_value=1)
    prix_unitaire = serializers.IntegerField(min_value=1)


class DevisCreateSerializer(serializers.Serializer):
    """L'Admin saisit les lignes ; le montant total est calculé par l'API."""
    lignes = LigneDevisCreateSerializer(many=True, allow_empty=False)


class DevisReponseSerializer(serializers.Serializer):
    """Le Client accepte (true) ou refuse (false) le devis."""
    accepte = serializers.BooleanField()


# ------------------------------------------------------------
# SITE + FICHIERS (lecture)
# ------------------------------------------------------------
class FichierSiteSerializer(serializers.ModelSerializer):
    class Meta:
        model = FichierSite
        fields = ['id', 'type_fichier', 'fichier', 'date_ajout']


class SiteSerializer(serializers.ModelSerializer):
    fichiers = FichierSiteSerializer(many=True, read_only=True)

    class Meta:
        model = Site
        fields = ['id', 'nom', 'adresse', 'adresse_gps','latitude', 'longitude', 'statut', 'fichiers']
class SiteAdminSerializer(serializers.ModelSerializer):
    """Vue Admin : le site avec technicien et notes de faisabilité."""
    fichiers = FichierSiteSerializer(many=True, read_only=True)
    technicien_nom = serializers.SerializerMethodField()

    class Meta:
        model = Site
        fields = ['id', 'nom', 'adresse', 'adresse_gps','latitude', 'longitude', 'statut',
                  'technicien', 'technicien_nom', 'notes_faisabilite', 'fichiers']

    def get_technicien_nom(self, obj):
        return obj.technicien.username if obj.technicien else None

# ------------------------------------------------------------
# DEMANDES
# ------------------------------------------------------------
class UtilisateurResumeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Utilisateur
        fields = ['id', 'username', 'first_name', 'last_name', 'telephone']


class DemandeCreateSerializer(serializers.ModelSerializer):
    """
    Fonctionnalité 1 : le Client soumet sa demande en UNE requête
    (multipart/form-data) : offre, description, site, adresse, photos, plans.
    Client et statut sont gérés par la vue.
    """
    offre = serializers.PrimaryKeyRelatedField(
        queryset=Offre.objects.filter(actif=True),
        error_messages={
            'does_not_exist': "Cette offre n'existe pas ou n'est plus disponible.",
            'required': "Vous devez choisir une offre.",
        },
    )
    description = serializers.CharField()
    nom_site = serializers.CharField(max_length=100)
    adresse = serializers.CharField(max_length=255)
    photos = ListeFichiersField(
        child=serializers.FileField(), required=False, write_only=True, max_length=10
    )
    plans = ListeFichiersField(
        child=serializers.FileField(), required=False, write_only=True, max_length=3
    )

    class Meta:
        model = DemandeInstallation
        fields = ['offre', 'description', 'nom_site', 'adresse', 'photos', 'plans']

    def validate_description(self, value):
        if len(value.strip()) < 10:
            raise serializers.ValidationError("La description doit contenir au moins 10 caractères.")
        return value.strip()

    def validate_photos(self, files):
        for f in files:
            _verifier_fichier(f, EXT_PHOTOS)
        return files

    def validate_plans(self, files):
        for f in files:
            _verifier_fichier(f, EXT_PLANS)
        return files

    @transaction.atomic
    def create(self, validated_data):
        photos = validated_data.pop('photos', [])
        plans = validated_data.pop('plans', [])
        nom_site = validated_data.pop('nom_site')
        adresse = validated_data.pop('adresse')

        demande = DemandeInstallation.objects.create(**validated_data)
        site = Site.objects.create(demande=demande, nom=nom_site, adresse=adresse)

        for f in photos:
            FichierSite.objects.create(site=site, type_fichier='PHOTO', fichier=f)
        for f in plans:
            FichierSite.objects.create(site=site, type_fichier='PLAN', fichier=f)
        return demande


class DemandeClientSerializer(serializers.ModelSerializer):
    """Vue Client : sa demande, l'offre, le site (+ fichiers) et le devis."""
    offre = OffreSerializer(read_only=True)
    sites = SiteSerializer(many=True, read_only=True)
    devis = serializers.SerializerMethodField()

    class Meta:
        model = DemandeInstallation
        fields = ['id', 'date_soumission', 'statut', 'description', 'offre', 'sites', 'devis']

    def get_devis(self, obj):
        devis = getattr(obj, 'devis', None)
        return DevisSerializer(devis).data if devis else None


class DemandeAdminSerializer(serializers.ModelSerializer):
    """Vue Admin : infos client + offre + site (+ fichiers) + devis."""
    client = UtilisateurResumeSerializer(read_only=True)
    offre = OffreSerializer(read_only=True)
    sites = SiteAdminSerializer(many=True, read_only=True)
    devis = serializers.SerializerMethodField()

    class Meta:
        model = DemandeInstallation
        fields = ['id', 'date_soumission', 'statut', 'description',
                  'client', 'offre', 'sites', 'devis']

    def get_devis(self, obj):
        devis = getattr(obj, 'devis', None)
        return DevisSerializer(devis).data if devis else None
class SiteAffecterSerializer(serializers.Serializer):
    technicien = serializers.PrimaryKeyRelatedField(
        queryset=Utilisateur.objects.filter(role='TECHNICIEN')
    )


class DemandeResumeTechnicienSerializer(serializers.ModelSerializer):
    client = UtilisateurResumeSerializer(read_only=True)
    offre = OffreSerializer(read_only=True)

    class Meta:
        model = DemandeInstallation
        fields = ['id', 'description', 'statut', 'client', 'offre']


class SiteTechnicienSerializer(serializers.ModelSerializer):
    """Vue Technicien : site à étudier + contexte de la demande."""
    fichiers = FichierSiteSerializer(many=True, read_only=True)
    demande = DemandeResumeTechnicienSerializer(read_only=True)

    class Meta:
        model = Site
        fields = ['id', 'nom', 'adresse', 'adresse_gps','latitude', 'longitude', 'statut',
                  'notes_faisabilite', 'fichiers', 'demande']


class SiteEtudeSerializer(serializers.Serializer):
    notes_faisabilite = serializers.CharField(min_length=10)
    valider = serializers.BooleanField(default=False)
    latitude = serializers.FloatField(required=False, allow_null=True)
    longitude = serializers.FloatField(required=False, allow_null=True)

    def validate(self, data):
        lat = data.get('latitude')
        lng = data.get('longitude')
        if (lat is None) != (lng is None):
            raise serializers.ValidationError(
                "La latitude et la longitude doivent être envoyées ensemble (les deux, ou aucune)."
            )
        if lat is not None and not (-90 <= lat <= 90):
            raise serializers.ValidationError({"latitude": "Doit être comprise entre -90 et 90."})
        if lng is not None and not (-180 <= lng <= 180):
            raise serializers.ValidationError({"longitude": "Doit être comprise entre -180 et 180."})
        return data



class EquipementGarantieSerializer(serializers.ModelSerializer):
    """Vue Admin : équipement avec site/client/technicien pour le suivi de garantie."""
    site_nom = serializers.CharField(source='installation.site.nom', read_only=True)
    client_nom = serializers.CharField(source='installation.site.demande.client.username', read_only=True)
    garantie_expiree = serializers.ReadOnlyField()
    garantie_jours_restants = serializers.ReadOnlyField()

    class Meta:
        model = Equipement
        fields = [
            'id', 'type_equipement', 'model', 'adresse_ip', 'statut',
            'date_debut_garantie', 'date_fin_garantie',
            'garantie_expiree', 'garantie_jours_restants',
            'site_nom', 'client_nom', 'installation',
        ]


class InstallationAdminSerializer(serializers.ModelSerializer):
    """Vue Admin : installation avec site, client, technicien et équipements imbriqués."""
    site_nom = serializers.CharField(source='site.nom', read_only=True)
    adresse = serializers.CharField(source='site.adresse', read_only=True)
    client_nom = serializers.CharField(source='site.demande.client.username', read_only=True)
    technicien_nom = serializers.SerializerMethodField()
    equipements = EquipementGarantieSerializer(many=True, read_only=True)

    class Meta:
        model = Installation
        fields = [
            'id', 'date_installation', 'statut',
            'site_nom', 'adresse', 'client_nom',
            'technicien', 'technicien_nom', 'equipements',
        ]

    def get_technicien_nom(self, obj):
        return obj.technicien.username if obj.technicien else None
class EquipementGarantieSerializer(serializers.ModelSerializer):
    """Vue Admin : équipement avec site/client/technicien pour le suivi de garantie."""
    site_nom = serializers.CharField(source='installation.site.nom', read_only=True)
    client_nom = serializers.CharField(source='installation.site.demande.client.username', read_only=True)
    garantie_expiree = serializers.ReadOnlyField()
    garantie_jours_restants = serializers.ReadOnlyField()

    class Meta:
        model = Equipement
        fields = [
            'id', 'type_equipement', 'model', 'adresse_ip', 'statut',
            'date_debut_garantie', 'date_fin_garantie',
            'garantie_expiree', 'garantie_jours_restants',
            'site_nom', 'client_nom', 'installation',
        ]


class InstallationAdminSerializer(serializers.ModelSerializer):
    """Vue Admin : installation avec site, client, technicien et équipements imbriqués."""
    site_nom = serializers.CharField(source='site.nom', read_only=True)
    adresse = serializers.CharField(source='site.adresse', read_only=True)
    client_nom = serializers.CharField(source='site.demande.client.username', read_only=True)
    technicien_nom = serializers.SerializerMethodField()
    equipements = EquipementGarantieSerializer(many=True, read_only=True)

    class Meta:
        model = Installation
        fields = [
            'id', 'date_installation', 'statut',
            'site_nom', 'adresse', 'client_nom',
            'technicien', 'technicien_nom', 'equipements',
        ]

    def get_technicien_nom(self, obj):
        return obj.technicien.username if obj.technicien else None


class FichierInstallationSerializer(serializers.ModelSerializer):
    class Meta:
        model = FichierInstallation
        fields = ['id', 'fichier', 'date_ajout']


class InstallationCreateSerializer(serializers.Serializer):
    """L'Admin planifie une installation : site + technicien + date."""
    site = serializers.PrimaryKeyRelatedField(queryset=Site.objects.filter(statut='VALIDE'))
    technicien = serializers.PrimaryKeyRelatedField(queryset=Utilisateur.objects.filter(role='TECHNICIEN'))
    date_installation = serializers.DateField(required=False, allow_null=True)

    def validate_site(self, site):
        if site.installations.exists():
            raise serializers.ValidationError("Une installation existe déjà pour ce site.")
        return site


class InstallationTechnicienSerializer(serializers.ModelSerializer):
    """Vue Technicien : installation avec site, client, équipements et photos."""
    site_nom = serializers.CharField(source='site.nom', read_only=True)
    adresse = serializers.CharField(source='site.adresse', read_only=True)
    client_nom = serializers.CharField(source='site.demande.client.username', read_only=True)
    equipements = EquipementGarantieSerializer(many=True, read_only=True)
    fichiers = FichierInstallationSerializer(many=True, read_only=True)

    class Meta:
        model = Installation
        fields = [
            'id', 'date_installation', 'statut',
            'site_nom', 'adresse', 'client_nom', 'equipements', 'fichiers',
        ]


class EquipementCreateSerializer(serializers.ModelSerializer):
    """Le Technicien ajoute un équipement à une installation EN_COURS."""
    class Meta:
        model = Equipement
        fields = ['type_equipement', 'model', 'adresse_ip', 'date_debut_garantie', 'date_fin_garantie']

    def validate(self, data):
        if data['date_fin_garantie'] <= data['date_debut_garantie']:
            raise serializers.ValidationError(
                {"date_fin_garantie": "Doit être postérieure à la date de début de garantie."}
            )
        return data

class RapportInstallationSerializer(serializers.ModelSerializer):
    class Meta:
        model = RapportInstallation
        fields = ['id', 'contenu', 'date_creation', 'validation_client', 'date_validation']
        read_only_fields = fields



class CommentaireSerializer(serializers.ModelSerializer):
    """Lecture — avec auteur imbriqué, et un flag pour savoir si l'utilisateur courant peut supprimer"""
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
    class Meta:
        model = Commentaire
        fields = ['contenu', 'visibilite']

    def validate_contenu(self, value):
        if not value or len(value.strip()) < 2:
            raise serializers.ValidationError("Le commentaire ne peut pas être vide.")
        return value

    def to_representation(self, instance):
        """Après création, renvoie le commentaire COMPLET (avec auteur + date)."""
        return CommentaireSerializer(instance).data