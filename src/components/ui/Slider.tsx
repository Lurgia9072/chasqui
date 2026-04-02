import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  min?: number;
  max?: number;
  step?: number;
  value: number;
  onValueChange: (value: number) => void;
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  ({ className, label, error, min = 0, max = 100, step = 1, value, onValueChange, ...props }, ref) => {
    return (
      <div className="w-full space-y-2">
        {label && (
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              {label}
            </label>
            <span className="text-sm font-bold text-blue-600">{value}</span>
          </div>
        )}
        <input
          ref={ref}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onValueChange(Number(e.target.value))}
          className={cn(
            'h-2 w-full cursor-pointer appearance-none rounded-full bg-gray-200 accent-blue-600 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-xs font-medium text-red-500 animate-in fade-in slide-in-from-top-1">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Slider.displayName = 'Slider';
