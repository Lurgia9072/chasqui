import { useState, createContext, useContext, ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface CollapsibleContextType {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const CollapsibleContext = createContext<CollapsibleContextType | undefined>(undefined);

export const Collapsible = ({ open, onOpenChange, children, className }: { open?: boolean; onOpenChange?: (open: boolean) => void; children: ReactNode; className?: string }) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open !== undefined ? open : internalOpen;
  const setIsOpen = onOpenChange !== undefined ? onOpenChange : setInternalOpen;

  return (
    <CollapsibleContext.Provider value={{ isOpen, setIsOpen }}>
      <div className={cn('w-full', className)}>{children}</div>
    </CollapsibleContext.Provider>
  );
};

export const CollapsibleTrigger = ({ children, className }: { children: ReactNode; className?: string }) => {
  const context = useContext(CollapsibleContext);
  if (!context) throw new Error('CollapsibleTrigger must be used within Collapsible');
  return (
    <button
      onClick={() => context.setIsOpen(!context.isOpen)}
      className={cn('w-full text-left', className)}
    >
      {children}
    </button>
  );
};

export const CollapsibleContent = ({ children, className }: { children: ReactNode; className?: string }) => {
  const context = useContext(CollapsibleContext);
  if (!context) throw new Error('CollapsibleContent must be used within Collapsible');
  return (
    <AnimatePresence initial={false}>
      {context.isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className={cn('overflow-hidden', className)}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
