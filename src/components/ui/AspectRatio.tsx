import { HTMLAttributes, forwardRef, ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface AspectRatioProps extends HTMLAttributes<HTMLDivElement> {
  ratio?: number;
  children: ReactNode;
}

export const AspectRatio = forwardRef<HTMLDivElement, AspectRatioProps>(
  ({ className, ratio = 1, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('relative w-full overflow-hidden', className)}
      style={{ paddingBottom: `${(1 / ratio) * 100}%` }}
      {...props}
    >
      <div className="absolute inset-0">{children}</div>
    </div>
  )
);

AspectRatio.displayName = 'AspectRatio';
