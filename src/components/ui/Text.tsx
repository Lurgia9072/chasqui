import React, { HTMLAttributes, forwardRef, ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface TextProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode;
  variant?: 'default' | 'muted' | 'small' | 'large' | 'lead';
  as?: 'p' | 'span' | 'div';
}

export const Text = forwardRef<HTMLParagraphElement, TextProps>(
  ({ className, children, variant = 'default', as = 'p', ...props }, ref) => {
    const Tag = as as React.ElementType;

    const variants = {
      default: 'text-base text-gray-700 leading-relaxed',
      muted: 'text-sm text-gray-500 leading-relaxed',
      small: 'text-xs text-gray-500 leading-relaxed',
      large: 'text-lg font-semibold text-gray-900 leading-relaxed',
      lead: 'text-xl text-gray-500 leading-relaxed',
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

Text.displayName = 'Text';
