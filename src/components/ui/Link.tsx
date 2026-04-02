import { AnchorHTMLAttributes, forwardRef, ReactNode } from 'react';
import { Link as RouterLink, LinkProps as RouterLinkProps } from 'react-router-dom';
import { cn } from '../../lib/utils';

interface LinkProps extends RouterLinkProps {
  children: ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'underline';
  className?: string;
}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ className, children, variant = 'default', ...props }, ref) => {
    const variants = {
      default: 'text-gray-600 hover:text-gray-900',
      primary: 'text-blue-600 hover:text-blue-700 font-medium',
      secondary: 'text-gray-900 hover:text-blue-600 font-medium',
      underline: 'text-gray-900 underline underline-offset-4 hover:text-blue-600',
    };

    return (
      <RouterLink
        ref={ref}
        className={cn('transition-colors', variants[variant], className)}
        {...props}
      >
        {children}
      </RouterLink>
    );
  }
);

Link.displayName = 'Link';
