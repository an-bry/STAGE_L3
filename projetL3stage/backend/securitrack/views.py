from datetime import date, timedelta

from django.db.models import Count, Exists, OuterRef, Q
from django.db.models.functions import TruncMonth
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import filters, generics, permissions, status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import Utilisateur
from accounts.permissions import IsAdmin, IsClient, IsTechnicien
from camtrack.models import (
    DemandeInstallation,
    Equipement,
    Installation,
    RapportInstallation,
    Site,
)
from camtrack.notifications import notifier
from smart_ticket.models import Ticket

from .alertes import envoyer_alertes
from .models import Contrat, Maintenance, SEUIL_EXPIRATION_JOURS, etat_contrat
from .serializers import (
    ContratSerializer,
    EquipementSerializer,
    LierTicketSerializer,
    MaintenanceSerializer,
    MotDePasseSerializer,
    SiteSerializer,
    TerminerMaintenanceSerializer,
    TicketResumeSerializer,
    UtilisateurAdminSerializer,
    UtilisateurCreateSerializer,
)


# ───────────── Utilisateurs ─────────────

# Tables liées qui peuvent disparaître sans danger avec l'utilisateur
IGNORES = {
    'smart_ticket.Notification',
    'admin.LogEntry',
    'token_blacklist.OutstandingToken',
    'authtoken.Token',
}


def liens_utilisateur(utilisateur):
    """
    Compte, table par table, les données qui pointent vers cet utilisateur.
    Utilise les relations réelles de Django : elle détecte aussi les tables
    de smart_ticket et securitrack sans qu'on ait à les lister.
    """
    liens = {}
    for rel in utilisateur._meta.related_objects:
        label = rel.related_model._meta.label
        if label in IGNORES:
            continue
        nombre = rel.related_model._default_manager.filter(
            **{rel.field.name: utilisateur}
        ).count()
        if nombre:
            liens[label] = nombre
    return liens


def _interdire_soi_meme(acteur, cible, verbe):
    if acteur.pk == cible.pk:
        raise ValidationError({"detail": f"Vous ne pouvez pas {verbe} votre propre compte."})


class UtilisateurListCreateView(generics.ListCreateAPIView):
    """
    Admin : lister et créer des utilisateurs.
    Filtres : ?role=CLIENT|TECHNICIEN|ADMIN  ?actif=true|false  ?search=...
    """
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    filter_backends = [filters.SearchFilter]
    search_fields = ['username', 'first_name', 'last_name', 'email', 'raison_sociale']

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return UtilisateurCreateSerializer
        return UtilisateurAdminSerializer

    def get_queryset(self):
        queryset = Utilisateur.objects.all().order_by('id')
        role = self.request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role.upper())
        actif = self.request.query_params.get('actif')
        if actif is not None:
            queryset = queryset.filter(is_active=actif.lower() == 'true')
        return queryset


class UtilisateurDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Admin : détail, modification, désactivation (is_active=false) et suppression.
    La suppression est refusée (409) si des données sont liées à l'utilisateur.
    """
    serializer_class = UtilisateurAdminSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    queryset = Utilisateur.objects.all()

    def perform_update(self, serializer):
        instance = serializer.instance
        if serializer.validated_data.get('is_active') is False and instance.is_active:
            _interdire_soi_meme(self.request.user, instance, "désactiver")
        serializer.save()

    def destroy(self, request, *args, **kwargs):
        utilisateur = self.get_object()
        _interdire_soi_meme(request.user, utilisateur, "supprimer")

        liens = liens_utilisateur(utilisateur)
        if liens:
            return Response(
                {
                    "detail": "Suppression impossible : des données sont liées à cet utilisateur. "
                              "Désactivez son compte à la place (is_active = false).",
                    "liens": liens,
                },
                status=status.HTTP_409_CONFLICT,
            )

        utilisateur.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class UtilisateurLiensView(APIView):
    """L'Admin vérifie avant de supprimer : quelles données sont liées à l'utilisateur ?"""
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request, pk):
        utilisateur = get_object_or_404(Utilisateur, pk=pk)
        liens = liens_utilisateur(utilisateur)
        return Response({
            "peut_supprimer": not liens and utilisateur.pk != request.user.pk,
            "liens": liens,
        })


class UtilisateurMotDePasseView(APIView):
    """L'Admin réinitialise le mot de passe d'un utilisateur."""
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def patch(self, request, pk):
        utilisateur = get_object_or_404(Utilisateur, pk=pk)
        serializer = MotDePasseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        utilisateur.set_password(serializer.validated_data['nouveau_mot_de_passe'])
        utilisateur.save(update_fields=['password'])
        return Response({"detail": "Mot de passe modifié."})


# ───────────── Contrats ─────────────

def _contrats_queryset():
    return Contrat.objects.select_related('client').prefetch_related('equipements').order_by('-date_fin')


class ContratListCreateView(generics.ListCreateAPIView):
    """
    Admin : lister et créer des contrats.
    Filtres : ?client=<id>  ?etat=ACTIF|BIENTOT_EXPIRE|EXPIRE
    """
    serializer_class = ContratSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get_queryset(self):
        qs = _contrats_queryset()
        client = self.request.query_params.get('client')
        if client:
            qs = qs.filter(client_id=client)

        etat = (self.request.query_params.get('etat') or '').upper()
        aujourdhui = date.today()
        limite = aujourdhui + timedelta(days=SEUIL_EXPIRATION_JOURS)
        if etat == 'EXPIRE':
            qs = qs.filter(date_fin__lt=aujourdhui)
        elif etat == 'BIENTOT_EXPIRE':
            qs = qs.filter(date_fin__gte=aujourdhui, date_fin__lte=limite)
        elif etat == 'ACTIF':
            qs = qs.filter(date_fin__gt=limite)
        return qs


class ContratDetailView(generics.RetrieveUpdateAPIView):
    """Admin : consulter et modifier un contrat (pas de suppression)."""
    serializer_class = ContratSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    queryset = _contrats_queryset()


class MesContratsView(generics.ListAPIView):
    """Client : ses propres contrats, avec état et équipements couverts."""
    serializer_class = ContratSerializer
    permission_classes = [permissions.IsAuthenticated, IsClient]

    def get_queryset(self):
        return _contrats_queryset().filter(client=self.request.user)


# ───────────── Maintenance préventive ─────────────

def _maintenances_queryset():
    return Maintenance.objects.filter(type_maintenance='PREVENTIVE').select_related(
        'technicien', 'equipement__installation__site__demande__client'
    ).order_by('date', 'id')


def _client_de(m):
    return m.equipement.installation.site.demande.client


class MaintenanceListCreateView(generics.ListCreateAPIView):
    """
    Admin : lister et planifier des maintenances préventives.
    Filtres : ?statut= ?technicien= ?equipement= ?client= ?date_min= ?date_max= ?en_retard=true
    """
    serializer_class = MaintenanceSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get_queryset(self):
        qs = _maintenances_queryset()
        p = self.request.query_params
        if p.get('statut'):
            qs = qs.filter(statut=p['statut'].upper())
        if p.get('technicien'):
            qs = qs.filter(technicien_id=p['technicien'])
        if p.get('equipement'):
            qs = qs.filter(equipement_id=p['equipement'])
        if p.get('client'):
            qs = qs.filter(equipement__installation__site__demande__client_id=p['client'])
        if p.get('date_min'):
            qs = qs.filter(date__gte=p['date_min'])
        if p.get('date_max'):
            qs = qs.filter(date__lte=p['date_max'])
        if (p.get('en_retard') or '').lower() == 'true':
            qs = qs.filter(statut='PLANIFIEE', date__lt=date.today())
        return qs

    def perform_create(self, serializer):
        m = serializer.save(type_maintenance='PREVENTIVE', statut='PLANIFIEE')
        texte = f"Maintenance préventive planifiée le {m.date} ({m.equipement.model})."
        notifier(_client_de(m), texte, f"maintenance:{m.pk}")
        notifier(m.technicien, texte, f"maintenance:{m.pk}")


class MaintenanceDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Admin : consulter, modifier (technicien, date) ou supprimer une maintenance PLANIFIEE."""
    serializer_class = MaintenanceSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get_queryset(self):
        return _maintenances_queryset()

    def update(self, request, *args, **kwargs):
        if self.get_object().statut != 'PLANIFIEE':
            return Response(
                {"detail": "Seule une maintenance planifiée peut être modifiée."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        m = self.get_object()
        if m.statut != 'PLANIFIEE':
            return Response(
                {"detail": "Une maintenance commencée ou terminée est conservée dans l'historique."},
                status=status.HTTP_409_CONFLICT,
            )
        m.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MesMaintenancesView(generics.ListAPIView):
    """Technicien : ses maintenances. Client : celles de ses équipements. Filtre ?statut="""
    serializer_class = MaintenanceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = _maintenances_queryset()
        if user.role == 'TECHNICIEN':
            qs = qs.filter(technicien=user)
        elif user.role == 'CLIENT':
            qs = qs.filter(equipement__installation__site__demande__client=user)
        else:
            return qs.none()
        statut = self.request.query_params.get('statut')
        return qs.filter(statut=statut.upper()) if statut else qs


class _MaintenanceTechnicienView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsTechnicien]
    statut_requis = None

    def patch(self, request, pk):
        m = get_object_or_404(_maintenances_queryset(), pk=pk)
        if m.technicien_id != request.user.id:
            return Response({"detail": "Cette maintenance ne vous est pas affectée."},
                            status=status.HTTP_403_FORBIDDEN)
        if m.statut != self.statut_requis:
            return Response({"detail": f"Action impossible : la maintenance est au statut '{m.statut}'."},
                            status=status.HTTP_400_BAD_REQUEST)
        self.appliquer(request, m)
        return Response(MaintenanceSerializer(m).data)


class MaintenanceDemarrerView(_MaintenanceTechnicienView):
    """Technicien : PLANIFIEE -> EN_COURS."""
    statut_requis = 'PLANIFIEE'

    def appliquer(self, request, m):
        m.statut = 'EN_COURS'
        m.save(update_fields=['statut'])


class MaintenanceTerminerView(_MaintenanceTechnicienView):
    """Technicien : EN_COURS -> TERMINEE, compte rendu obligatoire."""
    statut_requis = 'EN_COURS'

    def appliquer(self, request, m):
        s = TerminerMaintenanceSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        m.statut = 'TERMINEE'
        m.compte_rendu = s.validated_data['compte_rendu']
        m.save(update_fields=['statut', 'compte_rendu'])
        notifier(_client_de(m), f"Maintenance préventive du {m.date} terminée ({m.equipement.model}).",
                 f"maintenance:{m.pk}")


# ───────────── Équipements ─────────────

def _equipements_queryset():
    return Equipement.objects.select_related(
        'installation__site__demande__client'
    ).annotate(nb_maintenances=Count('maintenances', distinct=True)).order_by('id')


class EquipementListCreateView(generics.ListCreateAPIView):
    """
    Admin : lister et créer des équipements.
    Filtres : ?statut= ?type= ?client= ?site= ?installation= ?garantie=active|bientot|expiree ?search=
    """
    serializer_class = EquipementSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    filter_backends = [filters.SearchFilter]
    search_fields = ['model', 'adresse_ip']

    def get_queryset(self):
        qs = _equipements_queryset()
        p = self.request.query_params
        if p.get('statut'):
            qs = qs.filter(statut=p['statut'].upper())
        if p.get('type'):
            qs = qs.filter(type_equipement=p['type'].upper())
        if p.get('client'):
            qs = qs.filter(installation__site__demande__client_id=p['client'])
        if p.get('site'):
            qs = qs.filter(installation__site_id=p['site'])
        if p.get('installation'):
            qs = qs.filter(installation_id=p['installation'])

        garantie = (p.get('garantie') or '').lower()
        aujourdhui = date.today()
        if garantie == 'expiree':
            qs = qs.filter(date_fin_garantie__lt=aujourdhui)
        elif garantie == 'bientot':
            qs = qs.filter(date_fin_garantie__gte=aujourdhui,
                           date_fin_garantie__lte=aujourdhui + timedelta(days=SEUIL_EXPIRATION_JOURS))
        elif garantie == 'active':
            qs = qs.filter(date_fin_garantie__gte=aujourdhui)
        return qs


class EquipementDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Admin : consulter, modifier (statut inclus) ou supprimer un équipement."""
    serializer_class = EquipementSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get_queryset(self):
        return _equipements_queryset()

    def destroy(self, request, *args, **kwargs):
        eq = self.get_object()
        liens = {}
        nb_maintenances = eq.maintenances.count()
        if nb_maintenances:
            liens['maintenances'] = nb_maintenances
        nb_contrats = eq.contrats.count()
        if nb_contrats:
            liens['contrats'] = nb_contrats
        nb_tickets = eq.tickets.count()
        if nb_tickets:
            liens['tickets'] = nb_tickets
        if eq.installation.statut == 'TERMINEE':
            liens['installation_terminee'] = 1

        if liens:
            return Response(
                {"detail": "Suppression impossible. Passez plutôt l'équipement en HORS_SERVICE.",
                 "liens": liens},
                status=status.HTTP_409_CONFLICT,
            )
        eq.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MesEquipementsView(generics.ListAPIView):
    """Client : ses équipements, avec garantie. Filtre ?statut="""
    serializer_class = EquipementSerializer
    permission_classes = [permissions.IsAuthenticated, IsClient]

    def get_queryset(self):
        qs = _equipements_queryset().filter(installation__site__demande__client=self.request.user)
        statut = self.request.query_params.get('statut')
        return qs.filter(statut=statut.upper()) if statut else qs


# ───────────── Sites ─────────────

def _sites_queryset():
    return Site.objects.select_related('technicien', 'demande__client').prefetch_related(
        'fichiers'
    ).annotate(nb_installations=Count('installations', distinct=True)).order_by('-id')


class SiteListCreateView(generics.ListCreateAPIView):
    """Admin : lister et créer des sites. Filtres : ?statut= ?demande= ?client= ?technicien= ?search="""
    serializer_class = SiteSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    filter_backends = [filters.SearchFilter]
    search_fields = ['nom', 'adresse']

    def get_queryset(self):
        qs = _sites_queryset()
        p = self.request.query_params
        if p.get('statut'):
            qs = qs.filter(statut=p['statut'].upper())
        if p.get('demande'):
            qs = qs.filter(demande_id=p['demande'])
        if p.get('client'):
            qs = qs.filter(demande__client_id=p['client'])
        if p.get('technicien'):
            qs = qs.filter(technicien_id=p['technicien'])
        return qs

    def perform_create(self, serializer):
        serializer.save(statut='EN_ETUDE')


class SiteDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Admin : consulter, modifier ou supprimer un site."""
    serializer_class = SiteSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get_queryset(self):
        return _sites_queryset()

    def destroy(self, request, *args, **kwargs):
        site = self.get_object()
        liens = {}
        nb = site.installations.count()
        if nb:
            liens['installations'] = nb
        if site.demande.statut != 'REJETEE' and site.demande.sites.count() == 1:
            liens['dernier_site_de_la_demande'] = 1

        if liens:
            return Response({"detail": "Suppression impossible.", "liens": liens},
                            status=status.HTTP_409_CONFLICT)

        for f in site.fichiers.all():
            f.fichier.delete(save=False)
        site.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MesSitesView(generics.ListAPIView):
    """Client : les sites de ses demandes."""
    serializer_class = SiteSerializer
    permission_classes = [permissions.IsAuthenticated, IsClient]

    def get_queryset(self):
        return _sites_queryset().filter(demande__client=self.request.user)


# ───────────── Historique d'un équipement ─────────────

class EquipementHistoriqueView(APIView):
    """
    Admin : historique de n'importe quel équipement.
    Client : historique de ses propres équipements uniquement.
    Inclut : installation, maintenances préventives, contrats, tickets et interventions.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        user = request.user
        qs = _equipements_queryset()
        if user.role == 'CLIENT':
            qs = qs.filter(installation__site__demande__client=user)
        elif user.role != 'ADMIN':
            return Response({"detail": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)
        equipement = get_object_or_404(qs, pk=pk)

        evenements = []

        installation = equipement.installation
        if installation.date_installation:
            evenements.append({
                'date': installation.date_installation,
                'type': 'INSTALLATION',
                'libelle': f"Installation sur le site « {installation.site.nom} »",
                'statut': installation.statut,
                'detail': '',
            })

        maintenances = list(_maintenances_queryset().filter(equipement=equipement))
        for m in maintenances:
            t = m.technicien
            evenements.append({
                'date': m.date,
                'type': 'MAINTENANCE_PREVENTIVE',
                'id': m.id,
                'libelle': f"Maintenance préventive — {m.get_statut_display()}",
                'statut': m.statut,
                'technicien': (t.get_full_name() or t.username) if t else None,
                'detail': m.compte_rendu,
            })

        for c in equipement.contrats.all():
            evenements.append({
                'date': c.date_debut,
                'type': 'CONTRAT',
                'id': c.id,
                'libelle': f"Contrat #{c.id} (du {c.date_debut} au {c.date_fin})",
                'statut': etat_contrat(c.date_fin),
                'detail': '',
            })

        tickets = list(
            equipement.tickets.select_related('technicien')
            .prefetch_related('interventions__technicien')
        )
        for t in tickets:
            evenements.append({
                'date': t.date_creation,
                'type': 'TICKET',
                'id': t.id,
                'libelle': f"Ticket #{t.id} — {t.get_statut_display()} (priorité {t.get_priorite_display()})",
                'statut': t.statut,
                'detail': t.description,
            })
            for i in t.interventions.all():
                evenements.append({
                    'date': i.date,
                    'type': 'INTERVENTION',
                    'id': i.id,
                    'ticket': t.id,
                    'libelle': f"Intervention #{i.id} (ticket #{t.id}) — {i.get_statut_display()}",
                    'statut': i.statut,
                    'technicien': i.technicien.get_full_name() or i.technicien.username,
                    'detail': i.resultat_intervention or i.diagnostic,
                })

        evenements.sort(key=lambda e: e['date'], reverse=True)

        terminees = [m for m in maintenances if m.statut == 'TERMINEE']
        planifiees = [m for m in maintenances if m.statut == 'PLANIFIEE']
        return Response({
            'equipement': EquipementSerializer(equipement).data,
            'resume': {
                'nb_maintenances': len(maintenances),
                'nb_terminees': len(terminees),
                'derniere_maintenance': max((m.date for m in terminees), default=None),
                'prochaine_maintenance': min((m.date for m in planifiees), default=None),
                'nb_tickets': len(tickets),
                'nb_tickets_ouverts': sum(
                    1 for t in tickets if t.statut not in ('RESOLU', 'CLOTURE')
                ),
            },
            'chronologie': evenements,
        })


# ───────────── Alertes ─────────────

class AlertesView(APIView):
    """
    Admin : tout ce qui demande son attention.
    Paramètre : ?jours=30 (horizon des échéances, 1 à 365, défaut 30)
    """
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        try:
            jours = int(request.query_params.get('jours', SEUIL_EXPIRATION_JOURS))
        except ValueError:
            jours = SEUIL_EXPIRATION_JOURS
        jours = max(1, min(jours, 365))

        aujourdhui = date.today()
        limite = aujourdhui + timedelta(days=jours)

        contrats_bientot = _contrats_queryset().filter(
            date_fin__gte=aujourdhui, date_fin__lte=limite
        ).order_by('date_fin')

        contrat_en_cours = Contrat.objects.filter(
            equipements=OuterRef('pk'),
            date_debut__lte=aujourdhui, date_fin__gte=aujourdhui,
        )
        sans_contrat = _equipements_queryset().filter(
            installation__statut='TERMINEE',
        ).exclude(statut='HORS_SERVICE').filter(~Exists(contrat_en_cours))

        garanties = _equipements_queryset().exclude(statut='HORS_SERVICE').filter(
            date_fin_garantie__gte=aujourdhui, date_fin_garantie__lte=limite
        ).order_by('date_fin_garantie')

        en_panne = _equipements_queryset().filter(statut='EN_PANNE')

        en_retard = _maintenances_queryset().filter(statut='PLANIFIEE', date__lt=aujourdhui)
        a_venir = _maintenances_queryset().filter(
            statut='PLANIFIEE', date__gte=aujourdhui, date__lte=limite
        )

        alertes = {
            'contrats_bientot_expires': ContratSerializer(contrats_bientot, many=True).data,
            'equipements_sans_contrat': EquipementSerializer(sans_contrat, many=True).data,
            'garanties_bientot_expirees': EquipementSerializer(garanties, many=True).data,
            'equipements_en_panne': EquipementSerializer(en_panne, many=True).data,
            'maintenances_en_retard': MaintenanceSerializer(en_retard, many=True).data,
            'maintenances_a_venir': MaintenanceSerializer(a_venir, many=True).data,
        }
        resume = {cle: len(valeur) for cle, valeur in alertes.items()}

        return Response({
            'horizon_jours': jours,
            'resume': resume,
            'urgent': (
                resume['maintenances_en_retard']
                + resume['equipements_en_panne']
                + resume['equipements_sans_contrat']
            ),
            **alertes,
        })


class AlertesEnvoyerView(APIView):
    """
    Admin : déclenche l'envoi des notifications d'échéance.
    Body (facultatif) : {"jours": 30, "dry_run": true}
    """
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def post(self, request):
        try:
            jours = int(request.data.get('jours', SEUIL_EXPIRATION_JOURS))
        except (TypeError, ValueError):
            raise ValidationError({'jours': "Doit être un nombre entier."})
        if not 1 <= jours <= 365:
            raise ValidationError({'jours': "Doit être compris entre 1 et 365."})
        dry_run = str(request.data.get('dry_run', 'false')).lower() == 'true'
        return Response(envoyer_alertes(jours=jours, dry_run=dry_run))


# ───────────── Tableau de bord décisionnel ─────────────

def _compter(queryset, champ, choix):
    """Répartition par valeur d'un champ (0 pour les valeurs absentes)."""
    donnees = {valeur: 0 for valeur, _ in choix}
    for ligne in queryset.order_by().values(champ).annotate(n=Count('id')):
        donnees[ligne[champ]] = ligne['n']
    return donnees


def _pourcentage(partie, total):
    return round(100 * partie / total, 1) if total else None


def _mois_precedent(jour):
    return (jour.replace(day=1) - timedelta(days=1)).replace(day=1)


class TableauDeBordView(APIView):
    """Admin : indicateurs de pilotage (SECURITRACK, Smart Ticket) et vue d'ensemble de CAMTRACK."""
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        aujourdhui = date.today()
        limite = aujourdhui + timedelta(days=SEUIL_EXPIRATION_JOURS)
        debut_mois = aujourdhui.replace(day=1)
        mois_suivant = (debut_mois + timedelta(days=32)).replace(day=1)

        # ── Utilisateurs
        actifs = Utilisateur.objects.filter(is_active=True)
        utilisateurs = {
            'clients': actifs.filter(role='CLIENT').count(),
            'techniciens': actifs.filter(role='TECHNICIEN').count(),
            'admins': actifs.filter(role='ADMIN').count(),
            'desactives': Utilisateur.objects.filter(is_active=False).count(),
        }

        # ── Contrats
        contrat_en_cours = Contrat.objects.filter(
            date_debut__lte=aujourdhui, date_fin__gte=aujourdhui
        )
        clients_equipes = Utilisateur.objects.filter(
            role='CLIENT', is_active=True,
            demandes_installation__sites__installations__statut='TERMINEE',
        ).distinct()
        clients_sans_contrat = clients_equipes.filter(
            ~Exists(contrat_en_cours.filter(client=OuterRef('pk')))
        ).count()

        contrats = {
            'total': Contrat.objects.count(),
            'actifs': Contrat.objects.filter(date_fin__gt=limite).count(),
            'bientot_expires': Contrat.objects.filter(
                date_fin__gte=aujourdhui, date_fin__lte=limite).count(),
            'expires': Contrat.objects.filter(date_fin__lt=aujourdhui).count(),
            'clients_equipes_sans_contrat': clients_sans_contrat,
        }

        # ── Équipements
        equipements_tous = Equipement.objects.all()
        par_statut = _compter(equipements_tous, 'statut', Equipement.STATUT_CHOICES)
        en_service = sum(par_statut.values()) - par_statut.get('HORS_SERVICE', 0)
        sans_contrat = (
            equipements_tous.filter(installation__statut='TERMINEE')
            .exclude(statut='HORS_SERVICE')
            .filter(~Exists(contrat_en_cours.filter(equipements=OuterRef('pk'))))
            .count()
        )
        equipements = {
            'total': equipements_tous.count(),
            'par_statut': par_statut,
            'par_type': _compter(equipements_tous, 'type_equipement', Equipement.TYPE_CHOICES),
            'taux_actifs': _pourcentage(par_statut.get('ACTIF', 0), en_service),
            'sans_contrat': sans_contrat,
            'garantie': {
                'valide': equipements_tous.filter(date_fin_garantie__gt=limite).count(),
                'bientot_expiree': equipements_tous.filter(
                    date_fin_garantie__gte=aujourdhui, date_fin_garantie__lte=limite).count(),
                'expiree': equipements_tous.filter(date_fin_garantie__lt=aujourdhui).count(),
            },
        }

        # ── Maintenances préventives
        maintenances = Maintenance.objects.filter(type_maintenance='PREVENTIVE')
        en_retard = maintenances.filter(statut='PLANIFIEE', date__lt=aujourdhui).count()

        echues = maintenances.filter(Q(date__lt=aujourdhui) | Q(statut='TERMINEE'))
        nb_echues = echues.count()
        nb_echues_terminees = echues.filter(statut='TERMINEE').count()

        ce_mois = maintenances.filter(date__gte=debut_mois, date__lt=mois_suivant).aggregate(
            total=Count('id'),
            terminees=Count('id', filter=Q(statut='TERMINEE')),
            planifiees=Count('id', filter=Q(statut='PLANIFIEE')),
            en_cours=Count('id', filter=Q(statut='EN_COURS')),
        )

        mois = []
        courant = debut_mois
        for _ in range(6):
            mois.append(courant)
            courant = _mois_precedent(courant)
        mois.reverse()
        serie = (
            maintenances.filter(date__gte=mois[0], date__lt=mois_suivant)
            .annotate(mois=TruncMonth('date')).order_by().values('mois')
            .annotate(total=Count('id'), terminees=Count('id', filter=Q(statut='TERMINEE')))
        )
        par_mois = {ligne['mois']: ligne for ligne in serie}

        charge = (
            maintenances.filter(statut__in=['PLANIFIEE', 'EN_COURS'], technicien__isnull=False)
            .order_by().values('technicien__id', 'technicien__username')
            .annotate(nb=Count('id')).order_by('-nb')[:5]
        )

        maintenances_stats = {
            'par_statut': _compter(maintenances, 'statut', Maintenance.STATUT_CHOICES),
            'en_retard': en_retard,
            'taux_realisation': _pourcentage(nb_echues_terminees, nb_echues),
            'ce_mois': ce_mois,
            'evolution_6_mois': [
                {
                    'mois': m.strftime('%Y-%m'),
                    'total': par_mois.get(m, {}).get('total', 0),
                    'terminees': par_mois.get(m, {}).get('terminees', 0),
                }
                for m in mois
            ],
            'charge_techniciens': [
                {'technicien': l['technicien__id'], 'nom': l['technicien__username'],
                 'maintenances_ouvertes': l['nb']}
                for l in charge
            ],
        }

        # ── Vue d'ensemble CAMTRACK
        camtrack = {
            'demandes': _compter(DemandeInstallation.objects.all(), 'statut',
                                 DemandeInstallation.STATUT_CHOICES),
            'sites': _compter(Site.objects.all(), 'statut', Site.STATUT_CHOICES),
            'installations': _compter(Installation.objects.all(), 'statut',
                                      Installation.STATUT_CHOICES),
            'rapports_non_valides': RapportInstallation.objects.filter(
                validation_client=False).count(),
        }

        # ── Smart Ticket (incidents)
        statuts_ouverts = ['NOUVEAU', 'A_QUALIFIER', 'AFFECTE', 'PLANIFIE', 'EN_COURS', 'EN_ATTENTE']
        tickets_tous = Ticket.objects.all()
        tickets_ouverts = tickets_tous.filter(statut__in=statuts_ouverts)
        plus_en_panne = (
            Ticket.objects.filter(equipement_ref__isnull=False)
            .order_by()
            .values('equipement_ref__id', 'equipement_ref__model', 'equipement_ref__type_equipement')
            .annotate(nb=Count('id')).order_by('-nb')[:5]
        )
        tickets_stats = {
            'total': tickets_tous.count(),
            'ouverts': tickets_ouverts.count(),
            'par_statut': _compter(tickets_tous, 'statut', Ticket.STATUT_CHOICES),
            'ouverts_par_priorite': _compter(tickets_ouverts, 'priorite', Ticket.PRIORITE_CHOICES),
            'sla_depasse': tickets_ouverts.filter(sla_deadline__lt=timezone.now()).count(),
            'ouverts_sur_equipement': tickets_ouverts.filter(equipement_ref__isnull=False).count(),
            'ouverts_sans_equipement_lie': tickets_ouverts.filter(equipement_ref__isnull=True).count(),
            'equipements_les_plus_en_panne': [
                {'equipement': l['equipement_ref__id'], 'model': l['equipement_ref__model'],
                 'type': l['equipement_ref__type_equipement'], 'nb_tickets': l['nb']}
                for l in plus_en_panne
            ],
        }

        return Response({
            'date': aujourdhui,
            'seuil_jours': SEUIL_EXPIRATION_JOURS,
            'alertes': {
                'urgent': en_retard + par_statut.get('EN_PANNE', 0) + sans_contrat,
                'maintenances_en_retard': en_retard,
                'equipements_en_panne': par_statut.get('EN_PANNE', 0),
                'equipements_sans_contrat': sans_contrat,
                'contrats_bientot_expires': contrats['bientot_expires'],
                'garanties_bientot_expirees': equipements['garantie']['bientot_expiree'],
            },
            'utilisateurs': utilisateurs,
            'contrats': contrats,
            'equipements': equipements,
            'maintenances': maintenances_stats,
            'tickets': tickets_stats,
            'camtrack': camtrack,
        })


# ───────────── Liaison avec Smart Ticket ─────────────

def _couverture(equipement):
    """Un équipement est-il sous contrat / sous garantie aujourd'hui ?"""
    aujourdhui = date.today()
    contrat = Contrat.objects.filter(
        equipements=equipement,
        date_debut__lte=aujourdhui, date_fin__gte=aujourdhui,
    ).order_by('-date_fin').first()
    return {
        'equipement': equipement.id,
        'statut_equipement': equipement.statut,
        'sous_contrat': contrat is not None,
        'contrat': {
            'id': contrat.id,
            'date_fin': contrat.date_fin,
            'etat': etat_contrat(contrat.date_fin),
        } if contrat else None,
        'sous_garantie': not equipement.garantie_expiree,
        'garantie_fin': equipement.date_fin_garantie,
        'garantie_jours_restants': equipement.garantie_jours_restants,
    }


class LierTicketEquipementView(APIView):
    """
    Admin : relie un ticket à un équipement du parc, ou le délie (equipement = null).
    Body : {"equipement": <id> | null, "marquer_en_panne": false}
    """
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def patch(self, request, pk):
        ticket = get_object_or_404(Ticket.objects.select_related('client'), pk=pk)
        s = LierTicketSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        equipement = s.validated_data['equipement']

        if equipement is not None:
            proprietaire = equipement.installation.site.demande.client_id
            if proprietaire != ticket.client_id:
                raise ValidationError(
                    {'equipement': "Cet équipement n'appartient pas au client de ce ticket."}
                )

        ticket.equipement_ref = equipement
        ticket.save(update_fields=['equipement_ref'])

        if equipement and s.validated_data['marquer_en_panne'] and equipement.statut == 'ACTIF':
            equipement.statut = 'EN_PANNE'
            equipement.save(update_fields=['statut'])

        return Response({
            'ticket': TicketResumeSerializer(ticket).data,
            'couverture': _couverture(equipement) if equipement else None,
        })


class TicketCouvertureView(APIView):
    """
    Un ticket est-il sous contrat / sous garantie ?
    Admin : tous les tickets. Technicien : ses tickets. Client : ses tickets.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        user = request.user
        qs = Ticket.objects.select_related('client', 'equipement_ref')
        if user.role == 'CLIENT':
            qs = qs.filter(client=user)
        elif user.role == 'TECHNICIEN':
            qs = qs.filter(technicien=user)
        elif user.role != 'ADMIN':
            return Response({"detail": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)

        ticket = get_object_or_404(qs, pk=pk)
        equipement = ticket.equipement_ref
        return Response({
            'ticket': TicketResumeSerializer(ticket).data,
            'couverture': _couverture(equipement) if equipement else None,
            'detail': None if equipement else "Aucun équipement lié à ce ticket.",
        })