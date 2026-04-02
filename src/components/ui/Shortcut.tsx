import { HTMLAttributes, forwardRef, ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { Kbd } from './Kbd';

interface ShortcutProps extends HTMLAttributes<HTMLDivElement> {
  keys: string[];
  className?: string;
}

export const Shortcut = forwardRef<HTMLDivElement, ShortcutProps>(
  ({ className, keys, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center gap-1', className)}
      {...props}
    >
      {keys.map((key) => (
        <Kbd key={key}>{key}</Kbd>
      ))}
    </div>
  )
);

Shortcut.displayName = 'Shortcut';
