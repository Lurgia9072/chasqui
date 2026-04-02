import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface IconProps {
  icon: LucideIcon;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'muted' | 'white';
}

export const Icon = ({ icon: LucideIcon, className, size = 'md', color = 'primary' }: IconProps) => {
  const sizes = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
    xl: 'h-8 w-8',
  };

  const colors = {
    primary: 'text-blue-600',
    secondary: 'text-gray-900',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    danger: 'text-red-600',
    info: 'text-blue-400',
    muted: 'text-gray-400',
    white: 'text-white',
  };

  return (
    <LucideIcon
      className={cn(sizes[size], colors[color], className)}
      aria-hidden="true"
    />
  );
};
