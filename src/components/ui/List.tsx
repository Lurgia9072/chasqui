import { HTMLAttributes, forwardRef, ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface ListProps extends HTMLAttributes<HTMLUListElement> {
  children: ReactNode;
  variant?: 'default' | 'ordered' | 'unstyled';
}

export const List = forwardRef<HTMLUListElement, ListProps>(
  ({ className, children, variant = 'default', ...props }, ref) => {
    const Tag = variant === 'ordered' ? 'ol' : 'ul';

    const variants = {
      default: 'list-disc list-inside space-y-2 text-gray-700',
      ordered: 'list-decimal list-inside space-y-2 text-gray-700',
      unstyled: 'list-none space-y-2 text-gray-700',
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

List.displayName = 'List';

export const ListItem = forwardRef<HTMLLIElement, HTMLAttributes<HTMLLIElement>>(
  ({ className, ...props }, ref) => (
    <li ref={ref} className={cn('text-sm leading-relaxed', className)} {...props} />
  )
);

ListItem.displayName = 'ListItem';
