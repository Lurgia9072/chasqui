import { useState, useEffect } from 'react';
import { Bell, X, CheckCircle, AlertCircle, Info, XCircle, LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface NotificationToastWithIconProps {
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  icon?: LucideIcon;
  onClose: () => void;
  duration?: number;
}

export const NotificationToastWithIcon = ({ title, message, type = 'info', icon: CustomIcon, onClose, duration = 5000 }: NotificationToastWithIconProps) => {
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

  const iconColors = {
    success: 'bg-green-50 text-green-600',
    error: 'bg-red-50 text-red-600',
    info: 'bg-blue-50 text-blue-600',
    warning: 'bg-yellow-50 text-yellow-600',
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
      <div className={cn('shrink-0 mt-0.5 rounded-xl p-2', iconColors[type])}>
        {CustomIcon ? <CustomIcon className="h-5 w-5" /> : icons[type]}
      </div>
      <div className="flex-1 space-y-1">
        <p className="text-sm font-bold text-gray-900">{title}</p>
        <p className="text-xs text-gray-500 leading-relaxed">{message}</p>
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
