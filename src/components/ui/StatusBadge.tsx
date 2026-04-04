import { Badge } from './Badge';
import { cn } from '../../lib/utils';

type StatusType = 
  | 'pendiente' | 'verificado' | 'rechazado' 
  | 'disponible' | 'en_negociacion' | 'asignado' | 'completado'
  | 'en_progreso' | 'cancelado'
  | 'en_camino_a_recojo' | 'recojo_completado' | 'en_camino_a_destino';

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
    en_camino_a_recojo: { label: 'Camino al Recojo', variant: 'warning' },
    recojo_completado: { label: 'Carga Recogida', variant: 'success' },
    en_camino_a_destino: { label: 'En Tránsito', variant: 'success' },
  };

  const { label, variant } = config[status] || { label: status, variant: 'default' };

  return (
    <Badge variant={variant} className={cn('capitalize', className)}>
      {label}
    </Badge>
  );
};
