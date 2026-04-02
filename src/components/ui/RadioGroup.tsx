import { InputHTMLAttributes, forwardRef, ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface RadioGroupProps {
  children: ReactNode;
  className?: string;
}

export const RadioGroup = ({ children, className }: RadioGroupProps) => {
  return <div className={cn('grid gap-2', className)}>{children}</div>;
};

interface RadioGroupItemProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  id: string;
}

export const RadioGroupItem = forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ className, label, id, ...props }, ref) => {
    return (
      <label
        htmlFor={id}
        className="flex items-center space-x-3 cursor-pointer group"
      >
        <div className="relative flex items-center">
          <input
            ref={ref}
            type="radio"
            id={id}
            className={cn(
              'peer h-5 w-5 appearance-none rounded-full border border-gray-300 bg-white transition-all checked:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50',
              'group-hover:border-gray-400',
              className
            )}
            {...props}
          />
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600 opacity-0 transition-opacity peer-checked:opacity-100" />
        </div>
        {label && (
          <span className="text-sm font-medium text-gray-700 select-none">
            {label}
          </span>
        )}
      </label>
    );
  }
);

RadioGroupItem.displayName = 'RadioGroupItem';
