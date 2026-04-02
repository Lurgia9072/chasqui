import { ReactNode } from 'react';
import { LucideIcon, ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Card, CardContent } from './Card';

interface ActionCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick?: () => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline';
}

export const ActionCard = ({ icon: Icon, title, description, onClick, className, variant = 'primary' }: ActionCardProps) => {
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
    outline: 'border border-gray-200 bg-white text-gray-900 hover:border-blue-500 hover:shadow-xl',
  };

  const iconColors = {
    primary: 'bg-white/20 text-white',
    secondary: 'bg-white text-blue-600',
    outline: 'bg-blue-50 text-blue-600',
  };

  return (
    <Card
      onClick={onClick}
      className={cn(
        'group cursor-pointer overflow-hidden transition-all duration-300',
        variants[variant],
        className
      )}
    >
      <CardContent className="p-8">
        <div className="flex items-start justify-between">
          <div className="space-y-4">
            <div className={cn('inline-flex rounded-2xl p-4 shadow-sm transition-transform group-hover:scale-110', iconColors[variant])}>
              <Icon className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-extrabold tracking-tight">{title}</h3>
              <p className={cn('text-sm leading-relaxed opacity-80', variant === 'outline' ? 'text-gray-500' : 'text-white/80')}>
                {description}
              </p>
            </div>
          </div>
          <div className={cn('rounded-full p-2 transition-transform group-hover:translate-x-2', variant === 'outline' ? 'bg-blue-50 text-blue-600' : 'bg-white/20 text-white')}>
            <ArrowRight className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
