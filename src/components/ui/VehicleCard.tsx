import { Truck, Car, Bike } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Card, CardContent } from './Card';

interface VehicleCardProps {
  type: 'truck' | 'car' | 'bike';
  label: string;
  description?: string;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

export const VehicleCard = ({ type, label, description, isSelected, onClick, className }: VehicleCardProps) => {
  const icons = {
    truck: <Truck className="h-6 w-6" />,
    car: <Car className="h-6 w-6" />,
    bike: <Bike className="h-6 w-6" />,
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full flex-col items-center justify-center space-y-3 rounded-2xl border p-6 text-center transition-all hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
        isSelected ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'border-gray-200 bg-white',
        className
      )}
    >
      <div className={cn('rounded-2xl p-4', isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400')}>
        {icons[type]}
      </div>
      <div className="space-y-1">
        <p className={cn('text-sm font-bold', isSelected ? 'text-blue-900' : 'text-gray-900')}>{label}</p>
        {description && <p className="text-xs text-gray-500">{description}</p>}
      </div>
      {isSelected && (
        <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-blue-600 p-1 text-white">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      )}
    </button>
  );
};
