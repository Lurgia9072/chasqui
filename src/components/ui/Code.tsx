import { HTMLAttributes, forwardRef, ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface CodeProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  variant?: 'default' | 'block';
}

export const Code = forwardRef<HTMLElement, CodeProps>(
  ({ className, children, variant = 'default', ...props }, ref) => {
    const Tag = variant === 'block' ? 'pre' : 'code';

    const variants = {
      default: 'rounded bg-gray-100 px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold text-gray-900',
      block: 'block w-full overflow-x-auto rounded-xl bg-gray-900 p-4 font-mono text-sm text-white',
    };

    return (
      <Tag
        ref={ref}
        className={cn(variants[variant], className)}
        {...props}
      >
        {children}
      </Tag>
    );
  }
);

Code.displayName = 'Code';
