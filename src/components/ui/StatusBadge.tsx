import { Badge } from './Badge';
import { cn } from '../../lib/utils';
import { TRIP_STATUS_LABELS } from '../../lib/constants';

type StatusType = 
  | 'pendiente' | 'verificado' | 'rechazado' 
  | 'disponible' | 'en_negociacion' | 'asignado' | 'completado'
  | 'en_progreso' | 'cancelado'
  | 'en_camino_a_recojo' | 'recojo_completado' | 'en_camino_a_destino' | 'entregado_pendiente_confirmacion'
  | 'pendiente_pago' | 'pago_en_revision' | 'pago_rechazado';

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
  detail?: string;
}

export const StatusBadge = ({ status, className, detail }: StatusBadgeProps) => {
  const config: Record<StatusType, { label: string; variant: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'danger' }> = {
    pendiente: { label: 'Pendiente', variant: 'warning' },
    verificado: { label: 'Verificado', variant: 'success' },
    rechazado: { label: 'Rechazado', variant: 'danger' },
    disponible: { label: 'Disponible', variant: 'success' },
    en_negociacion: { label: 'En Negociación', variant: 'warning' },
    asignado: { label: 'Asignado', variant: 'secondary' },
    completado: { label: TRIP_STATUS_LABELS.completado.label, variant: 'default' },
    en_progreso: { label: 'En Progreso', variant: 'success' },
    cancelado: { label: TRIP_STATUS_LABELS.cancelado.label, variant: 'danger' },
    en_camino_a_recojo: { label: TRIP_STATUS_LABELS.en_camino_a_recojo.label, variant: 'warning' },
    recojo_completado: { label: TRIP_STATUS_LABELS.recojo_completado.label, variant: 'success' },
    en_camino_a_destino: { label: TRIP_STATUS_LABELS.en_camino_a_destino.label, variant: 'success' },
    entregado_pendiente_confirmacion: { label: TRIP_STATUS_LABELS.entregado_pendiente_confirmacion.label, variant: 'warning' },
    pendiente_pago: { label: TRIP_STATUS_LABELS.pendiente_pago.label, variant: 'warning' },
    pago_en_revision: { label: TRIP_STATUS_LABELS.pago_en_revision.label, variant: 'warning' },
    pago_rechazado: { label: TRIP_STATUS_LABELS.pago_rechazado.label, variant: 'danger' },
  };

  const { label, variant } = config[status] || { label: status, variant: 'default' };

  return (
    <Badge variant={variant} className={cn('capitalize', className)}>
      {label} {detail && <span className="ml-1 opacity-80">• {detail}</span>}
    </Badge>
  );
};
