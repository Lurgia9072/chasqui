import { useState, createContext, useContext, ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface SheetContextType {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const SheetContext = createContext<SheetContextType | undefined>(undefined);

export const Sheet = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <SheetContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </SheetContext.Provider>
  );
};

export const SheetTrigger = ({ children, className }: { children: ReactNode; className?: string }) => {
  const context = useContext(SheetContext);
  if (!context) throw new Error('SheetTrigger must be used within Sheet');
  return (
    <div
      onClick={() => context.setIsOpen(!context.isOpen)}
      className={cn('cursor-pointer', className)}
    >
      {children}
    </div>
  );
};

export const SheetContent = ({ children, className, side = 'right' }: { children: ReactNode; className?: string; side?: 'left' | 'right' | 'top' | 'bottom' }) => {
  const context = useContext(SheetContext);

  useEffect(() => {
    if (context?.isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [context?.isOpen]);

  if (!context?.isOpen) return null;

  const sideVariants = {
    left: { x: '-100%' },
    right: { x: '100%' },
    top: { y: '-100%' },
    bottom: { y: '100%' },
  };

  const sideClasses = {
    left: 'left-0 h-full w-3/4 max-w-sm border-r',
    right: 'right-0 h-full w-3/4 max-w-sm border-l',
    top: 'top-0 w-full h-1/3 border-b',
    bottom: 'bottom-0 w-full h-1/3 border-t',
  };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => context.setIsOpen(false)}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />
        <motion.div
          initial={sideVariants[side]}
          animate={{ x: 0, y: 0 }}
          exit={sideVariants[side]}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className={cn(
            'relative bg-white p-6 shadow-2xl ring-1 ring-gray-200',
            sideClasses[side],
            className
          )}
        >
          <button
            onClick={() => context.setIsOpen(false)}
            className="absolute right-4 top-4 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          {children}
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

export const SheetHeader = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn('flex flex-col space-y-2 text-center sm:text-left', className)}>{children}</div>
);

export const SheetTitle = ({ children, className }: { children: ReactNode; className?: string }) => (
  <h2 className={cn('text-lg font-semibold text-gray-950', className)}>{children}</h2>
);

export const SheetDescription = ({ children, className }: { children: ReactNode; className?: string }) => (
  <p className={cn('text-sm text-gray-500', className)}>{children}</p>
);

export const SheetFooter = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}>{children}</div>
);
