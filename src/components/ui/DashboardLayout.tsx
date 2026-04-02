import { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { Navbar } from '../Navbar';
import { Container } from './Container';
import { Sidebar } from './Sidebar';

interface DashboardLayoutProps {
  children: ReactNode;
  className?: string;
  sidebar?: ReactNode;
}

export const DashboardLayout = ({ children, className, sidebar }: DashboardLayoutProps) => {
  return (
    <div className={cn('min-h-screen flex flex-col bg-gray-50', className)}>
      <Navbar />
      <div className="flex-1 flex flex-col lg:flex-row">
        {sidebar && (
          <aside className="hidden lg:block w-72 shrink-0 border-r border-gray-200 bg-white">
            {sidebar}
          </aside>
        )}
        <main className="flex-1 py-12 md:py-16">
          <Container size="lg">
            {children}
          </Container>
        </main>
      </div>
    </div>
  );
};
