import { useState, useEffect } from 'react';
import { Bell, X, CheckCircle, AlertCircle, Info, XCircle, ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './Button';

interface NotificationToastWithImageAndActionProps {
  title: string;
  message: string;
  imageUrl: string;
  onClose: () => void;
  onAction?: () => void;
  actionLabel?: string;
  duration?: number;
}

export const NotificationToastWithImageAndAction = ({ title, message, imageUrl, onClose, onAction, actionLabel = 'Ver', duration = 5000 }: NotificationToastWithImageAndActionProps) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

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
