import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Camera, Ticket, Shield, ArrowRight, Inbox, Wrench, 
  CalendarClock, AlertTriangle, Sparkles, Clock, 
  FileText, CheckCircle2, ShieldAlert, Users 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AppShell from '../components/layout/AppShell';
import KpiCard from '../components/ui/KpiCard';
import Card from '../components/ui/Card';
import TourGuide, { type TourStep } from '../components/ui/TourGuide';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    if (!user) return;
    const hasSeenTour = localStorage.getItem('njcam_dashboard_tour_seen');
    if (!hasSeenTour) {
      setTimeout(() => setShowTour(true), 500);
    }
  }, [user]);

  const handleCloseTour = () => {
    setShowTour(false);
    localStorage.setItem('njcam_dashboard_tour_seen', 'true');
    // ⚡ ON PREVIENT LE APPSHELL QUE LE DASHBOARD EST FINI
    window.dispatchEvent(new Event('dashboardTourFinished'));
  };

  if (!user) return null;
  const role = user.role;
  const prenom = user.first_name || user.username || 'vous';

  const tourSteps: TourStep[] = [
    { targetId: 'tour-welcome', title: 'Bienvenue sur votre Espace ! 👋', content: 'Ceci est votre tableau de bord personnalisé selon votre rôle.' },
    { targetId: 'tour-kpis', title: 'Vos indicateurs clés', content: 'Ces cartes affichent les chiffres les plus importants pour vous.' },
    { targetId: 'tour-actions', title: 'Actions rapides', content: 'Accédez directement à vos modules principaux en un seul clic.' },
    { targetId: 'tour-activity', title: 'Activité récente', content: 'Suivez ce qui s\'est passé récemment sur votre compte.' }
  ];

  const kpisByRole = {
    CLIENT: [
      { label: 'Mes tickets ouverts', value: 2, icon: <Inbox size={20} />, accent: 'warning' },
      { label: 'Mes installations', value: 1, icon: <Camera size={20} />, accent: 'info' },
      { label: 'Mes contrats actifs', value: 3, icon: <Shield size={20} />, accent: 'success' },
      { label: 'Mes équipements', value: 12, icon: <FileText size={20} />, accent: 'primary' },
    ],
    TECHNICIEN: [
      { label: 'Tickets assignés', value: 5, icon: <Ticket size={20} />, accent: 'warning' },
      { label: 'Interventions du jour', value: 2, icon: <Wrench size={20} />, accent: 'info' },
      { label: 'Maintenances prévues', value: 4, icon: <CalendarClock size={20} />, accent: 'primary' },
      { label: 'Études à traiter', value: 1, icon: <FileText size={20} />, accent: 'success' },
    ],
    ADMIN: [
      { label: 'Tickets non assignés', value: 8, icon: <AlertTriangle size={20} />, accent: 'danger' },
      { label: 'Alertes critiques', value: 3, icon: <ShieldAlert size={20} />, accent: 'warning' },
      { label: 'Techniciens actifs', value: 14, icon: <Users size={20} />, accent: 'info' },
      { label: 'Demandes en attente', value: 6, icon: <Clock size={20} />, accent: 'primary' },
    ]
  };
  const kpis = kpisByRole[role as keyof typeof kpisByRole] || kpisByRole.CLIENT;

  const quickActions = {
    CLIENT: [
      { label: 'Créer un ticket', icon: Ticket, path: '/smart-ticket/client/tickets', color: 'text-orange-600', bg: 'bg-orange-100' },
      { label: 'Demander une installation', icon: Camera, path: '/camtrack/client/offres', color: 'text-blue-600', bg: 'bg-blue-100' },
      { label: 'Voir mes contrats', icon: Shield, path: '/securitrack/client/contrats', color: 'text-green-600', bg: 'bg-green-100' },
    ],
    TECHNICIEN: [
      { label: 'Voir mes tickets', icon: Ticket, path: '/smart-ticket/technicien/tickets', color: 'text-orange-600', bg: 'bg-orange-100' },
      { label: 'Mes études de sites', icon: FileText, path: '/camtrack/technicien/etudes', color: 'text-blue-600', bg: 'bg-blue-100' },
      { label: 'Mes maintenances', icon: Wrench, path: '/securitrack/technicien/maintenances', color: 'text-green-600', bg: 'bg-green-100' },
    ],
    ADMIN: [
      { label: 'Gérer les tickets', icon: Ticket, path: '/smart-ticket/admin/tickets', color: 'text-orange-600', bg: 'bg-orange-100' },
      { label: 'Gérer les demandes', icon: Camera, path: '/camtrack/admin/demandes', color: 'text-blue-600', bg: 'bg-blue-100' },
      { label: 'Tableau de bord SecuriTrack', icon: Shield, path: '/securitrack/admin/dashboard', color: 'text-green-600', bg: 'bg-green-100' },
    ],
  };
  const actions = quickActions[role as keyof typeof quickActions] || quickActions.CLIENT;

  return (
    <AppShell title="Tableau de bord" breadcrumb={['NjCam', 'Accueil']}>
      {showTour && <TourGuide steps={tourSteps} onComplete={handleCloseTour} />}

      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-fadeIn">
        <div id="tour-welcome" className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight">
              Bonjour, {prenom} <span className="inline-block animate-bounce">👋</span>
            </h1>
            <p className="text-ink-soft mt-1">
              {role === 'ADMIN' && "Voici l'état global de la plateforme aujourd'hui."}
              {role === 'TECHNICIEN' && "Voici vos interventions et tâches pour aujourd'hui."}
              {role === 'CLIENT' && "Voici un résumé de vos services et installations."}
            </p>
          </div>
          <div className="text-sm text-ink-faint font-medium bg-surface px-3 py-1.5 rounded-md border border-line self-start md:self-auto">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </div>

        <div id="tour-kpis" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, i) => (
            <KpiCard key={i} label={kpi.label} value={kpi.value} icon={kpi.icon} accent={kpi.accent as any} />
          ))}
        </div>

        <div id="tour-actions" className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {actions.map((action, i) => {
            const Icon = action.icon;
            return (
              <button key={i} onClick={() => navigate(action.path)} className="group flex items-center gap-4 bg-card border border-line rounded-xl p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/30 text-left">
                <div className={`p-3 rounded-lg ${action.bg} ${action.color} group-hover:scale-110 transition-transform`}>
                  <Icon size={20} />
                </div>
                <div className="flex-1"><h3 className="font-semibold text-ink">{action.label}</h3></div>
                <ArrowRight size={18} className="text-ink-faint group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div id="tour-activity" className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-semibold text-ink flex items-center gap-2">
              <Clock size={18} className="text-primary" /> Activité récente
            </h2>
            <Card padding="none" className="overflow-hidden">
               <div className="divide-y divide-line">
                 <div className="flex items-center gap-4 p-4 hover:bg-surface/50 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-warning-soft flex items-center justify-center shrink-0"><Ticket size={18} className="text-warning" /></div>
                    <div className="flex-1 min-w-0"><p className="text-sm font-medium text-ink">Nouveau ticket créé</p><p className="text-xs text-ink-faint mt-0.5">Ticket #1024 - Panne caméra entrée principale</p></div>
                    <span className="text-xs text-ink-faint shrink-0">Il y a 2h</span>
                 </div>
                 <div className="flex items-center gap-4 p-4 hover:bg-surface/50 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-success-soft flex items-center justify-center shrink-0"><CheckCircle2 size={18} className="text-success" /></div>
                    <div className="flex-1 min-w-0"><p className="text-sm font-medium text-ink">Installation terminée</p><p className="text-xs text-ink-faint mt-0.5">Site NjCam Agence Centre</p></div>
                    <span className="text-xs text-ink-faint shrink-0">Hier</span>
                 </div>
               </div>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <h2 className="text-lg font-semibold text-ink flex items-center gap-2 mb-4">
              <Sparkles size={18} className="text-primary" /> Le saviez-vous ?
            </h2>
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-5 h-full flex flex-col justify-center">
              <h3 className="font-semibold text-ink mb-2">
                {role === 'ADMIN' && "Optimisez vos affectations"}
                {role === 'TECHNICIEN' && "Mettez à jour vos statuts"}
                {role === 'CLIENT' && "Suivez vos interventions"}
              </h3>
              <p className="text-sm text-ink-soft leading-relaxed">
                {role === 'ADMIN' && "Utilisez la vue globale des tickets pour assigner les urgences aux techniciens les plus proches."}
                {role === 'TECHNICIEN' && "N'oubliez pas de marquer vos interventions comme 'Terminées' pour que vos clients soient notifiés en temps réel."}
                {role === 'CLIENT' && "Depuis Smart Ticket, vous pouvez suivre en direct l'état d'avancement de la réparation de votre équipement."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}