from datetime import datetime, timedelta

from django.db import transaction
from django.db.models import F
from django.utils import timezone
from rest_framework import generics, permissions, filters, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError, NotFound

from accounts.permissions import IsClient, IsAdmin, IsTechnicien
from accounts.models import Utilisateur
from camtrack.notifications import notifier
from .models import (
    Ticket,
    Intervention,
    PieceUtilisee,
    Rapport,
    HistoriqueTicket,
    Planification,
    Commentaire,
    Piece,
    Notification,
    PieceDemandee,
    Devis,
    LigneDevis,
    enregistrer_historique,
)
from .serializers import (
    NotificationSerializer,
    PieceSerializer,
    TicketSerializer,
    TicketCreateSerializer,
    TicketAdminSerializer,
    TicketAffecterSerializer,
    TicketTechnicienSerializer,
    TicketSuiviSerializer,
    TicketPrioriteManuelleSerializer,
    InterventionSerializer,
    InterventionCreateSerializer,
    InterventionSuiviSerializer,
    InterventionDiagnosticDetailSerializer,
    InterventionTerminerSerializer,
    PieceUtiliseeSerializer,
    PieceUtiliseeCreateSerializer,
    RapportSerializer,
    HistoriqueTicketSerializer,
    PlanificationSerializer,
    PlanificationCreateSerializer,
    CommentaireSerializer,
    CommentaireCreateSerializer,
    PieceDemandeeSerializer,
    PieceDemandeeCreateSerializer,
    DevisSerializer,
    DevisEcritureSerializer,
    DevisRefusSerializer,
)
from django.http import HttpResponse
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor


class TicketCreateView(generics.CreateAPIView):
    serializer_class = TicketCreateSerializer
    permission_classes = [permissions.IsAuthenticated, IsClient]

    def perform_create(self, serializer):
        # NB: 'OUVERT' n'existe pas dans Ticket.STATUT_CHOICES (anomalie corrigée).
        # Le statut initial d'un ticket nouvellement créé est 'NOUVEAU'.
        serializer.save(client=self.request.user, statut='NOUVEAU')


class MesTicketsView(generics.ListAPIView):
    serializer_class = TicketSerializer
    permission_classes = [permissions.IsAuthenticated, IsClient]

    def get_queryset(self):
        return Ticket.objects.filter(client=self.request.user).order_by('-date_creation')


class TousLesTicketsView(generics.ListAPIView):
    serializer_class = TicketAdminSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    filter_backends = [filters.OrderingFilter, filters.SearchFilter]
    ordering_fields = ['date_creation', 'priorite', 'statut']
    ordering = ['-date_creation', '-priorite']
    search_fields = ['description', 'client__username']

    def get_queryset(self):
        queryset = Ticket.objects.select_related('client', 'technicien')
        statut = self.request.query_params.get('statut')
        if statut:
            queryset = queryset.filter(statut=statut)
        return queryset


class TicketDetailAdminView(generics.RetrieveAPIView):
    serializer_class = TicketAdminSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    queryset = Ticket.objects.select_related('client', 'technicien')


