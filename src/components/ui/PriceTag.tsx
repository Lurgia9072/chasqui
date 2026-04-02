import { cn } from '../../lib/utils';

interface PriceTagProps {
  amount: number;
  currency?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const PriceTag = ({ amount, currency = 'S/', className, size = 'md' }: PriceTagProps) => {
  const sizes = {
    sm: 'text-sm font-semibold',
    md: 'text-lg font-bold',
    lg: 'text-2xl font-extrabold',
  };

  return (
    <div className={cn('flex items-baseline space-x-1 text-blue-600', sizes[size], className)}>
      <span className="text-[0.7em] font-medium">{currency}</span>
      <span>{amount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
    </div>
  );
};
