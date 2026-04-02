import { Bell } from 'lucide-react';
import { cn } from '../../lib/utils';

interface NotificationBadgeProps {
  count: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const NotificationBadge = ({ count, className, size = 'md' }: NotificationBadgeProps) => {
  const sizes = {
    sm: 'h-4 w-4 text-[8px]',
    md: 'h-5 w-5 text-[10px]',
    lg: 'h-6 w-6 text-[12px]',
  };

  if (count === 0) return null;

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-red-600 font-bold text-white shadow-lg shadow-red-200',
        sizes[size],
        className
      )}
    >
      {count > 99 ? '99+' : count}
    </div>
  );
};
