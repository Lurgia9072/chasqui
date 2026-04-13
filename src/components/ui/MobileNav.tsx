import { useState } from 'react';
import { Menu, X, Home, Package, Truck, User, LogOut } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';

export const MobileNav = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    setIsOpen(false);
    navigate('/');
  };

  const navItems = user
    ? user.tipoUsuario === 'comerciante'
      ? [
          { icon: Home, label: 'Dashboard', href: '/merchant/dashboard' },
          { icon: Package, label: 'Mis Cargas', href: '/merchant/dashboard' },
          { icon: Truck, label: 'Mis Viajes', href: '/merchant/dashboard' },
          { icon: User, label: 'Mi Perfil', href: '/perfil' },
        ]
      : [
          { icon: Home, label: 'Dashboard', href: '/carrier/dashboard' },
          { icon: Package, label: 'Cargas Disponibles', href: '/carrier/dashboard' },
          { icon: Truck, label: 'Mis Ofertas', href: '/carrier/dashboard' },
          { icon: User, label: 'Mi Perfil', href: '/perfil' },
        ]
    : [
        { icon: Home, label: 'Inicio', href: '/' },
        { icon: User, label: 'Iniciar Sesión', href: '/login' },
      ];

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setIsOpen(true)}
        className="rounded-xl p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
      >
        <Menu className="h-6 w-6" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[200] flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative flex h-full w-3/4 max-w-sm flex-col bg-white p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg">T</div>
                  <span className="text-lg font-extrabold text-blue-600">chasquii</span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex-1 space-y-2">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.href;
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        'flex items-center space-x-3 rounded-xl px-4 py-3 text-sm font-bold transition-all',
                        isActive
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                      )}
                    >
                      <Icon className={cn('h-5 w-5', isActive ? 'text-white' : 'text-gray-400')} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              {user && (
                <div className="mt-auto pt-6 border-t border-gray-100">
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center space-x-3 rounded-xl px-4 py-3 text-sm font-bold text-red-600 transition-all hover:bg-red-50"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
