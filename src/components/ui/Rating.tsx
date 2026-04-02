import { Star, StarHalf } from 'lucide-react';
import { cn } from '../../lib/utils';

interface RatingProps {
  value: number;
  max?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
}

export const Rating = ({ value, max = 5, className, size = 'md', showValue = true }: RatingProps) => {
  const fullStars = Math.floor(value);
  const hasHalfStar = value % 1 >= 0.5;
  const emptyStars = max - fullStars - (hasHalfStar ? 1 : 0);

  const sizes = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <div className={cn('flex items-center space-x-1.5', className)}>
      <div className="flex items-center space-x-0.5">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} className={cn('fill-yellow-400 text-yellow-400', sizes[size])} />
        ))}
        {hasHalfStar && <StarHalf className={cn('fill-yellow-400 text-yellow-400', sizes[size])} />}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} className={cn('text-gray-300', sizes[size])} />
        ))}
      </div>
      {showValue && (
        <span className={cn('font-bold text-gray-700', size === 'sm' ? 'text-xs' : 'text-sm')}>
          {value.toFixed(1)}
        </span>
      )}
    </div>
  );
};
