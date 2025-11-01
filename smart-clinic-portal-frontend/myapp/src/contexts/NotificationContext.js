import React, { createContext, useReducer, useContext, useEffect } from 'react';
import { io } from 'socket.io-client';
import { notificationsAPI } from '../services/api';
import toast from 'react-hot-toast';

const NotificationContext = createContext();

const initialState = {
  notifications: [],
  unreadCount: 0,
  loading: true,
  error: null,
  socket: null,
  connected: false
};

const notificationReducer = (state, action) => {
  switch (action.type) {
    case 'NOTIFICATIONS_LOADING':
      return {
        ...state,
        loading: true,
        error: null
      };
    case 'NOTIFICATIONS_LOADED':
      return {
        ...state,
        notifications: action.payload.notifications,
        unreadCount: action.payload.unreadCount,
        loading: false,
        error: null
      };
    case 'NOTIFICATION_RECEIVED':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        unreadCount: state.unreadCount + 1
      };
    case 'NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map(notif =>
          notif.id === action.payload ? { ...notif, isRead: true } : notif
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      };
    case 'ALL_NOTIFICATIONS_READ':
      return {
        ...state,
        notifications: state.notifications.map(notif => ({ ...notif, isRead: true })),
        unreadCount: 0
      };
    case 'NOTIFICATION_DELETED':
      return {
        ...state,
        notifications: state.notifications.filter(notif => notif.id !== action.payload),
        unreadCount: Math.max(0, state.unreadCount - 1)
      };
    case 'SOCKET_CONNECTED':
      return {
        ...state,
        connected: true
      };
    case 'SOCKET_DISCONNECTED':
      return {
        ...state,
        connected: false
      };
    case 'UNREAD_COUNT_UPDATED':
      return {
        ...state,
        unreadCount: action.payload
      };
    case 'NOTIFICATION_ERROR':
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    default:
      return state;
  }
};

export const NotificationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  // Initialize Socket.IO connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      auth: {
        token: token
      }
    });

    socket.on('connect', () => {
      console.log('Connected to notification server');
      dispatch({ type: 'SOCKET_CONNECTED' });
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from notification server');
      dispatch({ type: 'SOCKET_DISCONNECTED' });
    });

    socket.on('notification', (notification) => {
      console.log('Received notification:', notification);
      dispatch({ type: 'NOTIFICATION_RECEIVED', payload: notification });
      
      // Show toast notification
      toast.success(notification.title, {
        description: notification.message,
        duration: 5000,
        action: notification.actionRequired ? {
          label: notification.actionText || 'View',
          onClick: () => {
            if (notification.actionUrl) {
              window.location.href = notification.actionUrl;
            }
          }
        } : undefined
      });
    });

    socket.on('unreadCount', (count) => {
      dispatch({ type: 'UNREAD_COUNT_UPDATED', payload: count });
    });

    dispatch({ type: 'NOTIFICATIONS_LOADING' });

    // Join user room
    const userId = JSON.parse(atob(token.split('.')[1])).userId;
    socket.emit('join-user-room', userId);

    return () => {
      socket.disconnect();
    };
  }, []);

  // Load notifications
  const loadNotifications = async (options = {}) => {
    try {
      dispatch({ type: 'NOTIFICATIONS_LOADING' });
      
      const [notificationsRes, unreadCountRes] = await Promise.all([
        notificationsAPI.getAll(options),
        notificationsAPI.getUnreadCount()
      ]);

      dispatch({
        type: 'NOTIFICATIONS_LOADED',
        payload: {
          notifications: notificationsRes.data.notifications,
          unreadCount: unreadCountRes.data.unreadCount
        }
      });
    } catch (error) {
      console.error('Error loading notifications:', error);
      dispatch({ type: 'NOTIFICATION_ERROR', payload: error.message });
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await notificationsAPI.markAsRead(notificationId);
      dispatch({ type: 'NOTIFICATION_READ', payload: notificationId });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      dispatch({ type: 'ALL_NOTIFICATIONS_READ' });
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      await notificationsAPI.delete(notificationId);
      dispatch({ type: 'NOTIFICATION_DELETED', payload: notificationId });
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  // Create test notification (for development)
  const createTestNotification = async (title, message) => {
    try {
      await notificationsAPI.createTest({ title, message });
      toast.success('Test notification created');
    } catch (error) {
      console.error('Error creating test notification:', error);
      toast.error('Failed to create test notification');
    }
  };

  // Create system announcement (for admin/superadmin)
  const createSystemAnnouncement = async (title, message, priority = 'medium') => {
    try {
      await notificationsAPI.createSystemAnnouncement({ title, message, priority });
      toast.success('System announcement sent');
    } catch (error) {
      console.error('Error creating system announcement:', error);
      toast.error('Failed to send system announcement');
    }
  };

  // Get notification statistics (for admin/superadmin)
  const getNotificationStats = async () => {
    try {
      const response = await notificationsAPI.getStats();
      return response.data;
    } catch (error) {
      console.error('Error fetching notification stats:', error);
      toast.error('Failed to fetch notification statistics');
      return null;
    }
  };

  return (
    <NotificationContext.Provider value={{
      ...state,
      loadNotifications,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      createTestNotification,
      createSystemAnnouncement,
      getNotificationStats
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
