import { useState, useEffect, type ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';
import TourGuide, { type TourStep } from '../ui/TourGuide';
import Sidebar from './Sidebar';
import Topbar from './Topbar'; // ⚠️ Vérifie bien la casse du nom de fichier

// --- IMPORTANT : on ajoute la prop 'actions' ---
interface AppShellProps {
  children: ReactNode;
  title: string;
  breadcrumb: string[];
  actions?: ReactNode; // <--- C'est cette ligne qui répare ton bouton "Nouveau ticket"
}

export default function AppShell({ children, title, breadcrumb, actions }: AppShellProps) {
  const {  } = useAuth();
  
  const [showNavTour, setShowNavTour] = useState(false);
  const [showSwitchTour, setShowSwitchTour] = useState(false);

  // --- LOGIQUE DES TUTORIELS ---
  useEffect(() => {
    const handleDashboardFinished = () => {
      const hasSeenNavTour = localStorage.getItem('njcam_navbar_tour_seen');
      if (!hasSeenNavTour) {
        setTimeout(() => setShowNavTour(true), 500);
      }
    };

    window.addEventListener('dashboardTourFinished', handleDashboardFinished);
    return () => window.removeEventListener('dashboardTourFinished', handleDashboardFinished);
  }, []);

  const handleCloseNavTour = () => {
    setShowNavTour(false);
    localStorage.setItem('njcam_navbar_tour_seen', 'true');
    
    const hasSeenSwitchTour = localStorage.getItem('njcam_switch_tour_seen');
    if (!hasSeenSwitchTour) {
      setTimeout(() => setShowSwitchTour(true), 500);
    }
  };

  const handleCloseSwitchTour = () => {
    setShowSwitchTour(false);
    localStorage.setItem('njcam_switch_tour_seen', 'true');
  };

  const navTourSteps: TourStep[] = [
    {
      targetId: 'tour-sidebar-modules',
      title: 'Changer de module',
      content: 'Utilisez ce sélecteur pour passer de CamTrack à Smart Ticket ou SecuriTrack à tout moment.',
    },
    {
      targetId: 'tour-sidebar-nav',
      title: 'Navigation principale',
      content: 'Retrouvez ici tous les menus du module actuel.',
    },
    {
      targetId: 'tour-topbar-notifs',
      title: 'Notifications',
      content: 'Suivez vos alertes en temps réel.',
    },
    {
      targetId: 'tour-topbar-profile',
      title: 'Votre profil',
      content: 'Gérez vos informations ou déconnectez-vous.',
    }
  ];

  const switchTourSteps: TourStep[] = [
    {
      targetId: 'tour-sidebar-modules',
      title: 'Un seul espace, trois modules 🚀',
      content: 'Passez de CamTrack (vidéo) à Smart Ticket (incidents) ou SecuriTrack (maintenance).',
    },
    {
      targetId: 'tour-sidebar-nav',
      title: 'Le menu s\'adapte',
      content: 'Le menu change automatiquement selon le module et votre rôle.',
    }
  ];

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Les tours guidés */}
      {showNavTour && <TourGuide steps={navTourSteps} onComplete={handleCloseNavTour} />}
      {showSwitchTour && <TourGuide steps={switchTourSteps} onComplete={handleCloseSwitchTour} />}

      {/* Sidebar */}
      <Sidebar />
      
      {/* Contenu principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* ⚠️ ICI : on transmet 'actions' à la Topbar */}
        <Topbar title={title} breadcrumb={breadcrumb} actions={actions} />
        
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}