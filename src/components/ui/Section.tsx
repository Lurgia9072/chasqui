import { HTMLAttributes, forwardRef, ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { Container } from './Container';

interface SectionProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  containerSize?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  noContainer?: boolean;
}

export const Section = forwardRef<HTMLElement, SectionProps>(
  ({ className, children, containerSize = 'lg', noContainer = false, ...props }, ref) => {
    return (
      <section
        ref={ref}
        className={cn('py-12 md:py-20 lg:py-24', className)}
        {...props}
      >
        {noContainer ? (
          children
        ) : (
          <Container size={containerSize}>{children}</Container>
        )}
      </section>
    );
  }
);

Section.displayName = 'Section';
