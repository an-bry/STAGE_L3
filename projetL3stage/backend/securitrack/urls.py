from django.urls import path

from .views import (
    AlertesEnvoyerView,
    AlertesView,
    ContratDetailView,
    ContratListCreateView,
    EquipementDetailView,
    EquipementHistoriqueView,
    EquipementListCreateView,
    LierTicketEquipementView,
    MaintenanceDemarrerView,
    MaintenanceDetailView,
    MaintenanceListCreateView,
    MaintenanceTerminerView,
    MesContratsView,
    MesEquipementsView,
    MesMaintenancesView,
    MesSitesView,
    SiteDetailView,
    SiteListCreateView,
    TableauDeBordView,
    TicketCouvertureView,
    UtilisateurDetailView,
    UtilisateurLiensView,
    UtilisateurListCreateView,
    UtilisateurMotDePasseView,
)

urlpatterns = [
    # Utilisateurs
    path('utilisateurs/', UtilisateurListCreateView.as_view(), name='utilisateurs'),
    path('utilisateurs/<int:pk>/', UtilisateurDetailView.as_view(), name='utilisateur_detail'),
    path('utilisateurs/<int:pk>/liens/', UtilisateurLiensView.as_view(), name='utilisateur_liens'),
    path('utilisateurs/<int:pk>/mot-de-passe/', UtilisateurMotDePasseView.as_view(), name='utilisateur_mdp'),

    # Contrats
    path('contrats/', ContratListCreateView.as_view(), name='contrats'),
    path('contrats/<int:pk>/', ContratDetailView.as_view(), name='contrat_detail'),
    path('mes-contrats/', MesContratsView.as_view(), name='mes_contrats'),

    # Équipements
    path('equipements/', EquipementListCreateView.as_view(), name='equipements'),
    path('equipements/<int:pk>/', EquipementDetailView.as_view(), name='equipement_detail'),
    path('equipements/<int:pk>/historique/', EquipementHistoriqueView.as_view(), name='equipement_historique'),
    path('mes-equipements/', MesEquipementsView.as_view(), name='mes_equipements'),

    # Maintenance préventive
    path('maintenances/', MaintenanceListCreateView.as_view(), name='maintenances'),
    path('maintenances/<int:pk>/', MaintenanceDetailView.as_view(), name='maintenance_detail'),
    path('maintenances/<int:pk>/demarrer/', MaintenanceDemarrerView.as_view(), name='maintenance_demarrer'),
    path('maintenances/<int:pk>/terminer/', MaintenanceTerminerView.as_view(), name='maintenance_terminer'),
    path('mes-maintenances/', MesMaintenancesView.as_view(), name='mes_maintenances'),

    # Sites
    path('sites/', SiteListCreateView.as_view(), name='sites'),
    path('sites/<int:pk>/', SiteDetailView.as_view(), name='site_detail'),
    path('mes-sites/', MesSitesView.as_view(), name='mes_sites'),

    # Alertes et tableau de bord
    path('alertes/', AlertesView.as_view(), name='alertes'),
    path('alertes/envoyer/', AlertesEnvoyerView.as_view(), name='alertes_envoyer'),
    path('tableau-de-bord/', TableauDeBordView.as_view(), name='tableau_de_bord'),

    # Liaison avec Smart Ticket
    path('tickets/<int:pk>/equipement/', LierTicketEquipementView.as_view(), name='ticket_equipement'),
    path('tickets/<int:pk>/couverture/', TicketCouvertureView.as_view(), name='ticket_couverture'),
]