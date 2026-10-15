import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_BY_ROLE: Record<string, { label: string; to: string }[]> = {
  CLIENT: [{ label: 'Mes tickets', to: '/client/tickets' }],
  ADMIN: [{ label: 'Tous les tickets', to: '/admin/tickets' }],
  TECHNICIEN: [{ label: 'Mes affectations', to: '/technicien/tickets' }],
};

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const links = user ? NAV_BY_ROLE[user.role] ?? [] : [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-semibold text-lg">NjCam</span>
          <nav className="flex gap-4">
            {links.map((link) => (
              <Link key={link.to} to={link.to} className="text-gray-600 hover:text-gray-900">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            {user?.first_name || user?.username} ({user?.role})
          </span>
          <button onClick={handleLogout} className="text-sm text-red-600 hover:text-red-800">
            Déconnexion
          </button>
        </div>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}