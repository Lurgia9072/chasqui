import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc, limit } from 'firebase/firestore';
import { Bell, Check, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuthStore } from '@/src/store/useAuthStore';
import { db } from '@/src/firebase';
import { Notification } from '@/src/types';
import { cn } from '@/src/lib/utils';

export const NotificationBell = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.leido).length;
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
      setNotifications(docs);
    });

    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { leido: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unread = notifications.filter(n => !n.leido);
      await Promise.all(unread.map(n => updateDoc(doc(db, 'notifications', n.id), { leido: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.leido) {
      await markAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={bellRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-full hover:bg-blue-50"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full ring-2 ring-white">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
          >
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h3 className="font-bold text-gray-900 text-sm">Notificaciones</h3>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="text-[10px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-wider"
                >
                  Marcar todo como leído
                </button>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <Bell className="h-8 w-8 text-gray-200 mx-auto" />
                  <p className="text-xs text-gray-500 italic">No tienes notificaciones</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {notifications.map((notification) => (
                    <div 
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={cn(
                        "p-4 transition-all relative group cursor-pointer border-l-4",
                        !notification.leido 
                          ? "bg-blue-50/50 border-blue-500" 
                          : "hover:bg-gray-50 border-transparent"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center justify-between">
                            <p className={cn(
                              "text-sm leading-tight",
                              !notification.leido ? "font-bold text-gray-900" : "text-gray-600"
                            )}>
                              {notification.titulo}
                            </p>
                            {!notification.leido && (
                              <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                            {notification.mensaje}
                          </p>
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] text-gray-400 font-medium">
                              {formatDistanceToNow(notification.createdAt, { addSuffix: true, locale: es })}
                            </span>
                            {notification.link && (
                              <span className="text-[10px] font-bold text-blue-600 flex items-center group-hover:translate-x-1 transition-transform">
                                Ver detalles <ChevronRight className="h-3 w-3 ml-0.5" />
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
