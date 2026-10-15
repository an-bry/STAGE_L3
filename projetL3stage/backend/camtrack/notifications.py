from smart_ticket.models import Notification


def notifier(utilisateur, message, lien=''):
    """
    Crée une notification dans la table partagée 'notification' (smart_ticket).
    Le client la lit avec les endpoints de notifications de Smart Ticket.
    """
    if utilisateur is None:
        return
    Notification.objects.create(utilisateur=utilisateur, message=message, lien=lien)