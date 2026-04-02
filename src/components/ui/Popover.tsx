import { useState, createContext, useContext, ReactNode, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface PopoverContextType {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const PopoverContext = createContext<PopoverContextType | undefined>(undefined);

export const Popover = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <PopoverContext.Provider value={{ isOpen, setIsOpen }}>
      <div className="relative inline-block">{children}</div>
    </PopoverContext.Provider>
  );
};

export const PopoverTrigger = ({ children, className }: { children: ReactNode; className?: string }) => {
  const context = useContext(PopoverContext);
  if (!context) throw new Error('PopoverTrigger must be used within Popover');
  return (
    <div
      onClick={() => context.setIsOpen(!context.isOpen)}
      className={cn('cursor-pointer', className)}
    >
      {children}
    </div>
  );
};

export const PopoverContent = ({ children, className, align = 'center' }: { children: ReactNode; className?: string; align?: 'start' | 'center' | 'end' }) => {
  const context = useContext(PopoverContext);
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
          'absolute z-50 mt-2 min-w-[200px] rounded-md border bg-white p-4 text-gray-950 shadow-md outline-none',
          alignments[align],
          className
        )}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};
