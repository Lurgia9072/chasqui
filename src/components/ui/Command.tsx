import { useState, createContext, useContext, ReactNode, useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';
import { Search } from 'lucide-react';

interface CommandContextType {
  search: string;
  setSearch: (search: string) => void;
}

const CommandContext = createContext<CommandContextType | undefined>(undefined);

export const Command = ({ children, className }: { children: ReactNode; className?: string }) => {
  const [search, setSearch] = useState('');
  return (
    <CommandContext.Provider value={{ search, setSearch }}>
      <div className={cn('flex h-full w-full flex-col overflow-hidden rounded-md bg-white text-gray-950', className)}>
        {children}
      </div>
    </CommandContext.Provider>
  );
};

export const CommandInput = ({ placeholder, className }: { placeholder?: string; className?: string }) => {
  const context = useContext(CommandContext);
  if (!context) throw new Error('CommandInput must be used within Command');
  return (
    <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
      <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
      <input
        value={context.search}
        onChange={(e) => context.setSearch(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-gray-500 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
      />
    </div>
  );
};

export const CommandList = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn('max-h-[300px] overflow-y-auto overflow-x-hidden', className)}>
    {children}
  </div>
);

export const CommandEmpty = ({ children }: { children: ReactNode }) => {
  const context = useContext(CommandContext);
  if (!context) throw new Error('CommandEmpty must be used within Command');
  // Simple logic: if search is present but no results (this component is manually placed)
  return <div className="py-6 text-center text-sm">{children}</div>;
};

export const CommandGroup = ({ heading, children, className }: { heading?: string; children: ReactNode; className?: string }) => (
  <div className={cn('overflow-hidden p-1 text-gray-950 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-gray-500', className)}>
    {heading && <div cmdk-group-heading="">{heading}</div>}
    {children}
  </div>
);

export const CommandItem = ({ children, className, onSelect }: { children: ReactNode; className?: string; onSelect?: () => void }) => (
  <div
    onClick={onSelect}
    className={cn(
      'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-gray-100 aria-selected:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-gray-100 hover:text-gray-900',
      className
    )}
  >
    {children}
  </div>
);
