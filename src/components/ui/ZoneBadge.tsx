import { MapPin, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Badge } from './Badge';

interface ZoneBadgeProps {
  label: string;
  onRemove?: () => void;
  className?: string;
}

export const ZoneBadge = ({ label, onRemove, className }: ZoneBadgeProps) => {
  return (
    <Badge
      variant="secondary"
      className={cn('flex items-center space-x-1.5 py-1.5 px-3 bg-blue-50 text-blue-700 border-blue-100', className)}
    >
      <MapPin className="h-3 w-3" />
      <span className="text-sm font-medium">{label}</span>
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-1 rounded-full p-0.5 hover:bg-blue-200 hover:text-blue-900 transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </Badge>
  );
};
