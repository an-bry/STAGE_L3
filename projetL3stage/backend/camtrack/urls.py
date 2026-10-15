from django.urls import path

from .views import (
    CommentaireDeleteView,
    DemandeCommentairesView,
    DemandeDetailAdminView,
    DemandeInstallationCreateView,
    DemandeRejeterView,
    DevisCreateView,
    DevisRepondreView,
    EquipementCreateView,
    EquipementsGarantieView,
    InstallationClientDetailView,
    InstallationCreateView,
    InstallationDemarrerView,
    InstallationDetailAdminView,
    InstallationPhotosView,
    InstallationsAdminView,
    InstallationTerminerView,
    MesDemandesView,
    MesEtudesView,
    MesInstallationsClientView,
    MesInstallationsView,
    OffreAdminDetailView,
    OffreAdminListCreateView,
    OffreListView,
    RapportInstallationDetailView,
    RapportInstallationPDFView,
    SiteAffecterView,
    SiteEtudeView,
    ToutesLesDemandesView,
    ValiderInstallationView,
)

urlpatterns = [
    # Offres
    path('offres/', OffreListView.as_view(), name='offres_actives'),
    path('offres/admin/', OffreAdminListCreateView.as_view(), name='offres_admin'),
    path('offres/admin/<int:pk>/', OffreAdminDetailView.as_view(), name='offre_admin_detail'),

    # Demandes
    path('demandes/', DemandeInstallationCreateView.as_view(), name='demande_create'),
    path('demandes/mes-demandes/', MesDemandesView.as_view(), name='mes_demandes'),
    path('demandes/admin/', ToutesLesDemandesView.as_view(), name='toutes_les_demandes'),
    path('demandes/admin/<int:pk>/', DemandeDetailAdminView.as_view(), name='demande_detail_admin'),
    path('demandes/admin/<int:pk>/rejeter/', DemandeRejeterView.as_view(), name='demande_rejeter'),
    path('demandes/<int:demande_id>/commentaires/', DemandeCommentairesView.as_view(), name='demande_commentaires'),
    path('commentaires/<int:pk>/', CommentaireDeleteView.as_view(), name='commentaire_delete'),

    # Étude du site (avant le devis)
    path('sites/admin/<int:pk>/affecter/', SiteAffecterView.as_view(), name='site_affecter'),
    path('sites/technicien/mes-etudes/', MesEtudesView.as_view(), name='mes_etudes'),
    path('sites/technicien/<int:pk>/etude/', SiteEtudeView.as_view(), name='site_etude'),

    # Devis
    path('demandes/admin/<int:pk>/devis/', DevisCreateView.as_view(), name='devis_create'),
    path('devis/<int:pk>/repondre/', DevisRepondreView.as_view(), name='devis_repondre'),

    # Installations : Admin
    path('installations/admin/', InstallationsAdminView.as_view(), name='installations_admin'),
    path('installations/admin/creer/', InstallationCreateView.as_view(), name='installation_create'),
    path('installations/admin/<int:pk>/', InstallationDetailAdminView.as_view(), name='installation_detail_admin'),
    path('equipements/admin/garantie/', EquipementsGarantieView.as_view(), name='equipements_garantie'),

    # Installations : Technicien
    path('installations/technicien/mes-installations/', MesInstallationsView.as_view(), name='mes_installations'),
    path('installations/technicien/<int:pk>/demarrer/', InstallationDemarrerView.as_view(), name='installation_demarrer'),
    path('installations/technicien/<int:pk>/terminer/', InstallationTerminerView.as_view(), name='installation_terminer'),
    path('installations/<int:installation_id>/equipements/', EquipementCreateView.as_view(), name='installation_equipements'),
    path('installations/<int:installation_id>/photos/', InstallationPhotosView.as_view(), name='installation_photos'),

    # Installations : Client
    path('installations/client/mes-installations/', MesInstallationsClientView.as_view(), name='mes_installations_client'),
    path('installations/<int:pk>/client/', InstallationClientDetailView.as_view(), name='installation_client_detail'),

    # Rapport d'installation (tous rôles autorisés) + validation par le client
    path('installations/<int:installation_id>/rapport/', RapportInstallationDetailView.as_view(), name='rapport_installation'),
    path('installations/<int:installation_id>/rapport/pdf/', RapportInstallationPDFView.as_view(), name='rapport_installation_pdf'),
    path('installations/<int:installation_id>/valider/', ValiderInstallationView.as_view(), name='valider_installation'),
]