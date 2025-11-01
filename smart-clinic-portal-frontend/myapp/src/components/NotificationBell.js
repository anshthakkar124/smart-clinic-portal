import React, { useState, useEffect } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { Bell, Check, Trash2, X } from 'lucide-react';

const NotificationBell = () => {
  const { 
    notifications, 
    unreadCount, 
    loading, 
    loadNotifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && notifications.length === 0) {
      loadNotifications({ limit: 10 });
    }
  }, [isOpen, notifications.length, loadNotifications]);

  const handleMarkAsRead = async (notificationId) => {
    setIsLoading(true);
    await markAsRead(notificationId);
    setIsLoading(false);
  };

  const handleMarkAllAsRead = async () => {
    setIsLoading(true);
    await markAllAsRead();
    setIsLoading(false);
  };

  const handleDelete = async (notificationId) => {
    setIsLoading(true);
    await deleteNotification(notificationId);
    setIsLoading(false);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-blue-600 bg-blue-100';
      case 'low': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'appointment': return '📅';
      case 'prescription': return '💊';
      case 'system': return '🔔';
      case 'security': return '🔒';
      case 'reminder': return '⏰';
      default: return '🔔';
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffTime = Math.abs(now - new Date(date));
    const diffMinutes = Math.ceil(diffTime / (1000 * 60));
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffMinutes < 60) {
      return diffMinutes <= 1 ? 'Just now' : `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return `${diffDays}d ago`;
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    disabled={isLoading}
                    className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2">Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <Bell className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                  <p>No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 transition-colors ${
                        !notification.isRead ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <span className="text-lg">
                            {getCategoryIcon(notification.category)}
                          </span>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={`text-sm font-medium ${
                              !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {notification.title}
                            </p>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(notification.priority)}`}>
                              {notification.priority}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500">
                              {formatTimeAgo(notification.createdAt)}
                            </span>
                            
                            <div className="flex items-center space-x-2">
                              {!notification.isRead && (
                                <button
                                  onClick={() => handleMarkAsRead(notification.id)}
                                  disabled={isLoading}
                                  className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50 flex items-center"
                                >
                                  <Check className="h-3 w-3 mr-1" />
                                  Mark read
                                </button>
                              )}
                              
                              <button
                                onClick={() => handleDelete(notification.id)}
                                disabled={isLoading}
                                className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50 flex items-center"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Delete
                              </button>
                            </div>
                          </div>
                          
                          {notification.actionRequired && notification.actionUrl && (
                            <div className="mt-2">
                              <a
                                href={notification.actionUrl}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                              >
                                {notification.actionText || 'View Details'} →
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-200 text-center">
                <a
                  href="/notifications"
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  View all notifications
                </a>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
