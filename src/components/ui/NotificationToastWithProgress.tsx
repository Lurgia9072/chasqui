import { useState, useEffect } from 'react';
import { Bell, X, CheckCircle, AlertCircle, Info, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface NotificationToastWithProgressProps {
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
  duration?: number;
}

export const NotificationToastWithProgress = ({ title, message, type = 'info', onClose, duration = 5000 }: NotificationToastWithProgressProps) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining === 0) {
        clearInterval(interval);
        onClose();
      }
    }, 10);

    return () => clearInterval(interval);
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

  const progressColors = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-blue-600',
    warning: 'bg-yellow-600',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      className={cn(
        'relative flex items-start gap-4 rounded-2xl border p-5 shadow-2xl min-w-[320px] max-w-md overflow-hidden',
        colors[type]
      )}
    >
      <div className="shrink-0 mt-0.5">{icons[type]}</div>
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
      <div className="absolute bottom-0 left-0 h-1 w-full bg-gray-100">
        <motion.div
          className={cn('h-full', progressColors[type])}
          style={{ width: `${progress}%` }}
          transition={{ type: 'tween', ease: 'linear' }}
        />
      </div>
    </motion.div>
  );
};
