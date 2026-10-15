import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck } from 'lucide-react';
import {
  getNotifications,
  marquerNotificationLue,
  marquerToutesNotificationsLues,
  type Notification,
} from '../../api/notificationService';
import EmptyState from '../ui/EmptyState';
import { useToast } from '../../context/ToastContext';

export default function NotificationBell() {
  const navigate = useNavigate();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const nonLues = notifications.filter((n) => !n.lu).length;

  const charger = () => {
    setLoading(true);
    getNotifications()
      .then(setNotifications)
      .catch(() => {
        // silencieux : pas de notif = pas grave
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    charger();
    // Rafraîchit toutes les 60s
    const interval = setInterval(charger, 60_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleClickNotif = async (notif: Notification) => {
    if (!notif.lu) {
      try {
        await marquerNotificationLue(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, lu: true } : n))
        );
      } catch {
        // silencieux
      }
    }
    // Redirige si un lien est présent : "ticket:42"
    if (notif.lien?.startsWith('ticket:')) {
      const ticketId = notif.lien.split(':')[1];
      const userRole = localStorage.getItem('user_role') || 'CLIENT';
      if (userRole === 'ADMIN') navigate(`/admin/tickets/${ticketId}`);
      else if (userRole === 'TECHNICIEN') navigate(`/technicien/tickets/${ticketId}`);
      else navigate(`/client/tickets/${ticketId}`);
    }
    setOpen(false);
  };

  const handleToutLire = async () => {
    try {
      await marquerToutesNotificationsLues();
      setNotifications((prev) => prev.map((n) => ({ ...n, lu: true })));
      toast.success('Notifications', 'Toutes les notifications sont lues.');
    } catch {
      toast.error('Erreur', 'Impossible de marquer les notifications.');
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-md text-ink-soft hover:bg-surface hover:text-ink transition-colors"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {nonLues > 0 && (
          <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-danger text-white text-[9px] font-semibold flex items-center justify-center">
            {nonLues > 9 ? '9+' : nonLues}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-line rounded-lg shadow-lg z-50 animate-slideUp overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-line">
            <p className="text-sm font-semibold text-ink">Notifications</p>
            {nonLues > 0 && (
              <button
                onClick={handleToutLire}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <CheckCheck size={12} /> Tout lire
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-ink-soft">Chargement…</div>
            ) : notifications.length === 0 ? (
              <EmptyState
                icon={<Bell size={20} />}
                title="Aucune notification"
                description="Vous serez notifié des mises à jour ici."
              />
            ) : (
              <ul className="divide-y divide-line">
                {notifications.slice(0, 20).map((n) => (
                  <li key={n.id}>
                    <button
                      onClick={() => handleClickNotif(n)}
                      className={`w-full text-left px-4 py-3 hover:bg-surface transition-colors flex items-start gap-3 ${
                        !n.lu ? 'bg-primary-soft/30' : ''
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                          !n.lu ? 'bg-primary' : 'bg-transparent'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-ink line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-ink-faint mt-1">
                          {new Date(n.date).toLocaleString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      {!n.lu && <Check size={12} className="text-primary shrink-0 mt-0.5" />}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}