import { useState, useEffect } from 'react';
import { Bell, X, CheckCircle, AlertCircle, Info, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface NotificationToastSimpleProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
  duration?: number;
}

export const NotificationToastSimple = ({ message, type = 'info', onClose, duration = 3000 }: NotificationToastSimpleProps) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const icons = {
    success: <CheckCircle className="h-4 w-4 text-green-600" />,
    error: <XCircle className="h-4 w-4 text-red-600" />,
    info: <Info className="h-4 w-4 text-blue-600" />,
    warning: <AlertCircle className="h-4 w-4 text-yellow-600" />,
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
        'flex items-center gap-3 rounded-xl border px-4 py-3 shadow-xl min-w-[200px] max-w-sm',
        colors[type]
      )}
    >
      <div className="shrink-0">{icons[type]}</div>
      <p className="text-xs font-bold text-gray-900 flex-1">{message}</p>
      <button
        onClick={onClose}
        className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
      >
        <X className="h-3 w-3" />
      </button>
    </motion.div>
  );
};
