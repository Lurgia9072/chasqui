import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { AnimatePresence } from 'motion/react';
import { NotificationToastWithAvatarAndUndo } from './NotificationToastWithAvatarAndUndo';

interface Notification {
  id: string;
  title: string;
  message: string;
  avatarName: string;
  avatarUrl?: string;
  duration?: number;
  onUndo: () => void;
}

interface NotificationContextType {
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProviderWithAvatarAndUndo = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications((prev) => [...prev, { ...notification, id }]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ addNotification, removeNotification }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[300] flex flex-col gap-4 pointer-events-none">
        <AnimatePresence>
          {notifications.map((n) => (
            <div key={n.id} className="pointer-events-auto">
              <NotificationToastWithAvatarAndUndo
                title={n.title}
                message={n.message}
                avatarName={n.avatarName}
                avatarUrl={n.avatarUrl}
                duration={n.duration}
                onUndo={n.onUndo}
                onClose={() => removeNotification(n.id)}
              />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotificationWithAvatarAndUndo = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationWithAvatarAndUndo must be used within a NotificationProviderWithAvatarAndUndo');
  }
  return context;
};
