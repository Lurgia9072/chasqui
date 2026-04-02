import { HTMLAttributes, forwardRef, ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface StackProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  direction?: 'row' | 'col';
  sm?: 'row' | 'col';
  md?: 'row' | 'col';
  lg?: 'row' | 'col';
  gap?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12;
  align?: 'start' | 'center' | 'end' | 'baseline' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
}

export const Stack = forwardRef<HTMLDivElement, StackProps>(
  ({ className, children, direction = 'col', sm, md, lg, gap = 4, align = 'stretch', justify = 'start', ...props }, ref) => {
    const directions = {
      row: 'flex-row',
      col: 'flex-col',
    };

    const smDirections = {
      row: 'sm:flex-row',
      col: 'sm:flex-col',
    };

    const mdDirections = {
      row: 'md:flex-row',
      col: 'md:flex-col',
    };

    const lgDirections = {
      row: 'lg:flex-row',
      col: 'lg:flex-col',
    };

    const gapClasses = {
      0: 'gap-0',
      1: 'gap-1',
      2: 'gap-2',
      3: 'gap-3',
      4: 'gap-4',
      5: 'gap-5',
      6: 'gap-6',
      8: 'gap-8',
      10: 'gap-10',
      12: 'gap-12',
    };

    const alignClasses = {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      baseline: 'items-baseline',
      stretch: 'items-stretch',
    };

    const justifyClasses = {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
      around: 'justify-around',
      evenly: 'justify-evenly',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'flex',
          directions[direction],
          sm && smDirections[sm],
          md && mdDirections[md],
          lg && lgDirections[lg],
          gapClasses[gap],
          alignClasses[align],
          justifyClasses[justify],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Stack.displayName = 'Stack';
