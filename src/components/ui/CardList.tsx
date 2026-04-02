import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface CardListProps {
  children: ReactNode;
  className?: string;
  gap?: 4 | 6 | 8;
}

export const CardList = ({ children, className, gap = 6 }: CardListProps) => {
  const gapClasses = {
    4: 'space-y-4',
    6: 'space-y-6',
    8: 'space-y-8',
  };

  return <div className={cn(gapClasses[gap], className)}>{children}</div>;
};
