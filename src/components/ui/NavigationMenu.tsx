import { useState, createContext, useContext, ReactNode, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';

interface NavigationMenuContextType {
  activeItem: string | null;
  setActiveItem: (id: string | null) => void;
}

const NavigationMenuContext = createContext<NavigationMenuContextType | undefined>(undefined);

export const NavigationMenu = ({ children, className }: { children: ReactNode; className?: string }) => {
  const [activeItem, setActiveItem] = useState<string | null>(null);
  return (
    <NavigationMenuContext.Provider value={{ activeItem, setActiveItem }}>
      <nav className={cn('relative z-10 flex max-w-max flex-1 items-center justify-center', className)}>
        {children}
      </nav>
    </NavigationMenuContext.Provider>
  );
};

export const NavigationMenuList = ({ children, className }: { children: ReactNode; className?: string }) => (
  <ul className={cn('group flex flex-1 list-none items-center justify-center space-x-1', className)}>
    {children}
  </ul>
);

export const NavigationMenuItem = ({ children, className }: { children: ReactNode; className?: string }) => (
  <li className={cn('relative', className)}>{children}</li>
);

export const NavigationMenuTrigger = ({ value, children, className }: { value: string; children: ReactNode; className?: string }) => {
  const context = useContext(NavigationMenuContext);
  if (!context) throw new Error('NavigationMenuTrigger must be used within NavigationMenu');
  const isActive = context.activeItem === value;

  return (
    <button
      onClick={() => context.setActiveItem(isActive ? null : value)}
      className={cn(
        'group inline-flex h-10 w-max items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900 focus:bg-gray-100 focus:text-gray-900 focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-gray-100/50 data-[state=open]:bg-gray-100/50',
        isActive && 'bg-gray-100/50',
        className
      )}
    >
      {children}
      <ChevronDown
        className={cn(
          'relative top-[1px] ml-1 h-3.5 w-3.5 transition-transform duration-200',
          isActive && 'rotate-180'
        )}
      />
    </button>
  );
};

export const NavigationMenuContent = ({ value, children, className }: { value: string; children: ReactNode; className?: string }) => {
  const context = useContext(NavigationMenuContext);
  if (!context) throw new Error('NavigationMenuContent must be used within NavigationMenu');
  const isActive = context.activeItem === value;

  if (!isActive) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        className={cn(
          'absolute left-0 top-full z-50 mt-2 min-w-[200px] rounded-md border bg-white p-4 text-gray-950 shadow-md outline-none',
          className
        )}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export const NavigationMenuLink = ({ children, className, href }: { children: ReactNode; className?: string; href?: string }) => (
  <a
    href={href}
    className={cn(
      'group inline-flex h-10 w-max items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900 focus:bg-gray-100 focus:text-gray-900 focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-gray-100/50 data-[state=open]:bg-gray-100/50',
      className
    )}
  >
    {children}
  </a>
);
