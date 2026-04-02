import { Bell, BellOff } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../lib/utils';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from './DropdownMenu';
import { Badge } from './Badge';

export const NotificationBell = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const hasUnread = notifications.length > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <div className="relative rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900">
          <Bell className="h-5 w-5" />
          {hasUnread && (
            <span className="absolute right-1.5 top-1.5 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500"></span>
            </span>
          )}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificaciones</span>
          {hasUnread && <Badge variant="secondary">{notifications.length}</Badge>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-[300px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <BellOff className="mb-2 h-8 w-8 text-gray-300" />
              <p className="text-sm text-gray-500">No tienes notificaciones</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div key={n.id}>
                <DropdownMenuItem className="cursor-pointer p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-gray-900">{n.title}</p>
                    <p className="text-xs text-gray-500">{n.message}</p>
                    <p className="text-[10px] text-gray-400">{n.time}</p>
                  </div>
                </DropdownMenuItem>
              </div>
            ))
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="justify-center text-xs font-medium text-blue-600 hover:bg-blue-50">
          Ver todas las notificaciones
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
