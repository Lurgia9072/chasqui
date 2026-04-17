import { ShieldCheck, AlertCircle, ShieldQuestion, ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './Button';
import { useNavigate } from 'react-router-dom';
import { VerificationStatus } from '../../types';

interface VerificationBannerProps {
  status: VerificationStatus;
  className?: string;
}

export const VerificationBanner = ({ status, className }: VerificationBannerProps) => {
  const navigate = useNavigate();

  const config = {
    pendiente: {
      icon: <ShieldQuestion className="h-5 w-5" />,
      title: 'Cuenta pendiente de verificación',
      description: 'Tu cuenta está siendo revisada. Pronto podrás empezar a realizar viajes.',
      color: 'bg-yellow-50 text-yellow-900 border-yellow-200',
      iconColor: 'text-yellow-600',
      action: null,
    },
    verificado: {
      icon: <ShieldCheck className="h-5 w-5" />,
      title: 'Cuenta verificada',
      description: '¡Felicidades! Tu cuenta ha sido verificada y puedes operar con normalidad.',
      color: 'bg-green-50 text-green-900 border-green-200',
      iconColor: 'text-green-600',
      action: null,
    },
    rechazado: {
      icon: <AlertCircle className="h-5 w-5" />,
      title: 'Cuenta rechazada',
      description: 'Hubo un problema con tu verificación. Por favor, revisa tus documentos.',
      color: 'bg-red-50 text-red-900 border-red-200',
      iconColor: 'text-red-600',
      action: (
        <Button
          variant="danger"
          size="sm"
          onClick={() => navigate('/verificacion')}
          className="bg-red-600 text-white hover:bg-red-700"
        >
          Revisar documentos
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
  };

  const { icon, title, description, color, iconColor, action } = config[status];

  return (
    <div className={cn('relative w-full rounded-2xl border p-6 flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0', color, className)}>
      <div className="flex items-start space-x-4">
        <div className={cn('rounded-xl bg-white p-3 shadow-sm', iconColor)}>
          {icon}
        </div>
        <div className="space-y-1">
          <h4 className="text-base font-bold">{title}</h4>
          <p className="text-sm opacity-80">{description}</p>
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};
