import { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from './Card';

interface SummaryCardProps {
  title: string;
  items: {
    label: string;
    value: ReactNode;
    icon?: ReactNode;
  }[];
  className?: string;
  footer?: ReactNode;
}

export const SummaryCard = ({ title, items, className, footer }: SummaryCardProps) => {
  return (
    <Card className={cn('overflow-hidden border-gray-200', className)}>
      <CardHeader className="bg-gray-50/50 border-b border-gray-100">
        <CardTitle className="text-base font-bold text-gray-900">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {items.map((item, index) => (
          <div key={index} className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              {item.icon && <div className="text-gray-400">{item.icon}</div>}
              <span className="text-sm font-medium text-gray-500">{item.label}</span>
            </div>
            <div className="text-sm font-bold text-gray-900">{item.value}</div>
          </div>
        ))}
        {footer && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            {footer}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
