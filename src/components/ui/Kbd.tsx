import { HTMLAttributes, forwardRef, ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface KbdProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
}

export const Kbd = forwardRef<HTMLElement, KbdProps>(
  ({ className, children, ...props }, ref) => (
    <kbd
      ref={ref}
      className={cn(
        'pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-gray-100 px-1.5 font-mono text-[10px] font-medium text-gray-500 opacity-100',
        className
      )}
      {...props}
    >
      {children}
    </kbd>
  )
);

Kbd.displayName = 'Kbd';
