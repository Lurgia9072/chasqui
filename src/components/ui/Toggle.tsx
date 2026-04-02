import { useState, HTMLAttributes, forwardRef, ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface ToggleProps extends HTMLAttributes<HTMLButtonElement> {
  pressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
  children: ReactNode;
  variant?: 'default' | 'outline';
  size?: 'default' | 'sm' | 'lg';
}

export const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(
  ({ className, pressed, onPressedChange, children, variant = 'default', size = 'default', ...props }, ref) => {
    const [internalPressed, setInternalPressed] = useState(false);
    const isPressed = pressed !== undefined ? pressed : internalPressed;
    const setIsPressed = onPressedChange !== undefined ? onPressedChange : setInternalPressed;

    const variants = {
      default: 'bg-transparent hover:bg-gray-100 hover:text-gray-900 data-[state=on]:bg-gray-100 data-[state=on]:text-gray-900',
      outline: 'border border-gray-200 bg-transparent hover:bg-gray-100 hover:text-gray-900 data-[state=on]:bg-gray-100 data-[state=on]:text-gray-900',
    };

    const sizes = {
      default: 'h-10 px-3',
      sm: 'h-9 px-2.5',
      lg: 'h-11 px-5',
    };

    return (
      <button
        ref={ref}
        type="button"
        aria-pressed={isPressed}
        data-state={isPressed ? 'on' : 'off'}
        onClick={() => setIsPressed(!isPressed)}
        className={cn(
          'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Toggle.displayName = 'Toggle';
