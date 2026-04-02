import { useState, createContext, useContext, ReactNode, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface DropdownMenuContextType {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const DropdownMenuContext = createContext<DropdownMenuContextType | undefined>(undefined);

export const DropdownMenu = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <DropdownMenuContext.Provider value={{ isOpen, setIsOpen }}>
      <div className="relative inline-block">{children}</div>
    </DropdownMenuContext.Provider>
  );
};

export const DropdownMenuTrigger = ({ children, className }: { children: ReactNode; className?: string }) => {
  const context = useContext(DropdownMenuContext);
  if (!context) throw new Error('DropdownMenuTrigger must be used within DropdownMenu');
  return (
    <div
      onClick={() => context.setIsOpen(!context.isOpen)}
      className={cn('cursor-pointer', className)}
    >
      {children}
    </div>
  );
};

export const DropdownMenuContent = ({ children, className, align = 'end' }: { children: ReactNode; className?: string; align?: 'start' | 'center' | 'end' }) => {
  const context = useContext(DropdownMenuContext);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        context?.setIsOpen(false);
      }
    };
    if (context?.isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [context?.isOpen]);

  if (!context?.isOpen) return null;

  const alignments = {
    start: 'left-0',
    center: 'left-1/2 -translate-x-1/2',
    end: 'right-0',
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={ref}
        initial={{ opacity: 0, scale: 0.95, y: 5 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 5 }}
        className={cn(
          'absolute z-50 mt-2 min-w-[160px] overflow-hidden rounded-md border bg-white p-1 text-gray-950 shadow-md outline-none',
          alignments[align],
          className
        )}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export const DropdownMenuItem = ({ children, className, onClick }: { children: ReactNode; className?: string; onClick?: () => void }) => {
  const context = useContext(DropdownMenuContext);
  return (
    <div
      onClick={() => {
        onClick?.();
        context?.setIsOpen(false);
      }}
      className={cn(
        'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-gray-100 focus:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-gray-100 hover:text-gray-900',
        className
      )}
    >
      {children}
    </div>
  );
};

export const DropdownMenuLabel = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn('px-2 py-1.5 text-sm font-semibold', className)}>{children}</div>
);

export const DropdownMenuSeparator = ({ className }: { className?: string }) => (
  <div className={cn('-mx-1 my-1 h-px bg-gray-100', className)} />
);
