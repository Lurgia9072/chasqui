import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { ADMIN_EMAILS } from '../lib/constants';
import { UserRole } from '../types';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { user, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isAdmin = ADMIN_EMAILS.includes(user.email.toLowerCase());

  if (allowedRoles && !allowedRoles.includes(user.tipoUsuario) && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
