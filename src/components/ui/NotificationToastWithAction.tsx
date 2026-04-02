import { useState, useEffect } from 'react';
import { Bell, X, CheckCircle, AlertCircle, Info, XCircle, ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './Button';

interface NotificationToastWithActionProps {
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
  onAction?: () => void;
  actionLabel?: string;
  duration?: number;
}

export const NotificationToastWithAction = ({ title, message, type = 'info', onClose, onAction, actionLabel = 'Ver', duration = 5000 }: NotificationToastWithActionProps) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-green-600" />,
    error: <XCircle className="h-5 w-5 text-red-600" />,
    info: <Info className="h-5 w-5 text-blue-600" />,
    warning: <AlertCircle className="h-5 w-5 text-yellow-600" />,
  };

  const colors = {
    success: 'border-green-100 bg-white text-green-900',
    error: 'border-red-100 bg-white text-red-900',
    info: 'border-blue-100 bg-white text-blue-900',
    warning: 'border-yellow-100 bg-white text-yellow-900',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className={cn(
        'flex items-start gap-4 rounded-2xl border p-5 shadow-2xl min-w-[320px] max-w-md',
        colors[type]
      )}
    >
      <div className="shrink-0 mt-0.5">{icons[type]}</div>
      <div className="flex-1 space-y-3">
        <div className="space-y-1">
          <p className="text-sm font-bold text-gray-900">{title}</p>
          <p className="text-xs text-gray-500 leading-relaxed">{message}</p>
        </div>
        {onAction && (
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onAction();
            }}
            className="h-8 px-3 text-xs font-bold text-blue-600 hover:bg-blue-50"
          >
            {actionLabel}
            <ArrowRight className="ml-2 h-3 w-3" />
          </Button>
        )}
      </div>
      <button
        onClick={onClose}
        className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
};
