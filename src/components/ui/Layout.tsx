import { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { Navbar } from '../Navbar';
import { Footer } from './Footer';

interface LayoutProps {
  children: ReactNode;
  className?: string;
  noNavbar?: boolean;
  noFooter?: boolean;
}

export const Layout = ({ children, className, noNavbar = false, noFooter = false }: LayoutProps) => {
  return (
    <div className={cn('min-h-screen flex flex-col bg-white', className)}>
      {!noNavbar && <Navbar />}
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      {!noFooter && <Footer />}
    </div>
  );
};
