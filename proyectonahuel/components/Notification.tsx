'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';

// Tipos de notificación
export type NotificationType = 'success' | 'error' | 'info';

// Interfaz para la notificación
export interface NotificationItem {
  message: string;
  type: NotificationType;
  id: number;
}

// Contexto para las notificaciones globales
interface NotificationContextType {
  notifications: NotificationItem[];
  showNotification: (message: string, type?: NotificationType) => void;
  dismissNotification: (id: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Hook personalizado para usar el contexto
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications debe usarse dentro de un NotificationProvider');
  }
  return context;
};

// Proveedor de notificaciones
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Función para mostrar notificaciones
  const showNotification = (message: string, type: NotificationType = 'success') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { message, type, id }]);
    
    // Auto eliminar después de 5 segundos
    setTimeout(() => {
      setNotifications(notifications => notifications.filter(n => n.id !== id));
    }, 5000);
  };

  // Función para eliminar una notificación
  const dismissNotification = (id: number) => {
    setNotifications(notifications => notifications.filter(n => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ notifications, showNotification, dismissNotification }}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
};

// Componente de contenedor de notificaciones
const NotificationContainer: React.FC = () => {
  const { notifications, dismissNotification } = useNotifications();
  
  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-md">
      {notifications.map(notification => (
        <div 
          key={notification.id}
          className={`rounded-lg p-4 shadow-lg flex items-start justify-between notification ${
            notification.type === 'success' 
            ? 'bg-[var(--success)] text-white' 
            : notification.type === 'error' 
            ? 'bg-red-600 text-white' 
            : 'bg-[var(--primary)] text-white'
          } transition-all duration-300 ease-in-out transform animate-fadeIn`}
          style={{ 
            opacity: 0.95,
            backdropFilter: 'blur(10px)',
            borderRadius: '8px',
            border: notification.type === 'success' 
                   ? '1px solid rgba(5, 150, 105, 0.5)' 
                   : notification.type === 'error'
                   ? '1px solid rgba(220, 38, 38, 0.5)'
                   : '1px solid rgba(30, 58, 138, 0.5)'
          }}
        >
          <div className="flex items-center">
            {notification.type === 'success' && (
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white bg-opacity-25 mr-3">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            {notification.type === 'error' && (
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white bg-opacity-25 mr-3">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            )}
            {notification.type === 'info' && (
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white bg-opacity-25 mr-3">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            )}
            <p className="font-medium">{notification.message}</p>
          </div>
          <button 
            onClick={() => dismissNotification(notification.id)}
            className="ml-4 text-white hover:text-gray-200 transition-colors"
            aria-label="Cerrar notificación"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
};

export default NotificationProvider; 