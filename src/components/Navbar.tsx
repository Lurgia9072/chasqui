import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from './ui/Button';
import { History, AlertCircle, Menu, X, LifeBuoy, User, LogOut, Package } from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { NotificationBell } from './NotificationBell';
import { ADMIN_EMAILS } from '../lib/constants';
import { cn } from '../lib/utils';
import { ChasquiLogo } from './ChasquiLogo';

export const Navbar = () => {
  const { user, setUser } = useAuthStore();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const isAdmin = user && ADMIN_EMAILS.includes(user.email.toLowerCase());

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center shrink-0">
          <Link to="/"><ChasquiLogo size="sm" /></Link>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-4">
          {user ? (
            <>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="flex items-center space-x-1 text-sm font-bold text-purple-600 hover:text-purple-700"
                >
                  <AlertCircle className="h-4 w-4" />
                  <span>Admin</span>
                </Link>
              )}
              <Link
                to={user.tipoUsuario === 'admin' ? '/admin' : (user.tipoUsuario === 'comerciante' ? '/merchant/dashboard' : '/carrier/dashboard')}
                className="text-sm font-medium text-gray-600 hover:text-blue-600"
              >
                Dashboard
              </Link>
              <Link
                to="/history"
                className="flex items-center space-x-1 text-sm font-medium text-gray-600 hover:text-blue-600"
              >
                <History className="h-4 w-4" />
                <span>Historial</span>
              </Link>
              <NotificationBell />
              <div className="flex items-center space-x-2 border-l border-gray-200 pl-4">
                <div className="flex flex-col items-end">
                  <Link to="/profile" className="text-xs font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                    {user.nombre}
                  </Link>
                  <span className="text-[10px] uppercase font-bold text-gray-500">
                    {isAdmin ? 'Administrador' : user.tipoUsuario}
                  </span>
                </div>
                <Link to="/profile" className="h-8 w-8 rounded-full bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center hover:border-blue-300 transition-colors">
                  {user.photoUrl ? (
                    <img src={user.photoUrl} alt={user.nombre} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <User className="h-4 w-4 text-gray-500" />
                  )}
                </Link>
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

        {/* Mobile Controls */}
        <div className="flex md:hidden items-center space-x-3">
          {user && <NotificationBell />}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white animate-in slide-in-from-top duration-200 overflow-y-auto max-h-[calc(100vh-4rem)]">
          <div className="space-y-1 p-4 pb-10">
            {user ? (
              <>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-2xl mb-4">
                   <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden shrink-0">
                    {user.photoUrl ? (
                      <img src={user.photoUrl} alt={user.nombre} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{user.nombre}</p>
                    <p className="text-[10px] text-gray-500 uppercase font-black">{isAdmin ? 'Administrador' : user.tipoUsuario}</p>
                  </div>
                </div>

                <Link 
                  to={user.tipoUsuario === 'admin' ? '/admin' : (user.tipoUsuario === 'comerciante' ? '/merchant/dashboard' : '/carrier/dashboard')}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center space-x-3 p-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl font-medium"
                >
                  <Package className="h-5 w-5" />
                  <span>Dashboard</span>
                </Link>

                <Link 
                  to="/history"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center space-x-3 p-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl font-medium"
                >
                   <History className="h-5 w-5" />
                  <span>Historial</span>
                </Link>

                {isAdmin && (
                  <Link 
                    to="/admin"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center space-x-3 p-3 text-purple-600 hover:bg-purple-50 rounded-xl font-bold"
                  >
                    <AlertCircle className="h-5 w-5" />
                    <span>Panel Admin</span>
                  </Link>
                )}

                <Link 
                  to="/profile"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center space-x-3 p-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl font-medium"
                >
                  <User className="h-5 w-5" />
                  <span>Mi Perfil</span>
                </Link>

                <div className="pt-4 mt-4 border-t border-gray-100">
                  <button 
                    onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                    className="flex items-center space-x-3 w-full p-3 text-red-600 hover:bg-red-50 rounded-xl font-bold"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-3 pb-2">
                <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="outline" className="w-full">Ingresar</Button>
                </Link>
                <Link to="/register" onClick={() => setIsMenuOpen(false)}>
                  <Button className="w-full">Registrarse</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
