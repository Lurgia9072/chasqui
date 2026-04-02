import { useState, createContext, useContext, ReactNode, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface CarouselContextType {
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  totalItems: number;
  setTotalItems: (total: number) => void;
}

const CarouselContext = createContext<CarouselContextType | undefined>(undefined);

export const Carousel = ({ children, className }: { children: ReactNode; className?: string }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  return (
    <CarouselContext.Provider value={{ activeIndex, setActiveIndex, totalItems, setTotalItems }}>
      <div className={cn('relative w-full overflow-hidden', className)}>{children}</div>
    </CarouselContext.Provider>
  );
};

export const CarouselContent = ({ children, className }: { children: ReactNode; className?: string }) => {
  const context = useContext(CarouselContext);
  if (!context) throw new Error('CarouselContent must be used within Carousel');

  useEffect(() => {
    const count = (children as any[]).length || 0;
    context.setTotalItems(count);
  }, [children]);

  return (
    <motion.div
      animate={{ x: `-${context.activeIndex * 100}%` }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className={cn('flex', className)}
    >
      {children}
    </motion.div>
  );
};

export const CarouselItem = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn('min-w-full shrink-0 grow-0 basis-full', className)}>{children}</div>
);

export const CarouselPrevious = ({ className }: { className?: string }) => {
  const context = useContext(CarouselContext);
  if (!context) throw new Error('CarouselPrevious must be used within Carousel');

  const prev = () => {
    context.setActiveIndex((context.activeIndex - 1 + context.totalItems) % context.totalItems);
  };

  return (
    <button
      onClick={prev}
      className={cn(
        'absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-md backdrop-blur-sm transition-all hover:bg-white',
        className
      )}
    >
      <ChevronLeft className="h-5 w-5" />
    </button>
  );
};

export const CarouselNext = ({ className }: { className?: string }) => {
  const context = useContext(CarouselContext);
  if (!context) throw new Error('CarouselNext must be used within Carousel');

  const next = () => {
    context.setActiveIndex((context.activeIndex + 1) % context.totalItems);
  };

  return (
    <button
      onClick={next}
      className={cn(
        'absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-md backdrop-blur-sm transition-all hover:bg-white',
        className
      )}
    >
      <ChevronRight className="h-5 w-5" />
    </button>
  );
};
