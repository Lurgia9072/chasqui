import { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { Link, useLocation } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';

interface SidebarProps {
  items: {
    icon: LucideIcon;
    label: string;
    href: string;
  }[];
  className?: string;
}

export const Sidebar = ({ items, className }: SidebarProps) => {
  const location = useLocation();

  return (
    <nav className={cn('flex flex-col h-full py-8 px-4 space-y-2', className)}>
      {items.map((item) => {
        const isActive = location.pathname === item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              'flex items-center space-x-3 rounded-xl px-4 py-3 text-sm font-bold transition-all',
              isActive
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
            )}
          >
            <Icon className={cn('h-5 w-5', isActive ? 'text-white' : 'text-gray-400')} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};
