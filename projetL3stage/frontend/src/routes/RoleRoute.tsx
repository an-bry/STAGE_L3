import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import type { Utilisateur } from '../types/user';

interface RoleRouteProps {
  children: ReactNode;
  allowedRoles: Utilisateur['role'][];
}

export default function RoleRoute({ children, allowedRoles }: RoleRouteProps) {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-8">Chargement...</div>;
  if (!user) return <Navigate to="/login" />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/dashboard" />;

  return <>{children}</>;
}