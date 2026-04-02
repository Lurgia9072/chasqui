import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';
import { Check } from 'lucide-react';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        <label className="flex items-center space-x-3 cursor-pointer group">
          <div className="relative flex items-center">
            <input
              ref={ref}
              type="checkbox"
              className={cn(
                'peer h-5 w-5 appearance-none rounded border border-gray-300 bg-white transition-all checked:border-blue-600 checked:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50',
                error ? 'border-red-500' : 'group-hover:border-gray-400',
                className
              )}
              {...props}
            />
            <Check className="pointer-events-none absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100" />
          </div>
          {label && (
            <span className="text-sm font-medium text-gray-700 select-none">
              {label}
            </span>
          )}
        </label>
        {error && (
          <p className="text-xs font-medium text-red-500 animate-in fade-in slide-in-from-top-1">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
