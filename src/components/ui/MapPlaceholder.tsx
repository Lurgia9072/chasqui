import { MapPin } from 'lucide-react';
import { cn } from '../../lib/utils';

interface MapPlaceholderProps {
  className?: string;
  label?: string;
}

export const MapPlaceholder = ({ className, label = 'Mapa de seguimiento' }: MapPlaceholderProps) => {
  return (
    <div className={cn('relative flex h-full w-full flex-col items-center justify-center bg-gray-100 p-8 text-center', className)}>
      <div className="mb-4 rounded-full bg-blue-50 p-4 text-blue-600">
        <MapPin className="h-10 w-10 animate-bounce" />
      </div>
      <h3 className="mb-2 text-lg font-bold text-gray-900">{label}</h3>
      <p className="max-w-xs text-sm text-gray-500">
        Cargando mapa en tiempo real para el seguimiento de la carga...
      </p>
      <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent" />
    </div>
  );
};
