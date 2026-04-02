import React, { HTMLAttributes, forwardRef, ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  children: ReactNode;
}

export const Heading = forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, level = 1, children, ...props }, ref) => {
    const Tag = `h${level}` as React.ElementType;

    const levels = {
      1: 'text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl',
      2: 'text-3xl font-bold tracking-tight md:text-4xl',
      3: 'text-2xl font-bold tracking-tight md:text-3xl',
      4: 'text-xl font-bold tracking-tight md:text-2xl',
      5: 'text-lg font-bold tracking-tight md:text-xl',
      6: 'text-base font-bold tracking-tight md:text-lg',
    };

    return (
      <Tag
        ref={ref}
        className={cn('text-gray-900', levels[level], className)}
        {...props}
      >
        {children}
      </Tag>
    );
  }
);

Heading.displayName = 'Heading';
