import { LogOut, User, Settings, CreditCard, ShieldCheck } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from './DropdownMenu';
import { UserAvatar } from './UserAvatar';
import { useAuthStore } from '../../store/useAuthStore';
import { ADMIN_EMAILS } from '../../lib/constants';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

export const UserMenu = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  if (!user) return null;

  const isAdmin = ADMIN_EMAILS.includes(user.email.toLowerCase());

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <div className="flex items-center space-x-3 rounded-full p-1 transition-colors hover:bg-gray-100">
          <UserAvatar name={user.nombre} size="sm" />
          <div className="hidden text-left md:block">
            <p className="text-sm font-bold text-gray-900">{user.nombre}</p>
            <p className="text-xs text-gray-500 capitalize">{user.tipoUsuario}</p>
          </div>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/perfil')}>
          <User className="mr-2 h-4 w-4" />
          <span>Perfil</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/configuracion')}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Configuración</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/pagos')}>
          <CreditCard className="mr-2 h-4 w-4" />
          <span>Pagos</span>
        </DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem onClick={() => navigate('/admin')} className="text-purple-600 focus:bg-purple-50 focus:text-purple-600">
            <ShieldCheck className="mr-2 h-4 w-4" />
            <span>Panel Admin</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:bg-red-50 focus:text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Cerrar Sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
