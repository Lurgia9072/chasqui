import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from './ui/Button';
import { Truck, LogOut, User, Package, History } from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { NotificationBell } from './NotificationBell';

export const Navbar = () => {
  const { user, setUser } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center space-x-2">
          <Truck className="h-8 w-8 text-blue-600" />
          <span className="text-xl font-bold tracking-tight text-gray-900">
            transporta<span className="text-blue-600">ya</span>
          </span>
        </Link>

        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <Link
                to={user.tipoUsuario === 'comerciante' ? '/merchant/dashboard' : '/carrier/dashboard'}
                className="text-sm font-medium text-gray-600 hover:text-blue-600"
              >
                Dashboard
              </Link>
              <Link
                to="/history"
                className="flex items-center space-x-1 text-sm font-medium text-gray-600 hover:text-blue-600"
              >
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">Historial</span>
              </Link>
              <NotificationBell />
              <div className="flex items-center space-x-2 border-l border-gray-200 pl-4">
                <div className="flex flex-col items-end">
                  <span className="text-xs font-semibold text-gray-900">{user.nombre}</span>
                  <span className="text-[10px] uppercase text-gray-500">{user.tipoUsuario}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 text-gray-500" />
                </Button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">Ingresar</Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Registrarse</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
