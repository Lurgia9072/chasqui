import { cn } from '../../lib/utils';

export const LoadingSpinner = ({ className }: { className?: string }) => {
  return (
    <div
      className={cn(
        'h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent text-blue-600',
        className
      )}
      role="status"
      aria-label="loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};
