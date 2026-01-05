import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [vehicleLocations, setVehicleLocations] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState([]); // Toastlar
  const processedNotificationIds = useRef(new Set());

  // Initialize Socket
  useEffect(() => {
    const socketInstance = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      console.log('🔌 Socket.io bağlandı:', socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ Socket.io bağlantısı koptu');
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('⚠️ Socket.io bağlantı hatası:', error);
      setIsConnected(false);
    });

    socketInstance.on('vehicle:location:update', (data) => {
      setVehicleLocations((prev) => ({
        ...prev,
        [data.vehicleId]: {
          lat: data.lat,
          lng: data.lng,
          speed: data.speed,
          heading: data.heading,
          updatedAt: new Date(),
        },
      }));
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // Toast Helper
  const addToast = useCallback((title, message, type = 'INFO') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [{ id, title, message, type }, ...prev]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Notification Handler
  useEffect(() => {
    if (!socket) return;

    const handleNotification = (data) => {
      console.log('🔔 Yeni Bildirim:', data);
      
      setNotifications(prev => {
          // 1. ID Check
          if (processedNotificationIds.current.has(data.id) || prev.some(n => n.id === data.id)) {
              processedNotificationIds.current.add(data.id);
              return prev;
          }

          // 2. Content & Time Check (Agresif dedup)
          const isDuplicateContent = prev.some(n => 
              n.title === data.title &&
              n.message === data.message &&
              Math.abs(new Date(data.createdAt).getTime() - new Date(n.createdAt).getTime()) < 2000
          );

          if (isDuplicateContent) {
              processedNotificationIds.current.add(data.id);
              return prev;
          }

          // Valid New Notification
          processedNotificationIds.current.add(data.id);
          setUnreadCount(c => c + 1); // Callback içinde güvenli update
          addToast(data.title, data.message, data.type);
          
          return [data, ...prev];
      });
    };

    socket.on('notification:new', handleNotification);

    if (user?.id) {
        socket.on(`notification:user:${user.id}`, handleNotification);
    }

    return () => {
        socket.off('notification:new');
        if (user?.id) {
            socket.off(`notification:user:${user.id}`);
        }
    };
  }, [socket, user, addToast]);

  const sendVehicleLocation = useCallback((vehicleId, lat, lng, speed = 0, heading = 0) => {
    if (socket && isConnected) {
      socket.emit('vehicle:location', {
        vehicleId,
        lat,
        lng,
        speed,
        heading,
      });
    }
  }, [socket, isConnected]);

  const sendNotification = useCallback((notification) => {
    if (socket && isConnected) {
      socket.emit('notification:new', notification);
    }
  }, [socket, isConnected]);

  const value = {
    socket,
    isConnected,
    vehicleLocations,
    notifications,
    unreadCount,
    setUnreadCount,
    setNotifications,
    toasts,
    removeToast,
    addToast,
    sendVehicleLocation,
    sendNotification,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

export default SocketContext;
