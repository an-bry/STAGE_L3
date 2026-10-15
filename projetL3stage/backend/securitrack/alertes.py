from datetime import date, timedelta

from django.db.models import Exists, OuterRef

from accounts.models import Utilisateur
from camtrack.models import Equipement
from smart_ticket.models import Notification

from .models import Contrat, Maintenance, SEUIL_EXPIRATION_JOURS


def _une_fois(utilisateur, message, lien, dry_run, compteurs, cle):
    """Crée la notification seulement si ce lien n'a pas déjà été notifié à cet utilisateur."""
    if utilisateur is None or not utilisateur.is_active:
        return
    if Notification.objects.filter(utilisateur=utilisateur, lien=lien).exists():
        return
    if not dry_run:
        Notification.objects.create(
            utilisateur=utilisateur, message=message[:255], lien=lien
        )
    compteurs[cle] += 1


def envoyer_alertes(jours=SEUIL_EXPIRATION_JOURS, dry_run=False):
    """
    Envoie les notifications d'échéance. Retourne le nombre de notifications
    créées (ou qui seraient créées en mode dry_run).
    """
    aujourdhui = date.today()
    limite = aujourdhui + timedelta(days=jours)
    compteurs = {
        'contrats_clients': 0,
        'garanties_clients': 0,
        'retards_techniciens': 0,
        'resume_admins': 0,
    }

    # ── Contrats qui expirent bientôt -> client
    contrats = Contrat.objects.filter(
        date_fin__gte=aujourdhui, date_fin__lte=limite
    ).select_related('client')
    for c in contrats:
        restants = (c.date_fin - aujourdhui).days
        _une_fois(
            c.client,
            f"Votre contrat de maintenance #{c.id} expire le {c.date_fin:%d/%m/%Y} "
            f"(dans {restants} jour(s)). Contactez-nous pour le renouveler.",
            f"contrat:{c.id}:fin:{c.date_fin}",
            dry_run, compteurs, 'contrats_clients',
        )

    # ── Garanties qui expirent bientôt -> client
    garanties = Equipement.objects.exclude(statut='HORS_SERVICE').filter(
        date_fin_garantie__gte=aujourdhui, date_fin_garantie__lte=limite
    ).select_related('installation__site__demande__client')
    for e in garanties:
        _une_fois(
            e.installation.site.demande.client,
            f"La garantie de votre équipement « {e.model} » expire le "
            f"{e.date_fin_garantie:%d/%m/%Y}.",
            f"equipement:{e.id}:garantie:{e.date_fin_garantie}",
            dry_run, compteurs, 'garanties_clients',
        )

    # ── Maintenances préventives en retard -> technicien
    retards = Maintenance.objects.filter(
        type_maintenance='PREVENTIVE', statut='PLANIFIEE', date__lt=aujourdhui
    ).select_related('technicien', 'equipement')
    nb_retards = 0
    for m in retards:
        nb_retards += 1
        _une_fois(
            m.technicien,
            f"Maintenance préventive du {m.date:%d/%m/%Y} en retard "
            f"({m.equipement.model}). Merci de la réaliser.",
            f"maintenance:{m.id}:retard",
            dry_run, compteurs, 'retards_techniciens',
        )

    # ── Résumé quotidien -> admins
    contrat_en_cours = Contrat.objects.filter(
        equipements=OuterRef('pk'),
        date_debut__lte=aujourdhui, date_fin__gte=aujourdhui,
    )
    nb_sans_contrat = (
        Equipement.objects.filter(installation__statut='TERMINEE')
        .exclude(statut='HORS_SERVICE')
        .filter(~Exists(contrat_en_cours))
        .count()
    )
    nb_pannes = Equipement.objects.filter(statut='EN_PANNE').count()

    elements = [
        (nb_retards, "maintenance(s) en retard"),
        (nb_pannes, "équipement(s) en panne"),
        (nb_sans_contrat, "équipement(s) sans contrat"),
        (contrats.count(), "contrat(s) qui expirent"),
        (garanties.count(), "garantie(s) qui expirent"),
    ]
    parties = [f"{n} {texte}" for n, texte in elements if n]
    if parties:
        message = f"Alertes du {aujourdhui:%d/%m/%Y} : " + ", ".join(parties) + "."
        for admin in Utilisateur.objects.filter(role='ADMIN', is_active=True):
            _une_fois(admin, message, f"alertes:{aujourdhui}",
                      dry_run, compteurs, 'resume_admins')

    return {'dry_run': dry_run, 'horizon_jours': jours, 'notifications': compteurs}
