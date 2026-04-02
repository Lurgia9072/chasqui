import { cn } from '../../lib/utils';

interface DividerProps {
  label?: string;
  className?: string;
}

export const Divider = ({ label, className }: DividerProps) => {
  return (
    <div className={cn('relative flex items-center py-4', className)}>
      <div className="flex-grow border-t border-gray-200"></div>
      {label && (
        <span className="mx-4 shrink-0 text-xs font-medium uppercase tracking-wider text-gray-400">
          {label}
        </span>
      )}
      <div className="flex-grow border-t border-gray-200"></div>
    </div>
  );
};
