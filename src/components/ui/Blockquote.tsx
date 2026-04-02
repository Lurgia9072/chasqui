import { HTMLAttributes, forwardRef, ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface BlockquoteProps extends HTMLAttributes<HTMLQuoteElement> {
  children: ReactNode;
  cite?: string;
}

export const Blockquote = forwardRef<HTMLQuoteElement, BlockquoteProps>(
  ({ className, children, cite, ...props }, ref) => (
    <blockquote
      ref={ref}
      className={cn(
        'relative border-l-4 border-blue-600 pl-6 italic text-gray-700 leading-relaxed',
        className
      )}
      cite={cite}
      {...props}
    >
      {children}
    </blockquote>
  )
);

Blockquote.displayName = 'Blockquote';
