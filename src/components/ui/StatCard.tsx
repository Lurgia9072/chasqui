import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Card, CardContent } from './Card';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  description?: string;
  trend?: {
    value: string | number;
    isPositive: boolean;
  };
  className?: string;
}

export const StatCard = ({ icon: Icon, label, value, description, trend, className }: StatCardProps) => {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-500">{label}</p>
            <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
          </div>
          <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
            <Icon className="h-6 w-6" />
          </div>
        </div>
        {(description || trend) && (
          <div className="mt-4 flex items-center space-x-2 text-sm">
            {trend && (
              <span className={cn('font-bold', trend.isPositive ? 'text-green-600' : 'text-red-600')}>
                {trend.isPositive ? '+' : '-'}{trend.value}
              </span>
            )}
            {description && <span className="text-gray-500">{description}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
