import { Bell, BellOff, X, CheckCircle, AlertCircle, Info, XCircle, Trash2, CheckCheck } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../lib/utils';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from './DropdownMenu';
import { Badge } from './Badge';
import { Button } from './Button';
import { NotificationList } from './NotificationList';

export const NotificationBellWithDropdown = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const hasUnread = notifications.some((n) => !n.read);

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const markAsRead = (id: string) => {
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const removeNotification = (id: string) => {
    setNotifications(notifications.filter((n) => n.id !== id));
  };

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
      <DropdownMenuContent align="end" className="w-96 p-0 overflow-hidden">
        <div className="bg-gray-50/50 border-b border-gray-100 flex flex-row items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
              <Bell className="h-5 w-5" />
            </div>
            <span className="text-sm font-bold text-gray-900">Notificaciones</span>
            {hasUnread && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                {notifications.filter((n) => !n.read).length}
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {notifications.length > 0 && (
              <>
                <button
                  onClick={markAllAsRead}
                  className="rounded-full p-1.5 text-blue-600 hover:bg-blue-50 transition-colors"
                  title="Marcar todas como leídas"
                >
                  <CheckCheck className="h-4 w-4" />
                </button>
                <button
                  onClick={clearAll}
                  className="rounded-full p-1.5 text-red-600 hover:bg-red-50 transition-colors"
                  title="Limpiar todas"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>
        <div className="max-h-[400px] overflow-y-auto p-4">
          <NotificationList
            notifications={notifications}
            onRead={markAsRead}
            onRemove={removeNotification}
          />
        </div>
        <div className="bg-gray-50/50 border-t border-gray-100 p-3 text-center">
          <Button variant="ghost" size="sm" className="w-full text-xs font-bold text-blue-600 hover:bg-blue-50">
            Ver todas las notificaciones
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
