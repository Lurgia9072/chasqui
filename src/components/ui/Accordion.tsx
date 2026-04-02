import { useState, createContext, useContext, ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';

interface AccordionContextType {
  activeItem: string | null;
  setActiveItem: (id: string | null) => void;
}

const AccordionContext = createContext<AccordionContextType | undefined>(undefined);

export const Accordion = ({ children, className, type = 'single', defaultValue }: { children: ReactNode; className?: string; type?: 'single' | 'multiple'; defaultValue?: string }) => {
  const [activeItem, setActiveItem] = useState<string | null>(defaultValue || null);

  return (
    <AccordionContext.Provider value={{ activeItem, setActiveItem }}>
      <div className={cn('w-full border-t border-gray-200', className)}>{children}</div>
    </AccordionContext.Provider>
  );
};

export const AccordionItem = ({ value, children, className }: { value: string; children: ReactNode; className?: string }) => {
  return (
    <div className={cn('border-b border-gray-200', className)}>{children}</div>
  );
};

export const AccordionTrigger = ({ value, children, className }: { value: string; children: ReactNode; className?: string }) => {
  const context = useContext(AccordionContext);
  if (!context) throw new Error('AccordionTrigger must be used within Accordion');
  const isOpen = context.activeItem === value;

  return (
    <button
      onClick={() => context.setActiveItem(isOpen ? null : value)}
      className={cn(
        'flex w-full items-center justify-between py-4 text-sm font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180',
        className
      )}
      data-state={isOpen ? 'open' : 'closed'}
    >
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
    </button>
  );
};

export const AccordionContent = ({ value, children, className }: { value: string; children: ReactNode; className?: string }) => {
  const context = useContext(AccordionContext);
  if (!context) throw new Error('AccordionContent must be used within Accordion');
  const isOpen = context.activeItem === value;

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className={cn('overflow-hidden text-sm transition-all', className)}
        >
          <div className="pb-4 pt-0">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
