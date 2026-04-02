import { useState, useEffect } from 'react';
import { Bell, X, CheckCircle, AlertCircle, Info, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { UserAvatar } from './UserAvatar';

interface NotificationToastWithAvatarProps {
  title: string;
  message: string;
  avatarName: string;
  avatarUrl?: string;
  onClose: () => void;
  duration?: number;
}

export const NotificationToastWithAvatar = ({ title, message, avatarName, avatarUrl, onClose, duration = 5000 }: NotificationToastWithAvatarProps) => {
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
      <div className="shrink-0 mt-0.5">
        <UserAvatar name={avatarName} src={avatarUrl} size="md" />
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
