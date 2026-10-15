from datetime import date, timedelta

from django.db import transaction
from django.http import HttpResponse
from django.utils import timezone
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from rest_framework import filters, generics, permissions, status
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import Utilisateur
from accounts.permissions import IsAdmin, IsClient, IsTechnicien

from .models import (
    Commentaire,
    DemandeInstallation,
    Devis,
    Equipement,
    FichierInstallation,
    Installation,
    LigneDevis,
    Offre,
    RapportInstallation,
    Site,
)
from .notifications import notifier
from .serializers import (
    CommentaireCreateSerializer,
    CommentaireSerializer,
    DemandeAdminSerializer,
    DemandeClientSerializer,
    DemandeCreateSerializer,
    DevisCreateSerializer,
    DevisReponseSerializer,
    DevisSerializer,
    EquipementCreateSerializer,
    EquipementGarantieSerializer,
    FichierInstallationSerializer,
    InstallationAdminSerializer,
    InstallationCreateSerializer,
    InstallationTechnicienSerializer,
    OffreSerializer,
    RapportInstallationSerializer,
    SiteAdminSerializer,
    SiteAffecterSerializer,
    SiteEtudeSerializer,
    SiteTechnicienSerializer,
)


def _demandes_qs():
    """Requête de base optimisée pour les demandes."""
    return DemandeInstallation.objects.select_related(
        'client', 'offre', 'devis'
    ).prefetch_related('sites__fichiers')


# ============================================================
# OFFRES
# ============================================================
class OffreListView(generics.ListAPIView):
    """Tout utilisateur connecté : liste des offres ACTIVES (catalogue)."""
    serializer_class = OffreSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Offre.objects.filter(actif=True)


class OffreAdminListCreateView(generics.ListCreateAPIView):
    """
    Admin : lister les offres et en créer une.
    Filtres : ?actif=true (en vigueur) | ?actif=false (archivées)
    Sans filtre : toutes les offres.
    """
    serializer_class = OffreSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get_queryset(self):
        queryset = Offre.objects.all()
        actif = self.request.query_params.get('actif')
        if actif is not None:
            queryset = queryset.filter(actif=actif.lower() == 'true')
        return queryset


class OffreAdminDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Admin : détail, modification, désactivation (DELETE = actif False)."""
    serializer_class = OffreSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    queryset = Offre.objects.all()

    def perform_destroy(self, instance):
        instance.actif = False
        instance.save(update_fields=['actif'])


# ============================================================
# DEMANDES D'INSTALLATION
# ============================================================
class DemandeInstallationCreateView(generics.CreateAPIView):
    """
    FONCTIONNALITÉ 1 — Le Client soumet une demande d'installation :
    offre + description + site + adresse + photos/plans (multipart/form-data).
    Crée la demande (EN_ATTENTE) et son site (EN_ETUDE).
    """
    serializer_class = DemandeCreateSerializer
    permission_classes = [permissions.IsAuthenticated, IsClient]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        demande = serializer.save(client=request.user, statut='EN_ATTENTE')
        notifier(
            request.user,
            f"Votre demande d'installation #{demande.id} a bien été reçue. Elle est en cours d'examen.",
            f"demande:{demande.id}",
        )
        demande = _demandes_qs().get(pk=demande.pk)
        return Response(
            DemandeClientSerializer(demande, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


class MesDemandesView(generics.ListAPIView):
    """Le Client consulte ses demandes (offre, site, fichiers, devis)."""
    serializer_class = DemandeClientSerializer
    permission_classes = [permissions.IsAuthenticated, IsClient]

    def get_queryset(self):
        return _demandes_qs().filter(client=self.request.user)


class ToutesLesDemandesView(generics.ListAPIView):
    """L'Admin consulte toutes les demandes. Filtre : ?statut=EN_ATTENTE"""
    serializer_class = DemandeAdminSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    filter_backends = [filters.OrderingFilter, filters.SearchFilter]
    ordering_fields = ['date_soumission', 'statut']
    search_fields = ['client__username', 'offre__nom', 'sites__nom', 'sites__adresse']

    def get_queryset(self):
        queryset = _demandes_qs()
        statut = self.request.query_params.get('statut')
        if statut:
            queryset = queryset.filter(statut=statut)
        return queryset


