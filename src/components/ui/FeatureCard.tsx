import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Card, CardContent } from './Card';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
  variant?: 'default' | 'primary' | 'secondary';
}

export const FeatureCard = ({ icon: Icon, title, description, className, variant = 'default' }: FeatureCardProps) => {
  const variants = {
    default: 'bg-white text-gray-900 border-gray-200 hover:border-blue-500 hover:shadow-xl',
    primary: 'bg-blue-600 text-white border-blue-600',
    secondary: 'bg-gray-100 text-gray-900 border-gray-100',
  };

  const iconColors = {
    default: 'bg-blue-50 text-blue-600',
    primary: 'bg-white/20 text-white',
    secondary: 'bg-white text-blue-600',
  };

  return (
    <Card className={cn('overflow-hidden transition-all duration-300', variants[variant], className)}>
      <CardContent className="p-8">
        <div className={cn('mb-6 inline-flex rounded-2xl p-4 shadow-sm', iconColors[variant])}>
          <Icon className="h-8 w-8" />
        </div>
        <h3 className="mb-3 text-xl font-extrabold tracking-tight">{title}</h3>
        <p className={cn('text-sm leading-relaxed opacity-80', variant === 'default' ? 'text-gray-500' : 'text-white/80')}>
          {description}
        </p>
      </CardContent>
    </Card>
  );
};
