import React, { createContext, useContext, useState, ReactNode } from 'react';

type Notification = {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
};

type NotificationContextType = {
  notify: (notification: Notification) => void;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within NotificationProvider');
  return context;
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notification, setNotification] = useState<Notification | null>(null);

  const notify = (notification: Notification) => {
    setNotification(notification);
    setTimeout(() => setNotification(null), 4000); // Auto-hide after 4s
  };

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      {notification && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 9999,
            background: '#fff',
            border: '1px solid #ccc',
            borderRadius: 8,
            padding: '16px 24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            color:
              notification.type === 'error'
                ? '#d32f2f'
                : notification.type === 'success'
                ? '#388e3c'
                : '#333',
          }}
        >
          {notification.message}
        </div>
      )}
    </NotificationContext.Provider>
  );
}; 