class DemandeDetailAdminView(generics.RetrieveAPIView):
    """L'Admin consulte le détail d'une demande."""
    serializer_class = DemandeAdminSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    queryset = _demandes_qs()


class DemandeRejeterView(APIView):
    """L'Admin rejette directement une demande (seulement si EN_ATTENTE)."""
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def patch(self, request, pk):
        try:
            demande = _demandes_qs().get(pk=pk)
        except DemandeInstallation.DoesNotExist:
            return Response({"detail": "Demande introuvable."}, status=status.HTTP_404_NOT_FOUND)

        if demande.statut != 'EN_ATTENTE':
            return Response(
                {"detail": f"Impossible de rejeter : la demande est déjà '{demande.statut}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        demande.statut = 'REJETEE'
        demande.save(update_fields=['statut'])
        notifier(
            demande.client,
            f"Votre demande d'installation #{demande.id} a été rejetée.",
            f"demande:{demande.id}",
        )
        return Response(DemandeAdminSerializer(demande, context={'request': request}).data)


# ============================================================
# ÉTUDE DU SITE (fonctionnalité 8)
# ============================================================
class SiteAffecterView(APIView):
    """L'Admin affecte un technicien à l'étude d'un site."""
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def patch(self, request, pk):
        try:
            site = Site.objects.select_related('demande').get(pk=pk)
        except Site.DoesNotExist:
            return Response({"detail": "Site introuvable."}, status=status.HTTP_404_NOT_FOUND)

        if site.demande.statut == 'REJETEE':
            return Response({"detail": "La demande de ce site est rejetée."},
                            status=status.HTTP_400_BAD_REQUEST)
        if site.statut != 'EN_ETUDE':
            return Response({"detail": "L'étude de ce site est déjà terminée."},
                            status=status.HTTP_400_BAD_REQUEST)

        serializer = SiteAffecterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        technicien = serializer.validated_data['technicien']

        site.technicien = technicien
        site.save(update_fields=['technicien'])

        notifier(
            technicien,
            f"Une étude de site vous a été affectée : « {site.nom} » (demande #{site.demande_id}).",
            f"site:{site.id}",
        )
        return Response(SiteAdminSerializer(site, context={'request': request}).data)


class MesEtudesView(generics.ListAPIView):
    """Le Technicien consulte les sites qui lui sont affectés. Filtre : ?statut=EN_ETUDE"""
    serializer_class = SiteTechnicienSerializer
    permission_classes = [permissions.IsAuthenticated, IsTechnicien]

    def get_queryset(self):
        queryset = (
            Site.objects.filter(technicien=self.request.user)
            .exclude(demande__statut='REJETEE')
            .select_related('demande__client', 'demande__offre')
            .prefetch_related('fichiers')
            .order_by('-id')
        )
        statut = self.request.query_params.get('statut')
        if statut:
            queryset = queryset.filter(statut=statut)
        return queryset


class SiteEtudeView(APIView):
    """
    Le Technicien enregistre ses notes de faisabilité.
      valider=false -> brouillon (le site reste EN_ETUDE)
      valider=true  -> le site passe à VALIDE et le client est notifié
    """
    permission_classes = [permissions.IsAuthenticated, IsTechnicien]

    def patch(self, request, pk):
        try:
            site = (
                Site.objects.select_related('demande__client', 'demande__offre')
                .prefetch_related('fichiers')
                .get(pk=pk, technicien=request.user)
            )
        except Site.DoesNotExist:
            return Response({"detail": "Site introuvable."}, status=status.HTTP_404_NOT_FOUND)

        if site.demande.statut == 'REJETEE':
            return Response({"detail": "La demande de ce site est rejetée."},
                            status=status.HTTP_400_BAD_REQUEST)
        if site.statut != 'EN_ETUDE':
            return Response({"detail": "L'étude de ce site est déjà validée."},
                            status=status.HTTP_400_BAD_REQUEST)

        serializer = SiteEtudeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        valider = serializer.validated_data['valider']
        latitude = serializer.validated_data.get('latitude')
        longitude = serializer.validated_data.get('longitude')

        site.notes_faisabilite = serializer.validated_data['notes_faisabilite']
        update_fields = ['notes_faisabilite']

        if latitude is not None and longitude is not None:
            site.latitude = latitude
            site.longitude = longitude
            site.adresse_gps = f"{latitude:.6f}, {longitude:.6f}"
            update_fields += ['latitude', 'longitude', 'adresse_gps']

        if valider:
            site.statut = 'VALIDE'
            update_fields.append('statut')

        site.save(update_fields=update_fields)

        if valider:
            notifier(
                site.demande.client,
                f"L'étude de votre site « {site.nom} » est terminée : site validé.",
                f"demande:{site.demande_id}",
            )
        return Response(SiteTechnicienSerializer(site, context={'request': request}).data)


# ============================================================
# DEVIS
# ============================================================
class DevisCreateView(APIView):
    """
    L'Admin établit le devis (coût d'installation, distinct de l'abonnement).
    - La demande doit être EN_ATTENTE
    - L'étude de chaque site de la demande doit être validée par le technicien
    - Un seul devis par demande
    """
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def post(self, request, pk):
        try:
            demande = DemandeInstallation.objects.get(pk=pk)
        except DemandeInstallation.DoesNotExist:
            return Response({"detail": "Demande introuvable."}, status=status.HTTP_404_NOT_FOUND)

        if demande.statut != 'EN_ATTENTE':
            return Response(
                {"detail": f"Impossible d'établir un devis : la demande est '{demande.statut}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        sites = demande.sites.all()
        if not sites.exists() or sites.exclude(statut='VALIDE').exists():
            return Response(
                {"detail": "Impossible d'établir un devis : l'étude du site doit d'abord être validée par un technicien."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if Devis.objects.filter(demande=demande).exists():
            return Response(
                {"detail": "Un devis existe déjà pour cette demande."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = DevisCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        lignes = serializer.validated_data['lignes']
        total = sum(ligne['quantite'] * ligne['prix_unitaire'] for ligne in lignes)

        with transaction.atomic():
            devis = Devis.objects.create(demande=demande, montant=total)
            LigneDevis.objects.bulk_create(
                [LigneDevis(devis=devis, **ligne) for ligne in lignes]
            )

        montant_txt = f"{devis.montant:,}".replace(',', ' ')
        notifier(
            demande.client,
            f"Un devis de {montant_txt} Ar a été établi pour votre demande #{demande.id}. "
            f"Consultez-le pour l'accepter ou le refuser.",
            f"demande:{demande.id}",
        )
        return Response(DevisSerializer(devis).data, status=status.HTTP_201_CREATED)


class DevisRepondreView(APIView):
    """
    Le Client accepte ou refuse son devis.
      accepte=true  -> demande VALIDEE
      accepte=false -> demande REJETEE
    """
    permission_classes = [permissions.IsAuthenticated, IsClient]

    def patch(self, request, pk):
        try:
            devis = Devis.objects.select_related('demande').get(
                pk=pk, demande__client=request.user
            )
        except Devis.DoesNotExist:
            return Response({"detail": "Devis introuvable."}, status=status.HTTP_404_NOT_FOUND)

        demande = devis.demande
        if demande.statut != 'EN_ATTENTE':
            return Response(
                {"detail": "Vous avez déjà répondu à ce devis."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = DevisReponseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            demande.statut = 'VALIDEE' if serializer.validated_data['accepte'] else 'REJETEE'
            demande.save(update_fields=['statut'])

        demande = _demandes_qs().get(pk=demande.pk)
        return Response(DemandeClientSerializer(demande, context={'request': request}).data)


# ============================================================
# GARANTIE DU MATÉRIEL (fonctionnalité 5)
# ============================================================
class EquipementsGarantieView(generics.ListAPIView):
    """
    L'Admin consulte les équipements installés et leur garantie.
    Filtres :
      ?expiree=true        -> garantie déjà dépassée
      ?expire_bientot=30   -> garantie expirant dans les N prochains jours
    """
    serializer_class = EquipementGarantieSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get_queryset(self):
        queryset = Equipement.objects.select_related(
            'installation__site__demande__client'
        ).order_by('date_fin_garantie')

        if self.request.query_params.get('expiree') == 'true':
            queryset = queryset.filter(date_fin_garantie__lt=date.today())

        expire_bientot = self.request.query_params.get('expire_bientot')
        if expire_bientot:
            try:
                jours = int(expire_bientot)
            except ValueError:
                jours = 30
            seuil = date.today() + timedelta(days=jours)
            queryset = queryset.filter(date_fin_garantie__gte=date.today(), date_fin_garantie__lte=seuil)

        return queryset


# ============================================================
# SUPERVISION DE L'INSTALLATION (fonctionnalité 6)
# ============================================================
class InstallationsAdminView(generics.ListAPIView):
    """L'Admin suit les installations selon leur état. Filtre : ?statut=PLANIFIEE|EN_COURS|TERMINEE"""
    serializer_class = InstallationAdminSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get_queryset(self):
        queryset = Installation.objects.select_related(
            'site__demande__client', 'technicien'
        ).prefetch_related('equipements').order_by('-id')

        statut = self.request.query_params.get('statut')
        if statut:
            queryset = queryset.filter(statut=statut)

        return queryset


class InstallationDetailAdminView(generics.RetrieveAPIView):
    """L'Admin consulte le détail d'une installation."""
    serializer_class = InstallationAdminSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    queryset = Installation.objects.select_related(
        'site__demande__client', 'technicien'
    ).prefetch_related('equipements')


# ============================================================
# CONSULTATION DES INSTALLATIONS PAR LE CLIENT
# ============================================================
class MesInstallationsClientView(generics.ListAPIView):
    """Le Client consulte les installations de ses demandes. Filtre : ?statut=PLANIFIEE|EN_COURS|TERMINEE"""
    serializer_class = InstallationAdminSerializer
    permission_classes = [permissions.IsAuthenticated, IsClient]

    def get_queryset(self):
        queryset = Installation.objects.filter(
            site__demande__client=self.request.user
        ).select_related(
            'site__demande__client', 'technicien'
        ).prefetch_related('equipements').order_by('-id')

        statut = self.request.query_params.get('statut')
        if statut:
            queryset = queryset.filter(statut=statut)

        return queryset

class InstallationClientDetailView(generics.RetrieveAPIView):
    """Le Client consulte le détail de l'une de ses installations."""
    serializer_class = InstallationAdminSerializer
    permission_classes = [permissions.IsAuthenticated, IsClient]

    def get_queryset(self):
        return Installation.objects.filter(
            site__demande__client=self.request.user
        ).select_related(
            'site__demande__client', 'technicien'
        ).prefetch_related('equipements')

# ============================================================
# EFFECTUER L'INSTALLATION (fonctionnalité 9)
# ============================================================
class InstallationCreateView(APIView):
    """L'Admin planifie une installation : étude du site validée ET devis accepté par le client."""
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def post(self, request):
        serializer = InstallationCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        site = serializer.validated_data['site']
        if site.statut != 'VALIDE' or site.demande.statut != 'VALIDEE':
            return Response(
                {"detail": "Impossible de planifier : l'étude du site doit être validée et le devis accepté par le client."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        installation = Installation.objects.create(
            site=site,
            technicien=serializer.validated_data['technicien'],
            date_installation=serializer.validated_data.get('date_installation'),
            statut='PLANIFIEE',
        )

        notifier(
            installation.technicien,
            f"Une installation vous a été planifiée : « {installation.site.nom} ».",
            f"installation:{installation.id}",
        )
        notifier(
            installation.site.demande.client,
            f"Une installation a été planifiée pour « {installation.site.nom} ».",
            f"installation:{installation.id}",
        )
        return Response(InstallationAdminSerializer(installation).data, status=status.HTTP_201_CREATED)


class MesInstallationsView(generics.ListAPIView):
    """Le Technicien consulte les installations qui lui sont affectées."""
    serializer_class = InstallationTechnicienSerializer
    permission_classes = [permissions.IsAuthenticated, IsTechnicien]

    def get_queryset(self):
        queryset = Installation.objects.filter(technicien=self.request.user).select_related(
            'site__demande__client'
        ).prefetch_related('equipements', 'fichiers').order_by('-id')
        statut = self.request.query_params.get('statut')
        if statut:
            queryset = queryset.filter(statut=statut)
        return queryset


class InstallationDemarrerView(APIView):
    """Le Technicien démarre l'installation."""
    permission_classes = [permissions.IsAuthenticated, IsTechnicien]

    def patch(self, request, pk):
        try:
            installation = Installation.objects.get(pk=pk, technicien=request.user)
        except Installation.DoesNotExist:
            return Response({"detail": "Installation introuvable."}, status=status.HTTP_404_NOT_FOUND)

        if installation.statut != 'PLANIFIEE':
            return Response(
                {"detail": f"Impossible de démarrer : l'installation est au statut '{installation.statut}'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        installation.statut = 'EN_COURS'
        installation.save(update_fields=['statut'])

        return Response(InstallationTechnicienSerializer(installation).data, status=status.HTTP_200_OK)


class EquipementCreateView(generics.ListCreateAPIView):
    """Le Technicien ajoute/consulte les équipements d'une installation EN_COURS."""
    permission_classes = [permissions.IsAuthenticated, IsTechnicien]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return EquipementCreateSerializer
        return EquipementGarantieSerializer

    def get_installation(self):
        if not hasattr(self, '_installation'):
            try:
                installation = Installation.objects.get(pk=self.kwargs['installation_id'])
            except Installation.DoesNotExist:
                raise NotFound({"detail": "Installation introuvable."})
            if installation.technicien_id != self.request.user.id:
                raise PermissionDenied("Cette installation ne vous appartient pas.")
            self._installation = installation
        return self._installation

    def get_queryset(self):
        return Equipement.objects.filter(installation=self.get_installation())

    def perform_create(self, serializer):
        installation = self.get_installation()
        if installation.statut != 'EN_COURS':
            raise ValidationError(
                {"detail": f"Impossible d'ajouter un équipement : l'installation est au statut '{installation.statut}'."}
            )
        serializer.save(installation=installation, statut='ACTIF')


class InstallationPhotosView(generics.ListCreateAPIView):
    """Le Technicien ajoute/consulte les photos d'une installation."""
    serializer_class = FichierInstallationSerializer
    permission_classes = [permissions.IsAuthenticated, IsTechnicien]
    parser_classes = [MultiPartParser, FormParser]

    def get_installation(self):
        if not hasattr(self, '_installation'):
            try:
                installation = Installation.objects.get(pk=self.kwargs['installation_id'])
            except Installation.DoesNotExist:
                raise NotFound({"detail": "Installation introuvable."})
            if installation.technicien_id != self.request.user.id:
                raise PermissionDenied("Cette installation ne vous appartient pas.")
            self._installation = installation
        return self._installation

    def get_queryset(self):
        return FichierInstallation.objects.filter(installation=self.get_installation())

    def perform_create(self, serializer):
        serializer.save(installation=self.get_installation())


class InstallationTerminerView(APIView):
    """Le Technicien termine l'installation (au moins 1 équipement requis)."""
    permission_classes = [permissions.IsAuthenticated, IsTechnicien]

    def patch(self, request, pk):
        try:
            installation = Installation.objects.select_related('site__demande__client').get(
                pk=pk, technicien=request.user
            )
        except Installation.DoesNotExist:
            return Response({"detail": "Installation introuvable."}, status=status.HTTP_404_NOT_FOUND)

        if installation.statut != 'EN_COURS':
            return Response(
                {"detail": f"Impossible de terminer : l'installation est au statut '{installation.statut}'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not installation.equipements.exists():
            return Response(
                {"detail": "Ajoutez au moins un équipement avant de terminer l'installation."},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            installation.statut = 'TERMINEE'
            installation.save(update_fields=['statut'])
            RapportInstallation.objects.create(
                installation=installation,
                contenu=installation.generer_contenu_rapport(),
            )

        notifier(
            installation.site.demande.client,
            f"L'installation « {installation.site.nom} » est terminée. Le rapport est disponible.",
            f"installation:{installation.id}",
        )

        return Response(InstallationTechnicienSerializer(installation).data, status=status.HTTP_200_OK)


# ============================================================
# RAPPORT D'INSTALLATION (fonctionnalités 3 et 7)
# ============================================================
def _peut_acceder_installation(user, installation):
    client_id = installation.site.demande.client_id
    return (
        (user.role == 'CLIENT' and client_id == user.id) or
        (user.role == 'TECHNICIEN' and installation.technicien_id == user.id) or
        user.role == 'ADMIN'
    )


class RapportInstallationDetailView(APIView):
    """
    Consultation JSON du rapport (Client propriétaire, Technicien auteur, ou Admin).
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, installation_id):
        try:
            installation = Installation.objects.select_related(
                'site__demande__client', 'technicien', 'rapport'
            ).get(pk=installation_id)
        except Installation.DoesNotExist:
            return Response({"detail": "Installation introuvable."}, status=status.HTTP_404_NOT_FOUND)

        if not _peut_acceder_installation(request.user, installation):
            return Response({"detail": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)

        if not hasattr(installation, 'rapport'):
            return Response(
                {"detail": "Le rapport n'a pas encore été généré (installation pas encore terminée)."},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(RapportInstallationSerializer(installation.rapport).data)


class ValiderInstallationView(APIView):
    """Le Client valide (accepte) l'installation — remplace la signature électronique."""
    permission_classes = [permissions.IsAuthenticated, IsClient]

    def patch(self, request, installation_id):
        try:
            installation = Installation.objects.select_related(
                'site__demande__client', 'technicien', 'rapport'
            ).get(pk=installation_id)
        except Installation.DoesNotExist:
            return Response({"detail": "Installation introuvable."}, status=status.HTTP_404_NOT_FOUND)

        if installation.site.demande.client_id != request.user.id:
            return Response({"detail": "Cette installation ne vous concerne pas."}, status=status.HTTP_403_FORBIDDEN)

        if not hasattr(installation, 'rapport'):
            return Response(
                {"detail": "Le rapport n'est pas encore disponible."},
                status=status.HTTP_400_BAD_REQUEST
            )

        rapport = installation.rapport
        if rapport.validation_client:
            return Response({"detail": "Cette installation a déjà été validée."}, status=status.HTTP_400_BAD_REQUEST)

        rapport.validation_client = True
        rapport.date_validation = timezone.now()
        rapport.save(update_fields=['validation_client', 'date_validation'])

        if installation.technicien:
            notifier(
                installation.technicien,
                f"Le client a validé l'installation « {installation.site.nom} ».",
                f"installation:{installation.id}",
            )

        return Response(RapportInstallationSerializer(rapport).data, status=status.HTTP_200_OK)


class RapportInstallationPDFView(APIView):
    """Génère et retourne le rapport d'installation en PDF téléchargeable."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, installation_id):
        try:
            installation = Installation.objects.select_related(
                'site__demande__client', 'technicien', 'rapport'
            ).prefetch_related('equipements').get(pk=installation_id)
        except Installation.DoesNotExist:
            return Response({"detail": "Installation introuvable."}, status=status.HTTP_404_NOT_FOUND)

        if not _peut_acceder_installation(request.user, installation):
            return Response({"detail": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)

        if not hasattr(installation, 'rapport'):
            return Response(
                {"detail": "Le rapport n'a pas encore été généré."},
                status=status.HTTP_400_BAD_REQUEST
            )

        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="rapport_installation_{installation.id}.pdf"'
        self._generer_pdf(response, installation)
        return response

    def _generer_pdf(self, response, installation):
        largeur, hauteur = A4
        marge = 20 * mm
        c = canvas.Canvas(response, pagesize=A4)
        y = hauteur - marge
        brand = HexColor('#7A1F2B')
        gris = HexColor('#64748B')

        c.setFillColor(brand)
        c.rect(marge, y - 5 * mm, 8 * mm, 8 * mm, fill=1, stroke=0)
        c.setFillColor(HexColor('#FFFFFF'))
        c.setFont('Helvetica-Bold', 10)
        c.drawCentredString(marge + 4 * mm, y - 2.5 * mm, 'CT')

        c.setFillColor(HexColor('#0F172A'))
        c.setFont('Helvetica-Bold', 14)
        c.drawString(marge + 12 * mm, y, "CAMTRACK — Rapport d'installation")
        y -= 6 * mm
        c.setFont('Helvetica', 9)
        c.setFillColor(gris)
        c.drawString(marge + 12 * mm, y, f"Installation #{installation.id} — Site : {installation.site.nom}")
        y -= 10 * mm

        c.setStrokeColor(HexColor('#E2E8F0'))
        c.line(marge, y, largeur - marge, y)
        y -= 8 * mm

        def section(titre):
            nonlocal y
            c.setFont('Helvetica-Bold', 11)
            c.setFillColor(HexColor('#0F172A'))
            c.drawString(marge, y, titre)
            y -= 6 * mm

        def ligne(texte):
            nonlocal y
            c.setFont('Helvetica', 9)
            c.setFillColor(HexColor('#334155'))
            if y < marge:
                c.showPage()
                y = hauteur - marge
            c.drawString(marge, y, texte[:100])
            y -= 5 * mm

        client = installation.site.demande.client
        section("Informations générales")
        ligne(f"Client : {client.get_full_name() or client.username}")
        ligne(f"Site : {installation.site.nom} — {installation.site.adresse}")
        if installation.technicien:
            ligne(f"Technicien : {installation.technicien.get_full_name() or installation.technicien.username}")
        ligne(f"Date d'installation : {installation.date_installation or 'Non renseignée'}")

        equipements = installation.equipements.all()
        if equipements:
            y -= 3 * mm
            section("Équipements installés")
            for e in equipements:
                ligne(f"- {e.get_type_equipement_display()} {e.model} (IP: {e.adresse_ip or '-'})")
                ligne(f"  Garantie : {e.date_debut_garantie} au {e.date_fin_garantie}")

        y -= 8 * mm
        c.setStrokeColor(HexColor('#E2E8F0'))
        c.line(marge, y, largeur - marge, y)
        y -= 10 * mm

        c.setFont('Helvetica', 9)
        rapport = getattr(installation, 'rapport', None)
        if rapport and rapport.validation_client:
            c.setFillColor(HexColor('#16A34A'))
            c.drawString(marge, y, f"✓ Installation validée par le client le {rapport.date_validation.strftime('%d/%m/%Y %H:%M')}")
        else:
            c.setFillColor(gris)
            c.drawString(marge, y, "En attente de validation par le client")

        c.showPage()
        c.save()


class DemandeCommentairesView(generics.ListCreateAPIView):
    """
    Commentaires d'une demande d'installation.
    - Client : propriétaire de la demande uniquement, ne voit que les PUBLIC, ne poste qu'en PUBLIC
    - Technicien : uniquement s'il est affecté à l'étude d'un site de cette demande, voit tout
    - Admin : accès à toutes les demandes, voit tout
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CommentaireCreateSerializer
        return CommentaireSerializer

    def get_serializer_context(self):
        return {'request': self.request}

    def get_demande(self):
        if not hasattr(self, '_demande'):
            try:
                demande = DemandeInstallation.objects.get(pk=self.kwargs['demande_id'])
            except DemandeInstallation.DoesNotExist:
                raise NotFound({"detail": "Demande introuvable."})

            user = self.request.user
            if user.role == 'CLIENT' and demande.client_id != user.id:
                raise NotFound({"detail": "Demande introuvable."})
            if user.role == 'TECHNICIEN' and not demande.sites.filter(technicien=user).exists():
                raise NotFound({"detail": "Demande introuvable."})

            self._demande = demande
        return self._demande

    def get_queryset(self):
        demande = self.get_demande()
        queryset = Commentaire.objects.filter(demande=demande).select_related('auteur')
        if self.request.user.role == 'CLIENT':
            queryset = queryset.filter(visibilite='PUBLIC')
        return queryset

    def perform_create(self, serializer):
        demande = self.get_demande()
        user = self.request.user
        visibilite = serializer.validated_data.get('visibilite', 'PUBLIC')
        if user.role == 'CLIENT':
            visibilite = 'PUBLIC'

        serializer.save(demande=demande, auteur=user, visibilite=visibilite)

        # Notifie l'autre partie (pas l'auteur lui-même)
        destinataires = set()
        if visibilite == 'PUBLIC' and user.id != demande.client_id:
            destinataires.add(demande.client)
        technicien_concerne = Utilisateur.objects.filter(
            etudes_sites__demande=demande
        ).exclude(id=user.id).first()
        if technicien_concerne:
            destinataires.add(technicien_concerne)
        for dest in destinataires:
            notifier(dest, f"Nouveau commentaire sur votre demande #{demande.id}.", f"demande:{demande.id}")


class CommentaireDeleteView(generics.DestroyAPIView):
    """
    Supprime un commentaire.
    - L'auteur peut supprimer son propre commentaire
    - L'Admin peut supprimer n'importe quel commentaire (modération)
    """
    permission_classes = [permissions.IsAuthenticated]
    queryset = Commentaire.objects.all()

    def get_object(self):
        try:
            commentaire = Commentaire.objects.select_related('demande').get(pk=self.kwargs['pk'])
        except Commentaire.DoesNotExist:
            raise NotFound({"detail": "Commentaire introuvable."})

        user = self.request.user
        if user.role != 'ADMIN' and commentaire.auteur_id != user.id:
            raise PermissionDenied("Vous ne pouvez supprimer que vos propres commentaires.")

        return commentaire