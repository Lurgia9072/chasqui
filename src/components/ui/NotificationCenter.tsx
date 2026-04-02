import { useState, useEffect } from 'react';
import { Bell, BellOff, X, CheckCircle, AlertCircle, Info, XCircle, Trash2, CheckCheck } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Badge } from './Badge';
import { Button } from './Button';
import { NotificationList } from './NotificationList';

export const NotificationCenter = () => {
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
    <Card className="overflow-hidden border-gray-200">
      <CardHeader className="bg-gray-50/50 border-b border-gray-100 flex flex-row items-center justify-between py-4">
        <div className="flex items-center space-x-3">
          <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
            <Bell className="h-5 w-5" />
          </div>
          <CardTitle className="text-lg font-bold text-gray-900">Notificaciones</CardTitle>
          {hasUnread && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              {notifications.filter((n) => !n.read).length} nuevas
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {notifications.length > 0 && (
            <>
              <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs font-bold text-blue-600 hover:bg-blue-50">
                <CheckCheck className="mr-2 h-4 w-4" />
                Marcar todas
              </Button>
              <Button variant="ghost" size="sm" onClick={clearAll} className="text-xs font-bold text-red-600 hover:bg-red-50">
                <Trash2 className="mr-2 h-4 w-4" />
                Limpiar
              </Button>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <NotificationList
          notifications={notifications}
          onRead={markAsRead}
          onRemove={removeNotification}
        />
      </CardContent>
    </Card>
  );
};
