import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface InfoItemProps {
  icon?: LucideIcon;
  label: string;
  value: ReactNode;
  className?: string;
  vertical?: boolean;
}

export const InfoItem = ({ icon: Icon, label, value, className, vertical = false }: InfoItemProps) => {
  return (
    <div className={cn('flex items-start space-x-3', vertical && 'flex-col space-x-0 space-y-1', className)}>
      {Icon && (
        <div className="shrink-0 mt-0.5 text-gray-400">
          <Icon className="h-4 w-4" />
        </div>
      )}
      <div className="flex-1">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{label}</p>
        <div className="mt-0.5 text-sm font-bold text-gray-900">{value}</div>
      </div>
    </div>
  );
};
