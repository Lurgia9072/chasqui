import { useState, createContext, useContext, ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface ToggleGroupContextType {
  value: string | string[];
  onValueChange: (value: string | string[]) => void;
  type: 'single' | 'multiple';
}

const ToggleGroupContext = createContext<ToggleGroupContextType | undefined>(undefined);

export const ToggleGroup = ({ value, onValueChange, type = 'single', children, className }: { value?: string | string[]; onValueChange?: (value: string | string[]) => void; type?: 'single' | 'multiple'; children: ReactNode; className?: string }) => {
  const [internalValue, setInternalValue] = useState<string | string[]>(type === 'single' ? '' : []);
  const currentValue = value !== undefined ? value : internalValue;
  const setCurrentValue = onValueChange !== undefined ? onValueChange : setInternalValue;

  return (
    <ToggleGroupContext.Provider value={{ value: currentValue, onValueChange: setCurrentValue, type }}>
      <div className={cn('flex items-center justify-center gap-1', className)}>{children}</div>
    </ToggleGroupContext.Provider>
  );
};

export const ToggleGroupItem = ({ value, children, className }: { value: string; children: ReactNode; className?: string }) => {
  const context = useContext(ToggleGroupContext);
  if (!context) throw new Error('ToggleGroupItem must be used within ToggleGroup');

  const isPressed = context.type === 'single' ? context.value === value : (context.value as string[]).includes(value);

  const handleClick = () => {
    if (context.type === 'single') {
      context.onValueChange(value);
    } else {
      const current = context.value as string[];
      if (current.includes(value)) {
        context.onValueChange(current.filter((v) => v !== value));
      } else {
        context.onValueChange([...current, value]);
      }
    }
  };

  return (
    <button
      type="button"
      aria-pressed={isPressed}
      data-state={isPressed ? 'on' : 'off'}
      onClick={handleClick}
      className={cn(
        'inline-flex h-10 items-center justify-center rounded-md px-3 py-2 text-sm font-medium ring-offset-white transition-all hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-gray-100 data-[state=on]:text-gray-900',
        className
      )}
    >
      {children}
    </button>
  );
};
