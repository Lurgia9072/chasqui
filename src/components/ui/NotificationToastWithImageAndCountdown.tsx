import { useState, useEffect } from 'react';
import { Bell, X, CheckCircle, AlertCircle, Info, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface NotificationToastWithImageAndCountdownProps {
  title: string;
  message: string;
  imageUrl: string;
  onClose: () => void;
  duration?: number;
}

export const NotificationToastWithImageAndCountdown = ({ title, message, imageUrl, onClose, duration = 5000 }: NotificationToastWithImageAndCountdownProps) => {
  const [seconds, setSeconds] = useState(Math.ceil(duration / 1000));

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="flex items-start gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-2xl min-w-[320px] max-w-md"
    >
      <div className="shrink-0 mt-0.5 h-12 w-12 overflow-hidden rounded-xl bg-gray-100">
        <img
          src={imageUrl}
          alt={title}
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-gray-900">{title}</p>
          <span className="text-[10px] font-bold text-gray-400">
            {seconds}s
          </span>
        </div>
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
