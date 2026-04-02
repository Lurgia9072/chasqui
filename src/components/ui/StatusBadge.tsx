import { Badge } from './Badge';
import { cn } from '../../lib/utils';

type StatusType = 
  | 'pendiente' | 'verificado' | 'rechazado' 
  | 'disponible' | 'en_negociacion' | 'asignado' | 'completado'
  | 'en_progreso' | 'cancelado';

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const config: Record<StatusType, { label: string; variant: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'danger' }> = {
    pendiente: { label: 'Pendiente', variant: 'warning' },
    verificado: { label: 'Verificado', variant: 'success' },
    rechazado: { label: 'Rechazado', variant: 'danger' },
    disponible: { label: 'Disponible', variant: 'success' },
    en_negociacion: { label: 'En Negociación', variant: 'warning' },
    asignado: { label: 'Asignado', variant: 'secondary' },
    completado: { label: 'Completado', variant: 'default' },
    en_progreso: { label: 'En Progreso', variant: 'success' },
    cancelado: { label: 'Cancelado', variant: 'danger' },
  };

  const { label, variant } = config[status] || { label: status, variant: 'default' };

  return (
    <Badge variant={variant} className={cn('capitalize', className)}>
      {label}
    </Badge>
  );
};
