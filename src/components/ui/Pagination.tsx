import { HTMLAttributes, forwardRef, ReactNode } from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '../../lib/utils';

export const Pagination = ({ className, ...props }: HTMLAttributes<HTMLElement>) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn('mx-auto flex w-full justify-center', className)}
    {...props}
  />
);

export const PaginationContent = forwardRef<HTMLUListElement, HTMLAttributes<HTMLUListElement>>(
  ({ className, ...props }, ref) => (
    <ul
      ref={ref}
      className={cn('flex flex-row items-center gap-1', className)}
      {...props}
    />
  )
);

PaginationContent.displayName = 'PaginationContent';

export const PaginationItem = forwardRef<HTMLLIElement, HTMLAttributes<HTMLLIElement>>(
  ({ className, ...props }, ref) => (
    <li ref={ref} className={cn('', className)} {...props} />
  )
);

PaginationItem.displayName = 'PaginationItem';

export const PaginationLink = ({ className, isActive, size = 'icon', ...props }: HTMLAttributes<HTMLAnchorElement> & { isActive?: boolean; size?: 'default' | 'icon' }) => (
  <a
    aria-current={isActive ? 'page' : undefined}
    className={cn(
      'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50',
      isActive ? 'border border-gray-200 bg-white shadow-sm hover:bg-gray-100 hover:text-gray-900' : 'hover:bg-gray-100 hover:text-gray-900',
      size === 'icon' ? 'h-9 w-9' : 'h-9 px-4 py-2',
      className
    )}
    {...props}
  />
);

export const PaginationPrevious = ({ className, ...props }: HTMLAttributes<HTMLAnchorElement>) => (
  <PaginationLink
    aria-label="Go to previous page"
    size="default"
    className={cn('gap-1 pl-2.5', className)}
    {...props}
  >
    <ChevronLeft className="h-4 w-4" />
    <span>Previous</span>
  </PaginationLink>
);

export const PaginationNext = ({ className, ...props }: HTMLAttributes<HTMLAnchorElement>) => (
  <PaginationLink
    aria-label="Go to next page"
    size="default"
    className={cn('gap-1 pr-2.5', className)}
    {...props}
  >
    <span>Next</span>
    <ChevronRight className="h-4 w-4" />
  </PaginationLink>
);

export const PaginationEllipsis = ({ className, ...props }: HTMLAttributes<HTMLSpanElement>) => (
  <span
    aria-hidden
    className={cn('flex h-9 w-9 items-center justify-center', className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More pages</span>
  </span>
);