class TicketAffecterView(APIView):
    """Affecte un technicien à un ticket (Admin uniquement)."""
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def patch(self, request, pk):
        try:
            ticket = Ticket.objects.get(pk=pk)
        except Ticket.DoesNotExist:
            return Response({"detail": "Ticket introuvable."}, status=status.HTTP_404_NOT_FOUND)

        # Anomalie corrigée : la comparaison portait sur 'OUVERT', une valeur absente
        # de Ticket.STATUT_CHOICES. Un ticket fraîchement créé est au statut 'NOUVEAU'.
        if ticket.statut != 'NOUVEAU':
            return Response(
                {"detail": f"Impossible d'affecter un technicien : le ticket est au statut '{ticket.statut}' (réservé aux tickets NOUVEAU)."},
                status=status.HTTP_400_BAD_REQUEST
            )

        ancien_technicien_label = ticket.technicien.username if ticket.technicien else 'Non affecté'
        ancien_statut = ticket.statut

        serializer = TicketAffecterSerializer(ticket, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        technicien_choisi = serializer.validated_data['technicien']
        serializer.save(statut='AFFECTE')

        enregistrer_historique(ticket, 'TECHNICIEN', ancien_technicien_label, technicien_choisi.username, request.user)
        enregistrer_historique(ticket, 'STATUT', ancien_statut, 'AFFECTE', request.user)
        notifier(ticket.client, f"Votre ticket TCK-{str(ticket.id).zfill(5)} a été affecté à un technicien.", f"ticket:{ticket.id}")
        notifier(technicien_choisi, f"Un nouveau ticket TCK-{str(ticket.id).zfill(5)} vous a été affecté.", f"ticket:{ticket.id}")
        return Response(TicketAdminSerializer(ticket).data, status=status.HTTP_200_OK)


class MesTicketsAffectesView(generics.ListAPIView):
    """Liste des tickets affectés au Technicien connecté (tous statuts)."""
    serializer_class = TicketTechnicienSerializer
    permission_classes = [permissions.IsAuthenticated, IsTechnicien]

    def get_queryset(self):
        return Ticket.objects.select_related('client').filter(
            technicien=self.request.user,
            statut__in=[
                'AFFECTE', 'A_QUALIFIER', 'PLANIFIE', 'EN_COURS',
                'EN_ATTENTE', 'RESOLU', 'CLOTURE'
            ]
        ).order_by('-id')


class InterventionCreateView(APIView):
    """
    Le Technicien crée une intervention (diagnostic) sur un ticket qui lui est affecté.
    """
    permission_classes = [permissions.IsAuthenticated, IsTechnicien]

    def post(self, request, ticket_id):
        try:
            ticket = Ticket.objects.get(pk=ticket_id)
        except Ticket.DoesNotExist:
            return Response({"detail": "Ticket introuvable."}, status=status.HTTP_404_NOT_FOUND)

        if ticket.technicien_id != request.user.id:
            return Response(
                {"detail": "Ce ticket ne vous est pas affecté."},
                status=status.HTTP_403_FORBIDDEN
            )

        if ticket.statut != 'AFFECTE':
            return Response(
                {"detail": f"Impossible de créer une intervention : le ticket est au statut '{ticket.statut}'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if ticket.interventions.exists():
            return Response(
                {"detail": "Un diagnostic existe déjà pour ce ticket."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = InterventionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        # Début du DIAGNOSTIC : le ticket reste AFFECTE. Il ne passera EN_COURS
        # qu'une fois le devis accepté par le Client (voir DevisAccepterView).
        intervention = serializer.save(
            technicien=request.user,
            ticket=ticket,
            statut='EN_COURS'
        )

        return Response(InterventionSerializer(intervention).data, status=status.HTTP_201_CREATED)

    def get(self, request, ticket_id):
        """Le Technicien relit l'intervention déjà créée sur un de ses tickets."""
        try:
            ticket = Ticket.objects.get(pk=ticket_id)
        except Ticket.DoesNotExist:
            return Response({"detail": "Ticket introuvable."}, status=status.HTTP_404_NOT_FOUND)

        if ticket.technicien_id != request.user.id:
            return Response(
                {"detail": "Ce ticket ne vous est pas affecté."},
                status=status.HTTP_403_FORBIDDEN
            )

        intervention = ticket.interventions.order_by('-id').first()
        if intervention is None:
            return Response(None, status=status.HTTP_200_OK)

        return Response(InterventionSuiviSerializer(intervention).data, status=status.HTTP_200_OK)


class PieceUtiliseeListCreateView(generics.ListCreateAPIView):
    """
    Liste / ajoute les pièces utilisées sur une intervention.
    """
    permission_classes = [permissions.IsAuthenticated, IsTechnicien]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PieceUtiliseeCreateSerializer
        return PieceUtiliseeSerializer

    def get_intervention(self):
        if not hasattr(self, '_intervention'):
            try:
                intervention = Intervention.objects.get(pk=self.kwargs['intervention_id'])
            except Intervention.DoesNotExist:
                raise NotFound({"detail": "Intervention introuvable."})

            if intervention.technicien_id != self.request.user.id:
                raise PermissionDenied("Cette intervention ne vous appartient pas.")

            self._intervention = intervention
        return self._intervention

    def get_queryset(self):
        intervention = self.get_intervention()
        return PieceUtilisee.objects.filter(intervention=intervention)

    def perform_create(self, serializer):
        intervention = self.get_intervention()

        if intervention.statut != 'EN_COURS':
            raise ValidationError(
                {"detail": f"Impossible d'ajouter une pièce : l'intervention est au statut '{intervention.statut}'."}
            )

        if intervention.ticket.statut != 'EN_COURS':
            raise ValidationError(
                {"detail": "Impossible d'ajouter une pièce utilisée : le devis doit d'abord être accepté par le client."}
            )

        piece_utilisee = serializer.save(intervention=intervention)

        # Décrémente le stock si pièce référencée.
        # Utilisation d'une mise à jour atomique (F()) plutôt que d'un
        # read-then-write en Python, pour éviter une condition de course si
        # deux techniciens utilisent la même pièce en même temps.
        if piece_utilisee.piece_id:
            Piece.objects.filter(pk=piece_utilisee.piece_id).update(
                stock_actuel=F('stock_actuel') - piece_utilisee.quantite
            )


class TerminerInterventionView(APIView):
    """
    Le Technicien termine son intervention.
    - Génère automatiquement le Rapport (si pas déjà généré)
    - Passage en TERMINEE
    """
    permission_classes = [permissions.IsAuthenticated, IsTechnicien]

    def patch(self, request, intervention_id):
        try:
            intervention = Intervention.objects.select_related(
                'ticket__client', 'technicien'
            ).get(pk=intervention_id)
        except Intervention.DoesNotExist:
            return Response(
                {"detail": "Intervention introuvable."},
                status=status.HTTP_404_NOT_FOUND
            )

        if intervention.technicien_id != request.user.id:
            return Response(
                {"detail": "Cette intervention ne vous appartient pas."},
                status=status.HTTP_403_FORBIDDEN
            )

        if intervention.statut != 'EN_COURS':
            return Response(
                {"detail": f"Impossible de terminer : l'intervention est au statut '{intervention.statut}'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if intervention.ticket.statut != 'EN_COURS':
            return Response(
                {"detail": "Impossible de terminer : le devis doit d'abord être accepté par le client."},
                status=status.HTTP_400_BAD_REQUEST
            )

        body_serializer = InterventionTerminerSerializer(data=request.data)
        body_serializer.is_valid(raise_exception=True)
        temps_passe = body_serializer.validated_data.get('temps_passe_minutes')

        try:
            with transaction.atomic():
                # 1. Met à jour l'intervention
                intervention.statut = 'TERMINEE'
                update_fields = ['statut']
                if temps_passe is not None:
                    intervention.temps_passe_minutes = temps_passe
                    update_fields.append('temps_passe_minutes')
                intervention.save(update_fields=update_fields)

                # 2. Crée le rapport SEULEMENT s'il n'existe pas déjà
                rapport, created = Rapport.objects.get_or_create(
                    intervention=intervention,
                    defaults={
                        'contenu': intervention.generer_contenu_rapport(),
                        'type_rapport': 'INTERVENTION',
                    }
                )
        except Exception as e:
            return Response(
                {"detail": f"Erreur lors de la finalisation : {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # Notifie le client (en dehors de la transaction)
        notifier(
            intervention.ticket.client,
            f"L'intervention sur votre ticket TCK-{str(intervention.ticket_id).zfill(5)} est terminée, en attente de votre validation.",
            f"ticket:{intervention.ticket_id}"
        )

        return Response({
            "intervention": InterventionSerializer(intervention).data,
            "rapport": RapportSerializer(rapport).data
        }, status=status.HTTP_200_OK)


class TicketSuiviView(generics.RetrieveAPIView):
    """
    Le Client consulte le suivi complet d'UN de ses tickets.
    """
    serializer_class = TicketSuiviSerializer
    permission_classes = [permissions.IsAuthenticated, IsClient]

    def get_queryset(self):
        return Ticket.objects.filter(
            client=self.request.user
        ).select_related('technicien').prefetch_related(
            'interventions__pieces_utilisees',
            'interventions__rapport',
            'interventions__technicien',
        )


class ValiderInterventionView(APIView):
    """
    Le Client valide l'intervention réalisée sur un de ses tickets.
    """
    permission_classes = [permissions.IsAuthenticated, IsClient]

    def patch(self, request, intervention_id):
        try:
            intervention = Intervention.objects.select_related('ticket').get(pk=intervention_id)
        except Intervention.DoesNotExist:
            return Response({"detail": "Intervention introuvable."}, status=status.HTTP_404_NOT_FOUND)

        if intervention.ticket.client_id != request.user.id:
            return Response(
                {"detail": "Cette intervention ne concerne pas un de vos tickets."},
                status=status.HTTP_403_FORBIDDEN
            )

        if intervention.statut != 'TERMINEE':
            return Response(
                {"detail": f"Impossible de valider : l'intervention est au statut '{intervention.statut}' (elle doit être TERMINEE)."},
                status=status.HTTP_400_BAD_REQUEST
            )

        intervention.validation_client = True
        intervention.statut = 'VALIDEE'
        intervention.save(update_fields=['validation_client', 'statut'])

        ticket = intervention.ticket
        ancien_statut = ticket.statut
        ticket.statut = 'CLOTURE'
        ticket.save(update_fields=['statut'])
        enregistrer_historique(ticket, 'STATUT', ancien_statut, 'CLOTURE', request.user)
        notifier(
            intervention.technicien,
            f"Le client a validé l'intervention sur le ticket TCK-{str(ticket.id).zfill(5)}, ticket clôturé.",
            f"ticket:{ticket.id}"
        )
        notifier(
            intervention.technicien,
            f"Le client a validé l'intervention sur le ticket TCK-{str(ticket.id).zfill(5)}, ticket clôturé.",
            f"ticket:{ticket.id}"
        )
        _remettre_equipement_en_service(ticket)      # <-- LIGNE AJOUTÉE
        return Response({
            "intervention": InterventionSerializer(intervention).data,
            "ticket": TicketSerializer(ticket).data
        }, status=status.HTTP_200_OK)


class TicketHistoriqueView(generics.ListAPIView):
    """
    Timeline des changements d'un ticket (statut, priorité, affectation).
    """
    serializer_class = HistoriqueTicketSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        try:
            ticket = Ticket.objects.get(pk=self.kwargs['ticket_id'])
        except Ticket.DoesNotExist:
            raise NotFound({"detail": "Ticket introuvable."})

        user = self.request.user
        if user.role == 'CLIENT' and ticket.client_id != user.id:
            raise NotFound({"detail": "Ticket introuvable."})
        if user.role == 'TECHNICIEN' and ticket.technicien_id != user.id:
            raise NotFound({"detail": "Ticket introuvable."})

        return HistoriqueTicket.objects.filter(ticket=ticket).select_related('auteur')


class TicketPrioriteManuelleView(APIView):
    """
    L'Admin modifie manuellement la priorité d'un ticket.
    """
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def patch(self, request, pk):
        try:
            ticket = Ticket.objects.get(pk=pk)
        except Ticket.DoesNotExist:
            return Response({"detail": "Ticket introuvable."}, status=status.HTTP_404_NOT_FOUND)

        serializer = TicketPrioriteManuelleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        nouvelle_priorite = serializer.validated_data['priorite']
        justification = serializer.validated_data['justification']
        ancienne_priorite = ticket.priorite

        if nouvelle_priorite == ancienne_priorite:
            return Response(
                {"detail": "La nouvelle priorité est identique à l'actuelle."},
                status=status.HTTP_400_BAD_REQUEST
            )

        ticket.priorite = nouvelle_priorite
        # Anomalie corrigée : sans ce flag, le prochain ticket.save() (déclenché par
        # n'importe quelle autre action : affectation, changement de statut, etc.)
        # recalculait et écrasait silencieusement la priorité fixée ici par l'Admin.
        ticket.priorite_modifiee_manuellement = True
        ticket.save(update_fields=['priorite', 'priorite_modifiee_manuellement'])

        enregistrer_historique(
            ticket=ticket,
            champ_modifie='PRIORITE',
            ancienne_valeur=ancienne_priorite,
            nouvelle_valeur=nouvelle_priorite,
            auteur=request.user,
            justification=justification,
        )

        return Response(TicketAdminSerializer(ticket).data, status=status.HTTP_200_OK)


class TicketCommentairesView(generics.ListCreateAPIView):
    """
    Commentaires d'un ticket.
    - Client : propriétaire du ticket uniquement, ne voit que les PUBLIC, ne poste qu'en PUBLIC
    - Technicien : uniquement si le ticket lui est affecté, voit tout
    - Admin : accès à tous les tickets, voit tout
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CommentaireCreateSerializer
        return CommentaireSerializer

    def get_serializer_context(self):
        return {'request': self.request}

    def get_ticket(self):
        if not hasattr(self, '_ticket'):
            try:
                ticket = Ticket.objects.get(pk=self.kwargs['ticket_id'])
            except Ticket.DoesNotExist:
                raise NotFound({"detail": "Ticket introuvable."})

            user = self.request.user
            if user.role == 'CLIENT' and ticket.client_id != user.id:
                raise NotFound({"detail": "Ticket introuvable."})
            if user.role == 'TECHNICIEN' and ticket.technicien_id != user.id:
                raise NotFound({"detail": "Ticket introuvable."})

            self._ticket = ticket
        return self._ticket

    def get_queryset(self):
        ticket = self.get_ticket()
        queryset = Commentaire.objects.filter(ticket=ticket).select_related('auteur')
        if self.request.user.role == 'CLIENT':
            queryset = queryset.filter(visibilite='PUBLIC')
        return queryset

    def perform_create(self, serializer):
        # Anomalie corrigée : l'indentation d'origine plaçait la sauvegarde du
        # commentaire ET le calcul des destinataires à l'intérieur du bloc
        # "if role == CLIENT", si bien qu'un commentaire posté par un Technicien
        # ou un Admin n'était jamais enregistré (perform_create ne faisait rien).
        ticket = self.get_ticket()
        visibilite = serializer.validated_data.get('visibilite', 'PUBLIC')
        if self.request.user.role == 'CLIENT':
            visibilite = 'PUBLIC'

        serializer.save(ticket=ticket, auteur=self.request.user, visibilite=visibilite)

        # Notifie l'autre partie (jamais l'auteur lui-même), uniquement pour
        # les commentaires publics (les commentaires internes restent entre
        # techniciens/admin et ne doivent pas notifier le client).
        if visibilite == 'PUBLIC':
            destinataires = set()
            if self.request.user.id != ticket.client_id:
                destinataires.add(ticket.client)
            if ticket.technicien and self.request.user.id != ticket.technicien_id:
                destinataires.add(ticket.technicien)
            for dest in destinataires:
                notifier(dest, f"Nouveau commentaire sur le ticket TCK-{str(ticket.id).zfill(5)}.", f"ticket:{ticket.id}")
class TicketPlanifierView(APIView):
    """
    L'Admin planifie une intervention sur un ticket dont le devis a été accepté.
    """
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def post(self, request, ticket_id):
        try:
            ticket = Ticket.objects.select_related('technicien').get(pk=ticket_id)
        except Ticket.DoesNotExist:
            return Response({"detail": "Ticket introuvable."}, status=status.HTTP_404_NOT_FOUND)

        # 1. Le ticket doit être affecté à un technicien
        if not ticket.technicien:
            return Response(
                {"detail": "Le ticket doit d'abord être affecté à un technicien."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 2. Le ticket ne doit pas être clôturé
        if ticket.statut == 'CLOTURE':
            return Response(
                {"detail": "Impossible de planifier un ticket clôturé."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ✅ 3. NOUVEAU : un devis doit avoir été ACCEPTÉ par le client
        devis_accepte = ticket.devis.filter(statut='ACCEPTE').exists()
        if not devis_accepte:
            return Response(
                {"detail": "Impossible de planifier : le client doit d'abord accepter le devis."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ✅ 4. NOUVEAU : le ticket doit être au statut EN_COURS (après acceptation)
        if ticket.statut != 'EN_COURS':
            return Response(
                {"detail": f"Impossible de planifier : le ticket est au statut '{ticket.statut}'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # === Suite : création de la planification ===
        serializer = PlanificationCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        nouvelle_date = serializer.validated_data['date']
        nouvelle_heure = serializer.validated_data['heure_debut']
        nouvelle_duree = serializer.validated_data['duree_estimee_minutes']

        nouveau_debut = datetime.combine(nouvelle_date, nouvelle_heure)
        nouveau_fin = nouveau_debut + timedelta(minutes=nouvelle_duree)

        # Détection de conflits d'agenda du technicien
        conflits = Planification.objects.filter(
            technicien=ticket.technicien, date=nouvelle_date, statut='PLANIFIEE'
        ).exclude(ticket=ticket)

        for p in conflits:
            existant_debut = datetime.combine(p.date, p.heure_debut)
            existant_fin = existant_debut + timedelta(minutes=p.duree_estimee_minutes)
            if nouveau_debut < existant_fin and nouveau_fin > existant_debut:
                return Response(
                    {"detail": f"Conflit d'horaire : le technicien a déjà une intervention le {p.date} de {p.heure_debut} à {existant_fin.time()} (Ticket #{p.ticket_id})."},
                    status=status.HTTP_409_CONFLICT
                )

        # Annule les planifications actives précédentes du même ticket
        Planification.objects.filter(ticket=ticket, statut='PLANIFIEE').update(statut='ANNULEE')

        planification = serializer.save(ticket=ticket, technicien=ticket.technicien, statut='PLANIFIEE')

        enregistrer_historique(
            ticket, 'PLANIFICATION', '', f"{nouvelle_date} à {nouvelle_heure}", request.user
        )

        notifier(
            ticket.client,
            f"Une intervention a été planifiée pour votre ticket TCK-{str(ticket.id).zfill(5)} le {nouvelle_date} à {nouvelle_heure}.",
            f"ticket:{ticket.id}"
        )
        notifier(
            ticket.technicien,
            f"Intervention planifiée le {nouvelle_date} à {nouvelle_heure} pour le ticket TCK-{str(ticket.id).zfill(5)}.",
            f"ticket:{ticket.id}"
        )
        return Response(PlanificationSerializer(planification).data, status=status.HTTP_201_CREATED)

class TicketPlanificationView(generics.RetrieveAPIView):
    """Consulte la planification active d'un ticket."""
    serializer_class = PlanificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        try:
            ticket = Ticket.objects.get(pk=self.kwargs['ticket_id'])
        except Ticket.DoesNotExist:
            raise NotFound({"detail": "Ticket introuvable."})

        user = self.request.user
        if user.role == 'CLIENT' and ticket.client_id != user.id:
            raise NotFound({"detail": "Ticket introuvable."})
        if user.role == 'TECHNICIEN' and ticket.technicien_id != user.id:
            raise NotFound({"detail": "Ticket introuvable."})

        planification = ticket.planifications.filter(statut='PLANIFIEE').order_by('-date_creation').first()
        if planification is None:
            raise NotFound({"detail": "Aucune planification active pour ce ticket."})
        return planification


class PlanificationAnnulerView(APIView):
    """L'Admin annule une planification existante."""
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def patch(self, request, planification_id):
        try:
            planification = Planification.objects.select_related('ticket').get(pk=planification_id)
        except Planification.DoesNotExist:
            return Response({"detail": "Planification introuvable."}, status=status.HTTP_404_NOT_FOUND)

        if planification.statut == 'ANNULEE':
            return Response({"detail": "Cette planification est déjà annulée."}, status=status.HTTP_400_BAD_REQUEST)

        planification.statut = 'ANNULEE'
        planification.save(update_fields=['statut'])

        enregistrer_historique(
            planification.ticket, 'PLANIFICATION',
            f"{planification.date} à {planification.heure_debut}", 'Annulée', request.user
        )

        return Response(PlanificationSerializer(planification).data, status=status.HTTP_200_OK)


class InterventionDiagnosticDetailView(APIView):
    """
    Le Technicien enrichit le diagnostic pendant que l'intervention est EN_COURS.
    """
    permission_classes = [permissions.IsAuthenticated, IsTechnicien]

    def patch(self, request, intervention_id):
        try:
            intervention = Intervention.objects.get(pk=intervention_id)
        except Intervention.DoesNotExist:
            return Response({"detail": "Intervention introuvable."}, status=status.HTTP_404_NOT_FOUND)

        if intervention.technicien_id != request.user.id:
            return Response(
                {"detail": "Cette intervention ne vous appartient pas."},
                status=status.HTTP_403_FORBIDDEN
            )

        if intervention.statut != 'EN_COURS':
            return Response(
                {"detail": f"Impossible de modifier le diagnostic : l'intervention est au statut '{intervention.statut}'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = InterventionDiagnosticDetailSerializer(intervention, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(InterventionSerializer(intervention).data, status=status.HTTP_200_OK)


# ==== NOUVEAU : Lot 8 ====
class InterventionRapportPDFView(APIView):
    """
    Génère et retourne le rapport d'intervention en PDF téléchargeable.
    Accessible au Client (propriétaire du ticket), au Technicien (auteur) et à l'Admin.
    Nécessite que le rapport ait déjà été généré (intervention TERMINEE ou VALIDEE).
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, intervention_id):
        try:
            intervention = Intervention.objects.select_related(
                'ticket__client', 'technicien', 'rapport'
            ).prefetch_related('pieces_utilisees').get(pk=intervention_id)
        except Intervention.DoesNotExist:
            return Response({"detail": "Intervention introuvable."}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        est_autorise = (
            (user.role == 'CLIENT' and intervention.ticket.client_id == user.id) or
            (user.role == 'TECHNICIEN' and intervention.technicien_id == user.id) or
            user.role == 'ADMIN'
        )
        if not est_autorise:
            return Response({"detail": "Accès refusé à ce rapport."}, status=status.HTTP_403_FORBIDDEN)

        if not hasattr(intervention, 'rapport'):
            return Response(
                {"detail": "Le rapport n'a pas encore été généré (intervention pas encore terminée)."},
                status=status.HTTP_400_BAD_REQUEST
            )

        inclure_prix = request.query_params.get('inclure_prix', 'true').lower() != 'false'

        response = HttpResponse(content_type='application/pdf')
        nom_fichier = f"rapport_intervention_{intervention.id}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{nom_fichier}"'

        self._generer_pdf(response, intervention, inclure_prix)
        return response

    def _generer_pdf(self, response, intervention, inclure_prix):
        largeur, hauteur = A4
        marge = 20 * mm
        c = canvas.Canvas(response, pagesize=A4)
        y = hauteur - marge

        brand = HexColor('#7A1F2B')
        gris = HexColor('#64748B')

        # En-tête
        c.setFillColor(brand)
        c.rect(marge, y - 5 * mm, 8 * mm, 8 * mm, fill=1, stroke=0)
        c.setFillColor(HexColor('#FFFFFF'))
        c.setFont('Helvetica-Bold', 10)
        c.drawCentredString(marge + 4 * mm, y - 2.5 * mm, 'ST')

        c.setFillColor(HexColor('#0F172A'))
        c.setFont('Helvetica-Bold', 14)
        c.drawString(marge + 12 * mm, y, "SMART TICKET — Rapport d'intervention")
        y -= 6 * mm
        c.setFont('Helvetica', 9)
        c.setFillColor(gris)
        c.drawString(marge + 12 * mm, y, f"TCK-{str(intervention.ticket_id).zfill(5)} — Intervention #{intervention.id}")
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

        def ligne(texte, taille=9):
            nonlocal y
            c.setFont('Helvetica', taille)
            c.setFillColor(HexColor('#334155'))
            for sous_ligne in self._decouper_texte(texte, 95):
                if y < marge:
                    c.showPage()
                    y = hauteur - marge
                c.drawString(marge, y, sous_ligne)
                y -= 5 * mm
            y -= 2 * mm

        client = intervention.ticket.client
        technicien = intervention.technicien

        section("Informations générales")
        ligne(f"Client : {client.get_full_name() or client.username}")
        ligne(f"Technicien : {technicien.get_full_name() or technicien.username}")
        ligne(f"Date d'intervention : {intervention.date}")
        if intervention.temps_passe_minutes:
            ligne(f"Temps passé : {intervention.temps_passe_minutes} min")

        section("Problème signalé")
        ligne(intervention.ticket.description)

        section("Diagnostic")
        ligne(intervention.diagnostic)
        if intervention.symptomes_constates:
            ligne(f"Symptômes constatés : {intervention.symptomes_constates}")
        if intervention.tests_effectues:
            ligne(f"Tests effectués : {intervention.tests_effectues}")
        cause = intervention.cause_confirmee or intervention.cause_probable
        if cause:
            ligne(f"Cause : {cause}")
        if intervention.resultat_intervention:
            section("Résultat de l'intervention")
            ligne(intervention.resultat_intervention)

        pieces = intervention.pieces_utilisees.all()
        if pieces:
            section("Pièces utilisées")
            cout_total = 0
            for p in pieces:
                texte = f"- {p.nom} x{p.quantite}"
                if inclure_prix:
                    texte += f" — {p.prix_unitaire} Ar (sous-total {p.cout_total} Ar)"
                    cout_total += p.cout_total
                ligne(texte)
            if inclure_prix:
                ligne(f"Coût total des pièces : {cout_total} Ar", taille=10)

        y -= 5 * mm
        c.setStrokeColor(HexColor('#E2E8F0'))
        c.line(marge, y, largeur - marge, y)
        y -= 10 * mm

        c.setFont('Helvetica', 8)
        c.setFillColor(gris)
        c.drawString(marge, y, "Signature technicien : ______________________")
        c.drawString(largeur / 2, y, "Signature client : ______________________")

        c.showPage()
        c.save()

    @staticmethod
    def _decouper_texte(texte, longueur_max):
        mots = texte.split()
        lignes, ligne_actuelle = [], ''
        for mot in mots:
            if len(ligne_actuelle) + len(mot) + 1 <= longueur_max:
                ligne_actuelle = f"{ligne_actuelle} {mot}".strip()
            else:
                lignes.append(ligne_actuelle)
                ligne_actuelle = mot
        if ligne_actuelle:
            lignes.append(ligne_actuelle)
        return lignes or ['']


def notifier(utilisateur, message, lien=''):
    """Petit helper pour créer une notification, appelé depuis les vues."""
    if utilisateur is None:
        return
    Notification.objects.create(utilisateur=utilisateur, message=message, lien=lien)
STATUTS_TICKET_OUVERTS = ['NOUVEAU', 'A_QUALIFIER', 'AFFECTE', 'PLANIFIE', 'EN_COURS', 'EN_ATTENTE']


def _remettre_equipement_en_service(ticket):
    """
    À la clôture d'un ticket lié à un équipement EN_PANNE, remet l'équipement à ACTIF,
    sauf si un autre ticket ouvert concerne encore cet équipement.
    """
    equipement = ticket.equipement_ref
    if equipement is None or equipement.statut != 'EN_PANNE':
        return
    autre_ticket_ouvert = Ticket.objects.filter(
        equipement_ref=equipement, statut__in=STATUTS_TICKET_OUVERTS
    ).exclude(pk=ticket.pk).exists()
    if autre_ticket_ouvert:
        return
    equipement.statut = 'ACTIF'
    equipement.save(update_fields=['statut'])
    _notifier_admins(
        f"L'équipement « {equipement.model} » est repassé à ACTIF suite à la clôture du ticket "
        f"TCK-{str(ticket.id).zfill(5)}.",
        f"ticket:{ticket.id}"
    )


# ==== NOUVEAU : Lot 9 ====
class NotificationListView(generics.ListAPIView):
    """Notifications de l'utilisateur connecté, les plus récentes en premier."""
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(utilisateur=self.request.user)


class NotificationMarquerLueView(APIView):
    """Marque une notification comme lue (l'utilisateur ne peut marquer que les siennes)."""
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, notification_id):
        try:
            notification = Notification.objects.get(pk=notification_id, utilisateur=request.user)
        except Notification.DoesNotExist:
            return Response({"detail": "Notification introuvable."}, status=status.HTTP_404_NOT_FOUND)

        notification.lu = True
        notification.save(update_fields=['lu'])
        return Response(NotificationSerializer(notification).data, status=status.HTTP_200_OK)


class NotificationsToutMarquerLuesView(APIView):
    """Marque toutes les notifications de l'utilisateur connecté comme lues."""
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request):
        nb_mises_a_jour = Notification.objects.filter(utilisateur=request.user, lu=False).update(lu=True)
        return Response({"detail": f"{nb_mises_a_jour} notification(s) marquée(s) comme lue(s)."}, status=status.HTTP_200_OK)


class PieceCatalogueListView(generics.ListAPIView):
    """Catalogue des pièces disponibles (stock > 0) pour les techniciens."""
    serializer_class = PieceSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['designation', 'reference']

    def get_queryset(self):
        return Piece.objects.filter(stock_actuel__gt=0).order_by('designation')


# ==== NOUVEAU : suppression de commentaire ====
class CommentaireDeleteView(generics.DestroyAPIView):
    """
    Supprime un commentaire d'un ticket.
    - L'auteur peut supprimer son propre commentaire
    - L'Admin peut supprimer n'importe quel commentaire (modération)
    """
    permission_classes = [permissions.IsAuthenticated]
    queryset = Commentaire.objects.all()

    def get_object(self):
        try:
            commentaire = Commentaire.objects.select_related('ticket').get(pk=self.kwargs['pk'])
        except Commentaire.DoesNotExist:
            raise NotFound({"detail": "Commentaire introuvable."})

        user = self.request.user
        if user.role != 'ADMIN' and commentaire.auteur_id != user.id:
            raise PermissionDenied("Vous ne pouvez supprimer que vos propres commentaires.")

        return commentaire


# ==== NOUVEAU : Lot 10 - Diagnostic -> Devis -> Acceptation client ====
#
# Cycle du ticket (statuts existants réutilisés, aucune migration sur Ticket) :
#   NOUVEAU --(Admin affecte)--> AFFECTE
#   AFFECTE (diagnostic + pièces demandées) --(Technicien soumet)--> A_QUALIFIER
#   A_QUALIFIER --(Admin envoie le devis)--> EN_ATTENTE
#   EN_ATTENTE --(Client accepte)--> EN_COURS   |  --(Client refuse)--> A_QUALIFIER (devis révisé)
#   EN_COURS --(Technicien termine, Client valide)--> CLOTURE   (inchangé)

def _notifier_admins(message, lien=''):
    for admin in Utilisateur.objects.filter(role='ADMIN'):
        notifier(admin, message, lien)


def _remplacer_lignes(devis, lignes_data):
    devis.lignes.all().delete()
    LigneDevis.objects.bulk_create([
        LigneDevis(
            devis=devis,
            piece=l.get('piece'),
            designation=l['designation'],
            quantite=l['quantite'],
            prix_unitaire=l['prix_unitaire'],
        )
        for l in lignes_data
    ])


class PieceDemandeeListCreateView(generics.ListCreateAPIView):
    """
    Le Technicien liste / ajoute les pièces NÉCESSAIRES (sans prix) pendant le diagnostic.
    Ne touche pas au stock.
    """
    permission_classes = [permissions.IsAuthenticated, IsTechnicien]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PieceDemandeeCreateSerializer
        return PieceDemandeeSerializer

    def get_intervention(self):
        if not hasattr(self, '_intervention'):
            try:
                intervention = Intervention.objects.select_related('ticket').get(pk=self.kwargs['intervention_id'])
            except Intervention.DoesNotExist:
                raise NotFound({"detail": "Intervention introuvable."})

            if intervention.technicien_id != self.request.user.id:
                raise PermissionDenied("Cette intervention ne vous appartient pas.")

            self._intervention = intervention
        return self._intervention

    def get_queryset(self):
        return PieceDemandee.objects.filter(intervention=self.get_intervention())

    def perform_create(self, serializer):
        intervention = self.get_intervention()
        if intervention.statut != 'EN_COURS' or intervention.ticket.statut != 'AFFECTE':
            raise ValidationError(
                {"detail": "Les pièces demandées se saisissent pendant le diagnostic, avant sa soumission."}
            )
        serializer.save(intervention=intervention)


class PieceDemandeeDeleteView(generics.DestroyAPIView):
    """Le Technicien retire une pièce demandée tant que le diagnostic n'est pas soumis."""
    permission_classes = [permissions.IsAuthenticated, IsTechnicien]

    def get_queryset(self):
        return PieceDemandee.objects.select_related('intervention__ticket').filter(
            intervention__technicien=self.request.user
        )

    def perform_destroy(self, instance):
        if instance.intervention.ticket.statut != 'AFFECTE':
            raise ValidationError({"detail": "Le diagnostic a déjà été soumis, la liste est figée."})
        instance.delete()


class SoumettreDiagnosticView(APIView):
    """
    Le Technicien soumet son diagnostic (+ pièces demandées) : le ticket passe
    AFFECTE -> A_QUALIFIER et l'Admin est notifié pour établir le devis.
    """
    permission_classes = [permissions.IsAuthenticated, IsTechnicien]

    def patch(self, request, intervention_id):
        try:
            intervention = Intervention.objects.select_related('ticket').get(pk=intervention_id)
        except Intervention.DoesNotExist:
            return Response({"detail": "Intervention introuvable."}, status=status.HTTP_404_NOT_FOUND)

        if intervention.technicien_id != request.user.id:
            return Response({"detail": "Cette intervention ne vous appartient pas."}, status=status.HTTP_403_FORBIDDEN)

        ticket = intervention.ticket
        if intervention.statut != 'EN_COURS' or ticket.statut != 'AFFECTE':
            return Response(
                {"detail": f"Impossible de soumettre le diagnostic : le ticket est au statut '{ticket.statut}'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        ancien_statut = ticket.statut
        ticket.statut = 'A_QUALIFIER'
        ticket.save(update_fields=['statut'])
        enregistrer_historique(ticket, 'STATUT', ancien_statut, 'A_QUALIFIER', request.user, "Diagnostic soumis, devis à établir")
        _notifier_admins(
            f"Diagnostic soumis sur le ticket TCK-{str(ticket.id).zfill(5)} : devis à établir.",
            f"ticket:{ticket.id}"
        )
        return Response(TicketTechnicienSerializer(ticket).data, status=status.HTTP_200_OK)


class DevisCreateView(APIView):
    """
    L'Admin établit un devis (brouillon) sur un ticket dont le diagnostic est soumis.
    Sans 'lignes' dans le body : pré-rempli depuis le devis précédent (révision) ou
    depuis les pièces demandées (prix du catalogue, 0 si pièce libre).
    """
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def post(self, request, pk):
        try:
            ticket = Ticket.objects.get(pk=pk)
        except Ticket.DoesNotExist:
            return Response({"detail": "Ticket introuvable."}, status=status.HTTP_404_NOT_FOUND)

        if ticket.statut != 'A_QUALIFIER':
            return Response(
                {"detail": f"Impossible d'établir un devis : le ticket est au statut '{ticket.statut}' (le diagnostic doit être soumis)."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if ticket.devis.filter(statut='BROUILLON').exists():
            return Response(
                {"detail": "Un brouillon de devis existe déjà : modifiez-le ou envoyez-le."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = DevisEcritureSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        precedent = ticket.devis.order_by('-revision').first()
        intervention = ticket.interventions.order_by('-id').first()

        with transaction.atomic():
            devis = Devis.objects.create(
                ticket=ticket,
                revision=(precedent.revision + 1) if precedent else 1,
                statut='BROUILLON',
                montant_main_oeuvre=data.get('montant_main_oeuvre', precedent.montant_main_oeuvre if precedent else 0),
                remise=data.get('remise', precedent.remise if precedent else 0),
                commentaire=data.get('commentaire', ''),
                cree_par=request.user,
            )

            if 'lignes' in data:
                _remplacer_lignes(devis, data['lignes'])
            elif precedent:
                for l in precedent.lignes.all():
                    LigneDevis.objects.create(
                        devis=devis, piece_id=l.piece_id, designation=l.designation,
                        quantite=l.quantite, prix_unitaire=l.prix_unitaire,
                    )
            elif intervention:
                for p in intervention.pieces_demandees.select_related('piece'):
                    LigneDevis.objects.create(
                        devis=devis, piece=p.piece, designation=p.nom, quantite=p.quantite,
                        prix_unitaire=p.piece.prix_unitaire if p.piece else 0,
                    )

        return Response(DevisSerializer(devis).data, status=status.HTTP_201_CREATED)


class DevisModifierView(APIView):
    """L'Admin ajuste un devis tant qu'il est BROUILLON (main d'oeuvre, remise, lignes)."""
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def patch(self, request, devis_id):
        try:
            devis = Devis.objects.get(pk=devis_id)
        except Devis.DoesNotExist:
            return Response({"detail": "Devis introuvable."}, status=status.HTTP_404_NOT_FOUND)

        if devis.statut != 'BROUILLON':
            return Response(
                {"detail": f"Impossible de modifier : le devis est au statut '{devis.statut}'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = DevisEcritureSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        with transaction.atomic():
            for champ in ('montant_main_oeuvre', 'remise', 'commentaire'):
                if champ in data:
                    setattr(devis, champ, data[champ])
            devis.save()
            if 'lignes' in data:
                _remplacer_lignes(devis, data['lignes'])

        return Response(DevisSerializer(devis).data, status=status.HTTP_200_OK)


class DevisEnvoyerView(APIView):
    """L'Admin envoie le devis au Client : ticket A_QUALIFIER -> EN_ATTENTE."""
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def patch(self, request, devis_id):
        try:
            devis = Devis.objects.select_related('ticket__client').get(pk=devis_id)
        except Devis.DoesNotExist:
            return Response({"detail": "Devis introuvable."}, status=status.HTTP_404_NOT_FOUND)

        ticket = devis.ticket
        if devis.statut != 'BROUILLON':
            return Response(
                {"detail": f"Impossible d'envoyer : le devis est au statut '{devis.statut}'."},
                status=status.HTTP_400_BAD_REQUEST
            )
        if ticket.statut != 'A_QUALIFIER':
            return Response(
                {"detail": f"Impossible d'envoyer : le ticket est au statut '{ticket.statut}'."},
                status=status.HTTP_400_BAD_REQUEST
            )
        if devis.montant_total <= 0:
            return Response(
                {"detail": "Le devis est vide : ajoutez des lignes ou de la main d'oeuvre avant de l'envoyer."},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            devis.statut = 'ENVOYE'
            devis.date_envoi = timezone.now()
            devis.save(update_fields=['statut', 'date_envoi'])

            ancien_statut = ticket.statut
            ticket.statut = 'EN_ATTENTE'
            ticket.save(update_fields=['statut'])
            enregistrer_historique(
                ticket, 'STATUT', ancien_statut, 'EN_ATTENTE', request.user,
                f"Devis rév. {devis.revision} envoyé : {devis.montant_total} Ar"
            )

        notifier(
            ticket.client,
            f"Un devis de {devis.montant_total} Ar est disponible pour votre ticket TCK-{str(ticket.id).zfill(5)}. Merci de l'accepter ou de le refuser.",
            f"ticket:{ticket.id}"
        )
        return Response(DevisSerializer(devis).data, status=status.HTTP_200_OK)


class DevisAccepterView(APIView):
    """Le Client accepte le devis : ticket EN_ATTENTE -> EN_COURS (l'intervention peut démarrer)."""
    permission_classes = [permissions.IsAuthenticated, IsClient]

    def patch(self, request, devis_id):
        try:
            devis = Devis.objects.select_related('ticket').get(pk=devis_id)
        except Devis.DoesNotExist:
            return Response({"detail": "Devis introuvable."}, status=status.HTTP_404_NOT_FOUND)

        ticket = devis.ticket
        if ticket.client_id != request.user.id:
            return Response({"detail": "Ce devis ne concerne pas un de vos tickets."}, status=status.HTTP_403_FORBIDDEN)

        if devis.statut != 'ENVOYE' or ticket.statut != 'EN_ATTENTE':
            return Response(
                {"detail": f"Impossible d'accepter : le devis est au statut '{devis.statut}'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            devis.statut = 'ACCEPTE'
            devis.date_reponse = timezone.now()
            devis.save(update_fields=['statut', 'date_reponse'])

            ancien_statut = ticket.statut
            ticket.statut = 'EN_COURS'
            ticket.save(update_fields=['statut'])
            enregistrer_historique(
                ticket, 'STATUT', ancien_statut, 'EN_COURS', request.user,
                f"Devis rév. {devis.revision} accepté : {devis.montant_total} Ar"
            )

        ref = f"TCK-{str(ticket.id).zfill(5)}"
        notifier(ticket.technicien, f"Le client a accepté le devis du ticket {ref} : vous pouvez intervenir.", f"ticket:{ticket.id}")
        _notifier_admins(f"Devis accepté par le client sur le ticket {ref}.", f"ticket:{ticket.id}")
        return Response({
            "devis": DevisSerializer(devis).data,
            "ticket": TicketSerializer(ticket).data,
        }, status=status.HTTP_200_OK)


class DevisRefuserView(APIView):
    """
    Le Client refuse le devis (motif obligatoire) : ticket EN_ATTENTE -> A_QUALIFIER.
    L'Admin peut alors établir un devis révisé.
    """
    permission_classes = [permissions.IsAuthenticated, IsClient]

    def patch(self, request, devis_id):
        try:
            devis = Devis.objects.select_related('ticket').get(pk=devis_id)
        except Devis.DoesNotExist:
            return Response({"detail": "Devis introuvable."}, status=status.HTTP_404_NOT_FOUND)

        ticket = devis.ticket
        if ticket.client_id != request.user.id:
            return Response({"detail": "Ce devis ne concerne pas un de vos tickets."}, status=status.HTTP_403_FORBIDDEN)

        if devis.statut != 'ENVOYE' or ticket.statut != 'EN_ATTENTE':
            return Response(
                {"detail": f"Impossible de refuser : le devis est au statut '{devis.statut}'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        body = DevisRefusSerializer(data=request.data)
        body.is_valid(raise_exception=True)
        motif = body.validated_data['motif']

        with transaction.atomic():
            devis.statut = 'REFUSE'
            devis.motif_refus = motif
            devis.date_reponse = timezone.now()
            devis.save(update_fields=['statut', 'motif_refus', 'date_reponse'])

            ancien_statut = ticket.statut
            ticket.statut = 'A_QUALIFIER'
            ticket.save(update_fields=['statut'])
            enregistrer_historique(
                ticket, 'STATUT', ancien_statut, 'A_QUALIFIER', request.user,
                f"Devis rév. {devis.revision} refusé : {motif}"
            )

        _notifier_admins(
            f"Le client a refusé le devis du ticket TCK-{str(ticket.id).zfill(5)} : un devis révisé est attendu.",
            f"ticket:{ticket.id}"
        )
        return Response(DevisSerializer(devis).data, status=status.HTTP_200_OK)


class TicketDevisListView(APIView):
    """
    Liste les devis d'un ticket.
    - Admin : tous (brouillons inclus)
    - Client propriétaire : seulement les devis envoyés / acceptés / refusés
    - Technicien : aucun accès (il ne voit pas les prix)
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, ticket_id):
        try:
            ticket = Ticket.objects.get(pk=ticket_id)
        except Ticket.DoesNotExist:
            return Response({"detail": "Ticket introuvable."}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        queryset = ticket.devis.prefetch_related('lignes').select_related('cree_par')

        if user.role == 'ADMIN':
            pass
        elif user.role == 'CLIENT' and ticket.client_id == user.id:
            queryset = queryset.exclude(statut='BROUILLON')
        else:
            return Response({"detail": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)

        return Response(DevisSerializer(queryset, many=True).data, status=status.HTTP_200_OK)