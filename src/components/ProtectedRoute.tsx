import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { ADMIN_EMAILS } from '../lib/constants';
import { UserRole } from '../types';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  allowedOrgTypes?: ('casual' | 'independent_driver' | 'shipper_company' | 'transport_company')[];
}

export const ProtectedRoute = ({ allowedRoles, allowedOrgTypes }: ProtectedRouteProps) => {
  const { user, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  // Check if a demo session is active in localStorage (bypass auth for demo viewing)
  const isDemoActive = localStorage.getItem('chasqui_demo_active') === 'true';

  if (!user) {
    if (isDemoActive) {
      return <Outlet />;
    }
    return <Navigate to="/login" replace />;
  }

  const isAdmin = ADMIN_EMAILS.includes(user.email.toLowerCase());

  if (isAdmin) {
    return <Outlet />;
  }

  // 1. Check organization type constraints if specified
  if (allowedOrgTypes) {
    const userOrgType = user.organizationType || (user.tipoUsuario === 'comerciante' ? 'casual' : 'independent_driver');
    if (!allowedOrgTypes.includes(userOrgType)) {
      // Correct the route dynamically based on their actual business profile
      if (userOrgType === 'shipper_company') {
        return <Navigate to="/shipper-os" replace />;
      } else if (userOrgType === 'transport_company') {
        return <Navigate to="/fleet-os" replace />;
      } else if (userOrgType === 'independent_driver') {
        return <Navigate to="/carrier/dashboard" replace />;
      } else {
        return <Navigate to="/merchant/dashboard" replace />;
      }
    }
  }

  // 2. Fallback to roles if specified
  if (allowedRoles && !allowedRoles.includes(user.tipoUsuario)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
