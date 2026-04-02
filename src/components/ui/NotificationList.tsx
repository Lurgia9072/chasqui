import { useState, useEffect } from 'react';
import { Bell, BellOff, X, CheckCircle, AlertCircle, Info, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent } from './Card';
import { Badge } from './Badge';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  time: string;
  read: boolean;
}

interface NotificationListProps {
  notifications: Notification[];
  onRead?: (id: string) => void;
  onRemove?: (id: string) => void;
  className?: string;
}

export const NotificationList = ({ notifications, onRead, onRemove, className }: NotificationListProps) => {
  const icons = {
    success: <CheckCircle className="h-5 w-5 text-green-600" />,
    error: <XCircle className="h-5 w-5 text-red-600" />,
    info: <Info className="h-5 w-5 text-blue-600" />,
    warning: <AlertCircle className="h-5 w-5 text-yellow-600" />,
  };

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 rounded-full bg-gray-50 p-4 text-gray-300">
          <BellOff className="h-10 w-10" />
        </div>
        <h3 className="mb-2 text-lg font-bold text-gray-900">No tienes notificaciones</h3>
        <p className="text-sm text-gray-500">Te avisaremos cuando haya algo nuevo para ti.</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <AnimatePresence initial={false}>
        {notifications.map((n) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className={cn(
              'group relative overflow-hidden rounded-2xl border p-5 transition-all hover:shadow-lg',
              n.read ? 'bg-white border-gray-100' : 'bg-blue-50/50 border-blue-100 ring-1 ring-blue-100'
            )}
            onClick={() => onRead?.(n.id)}
          >
            <div className="flex items-start space-x-4">
              <div className="shrink-0 mt-1">{icons[n.type]}</div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-gray-900">{n.title}</h4>
                  <span className="text-[10px] font-medium text-gray-400">{n.time}</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{n.message}</p>
              </div>
              {onRemove && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(n.id);
                  }}
                  className="rounded-full p-1 text-gray-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {!n.read && (
              <div className="absolute left-0 top-0 h-full w-1 bg-blue-600" />
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
