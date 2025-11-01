import React, { useState, useEffect } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { 
  Bell, 
  Check, 
  Trash2, 
  Filter, 
  Search, 
  Calendar, 
  Pill, 
  Shield, 
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Settings
} from 'lucide-react';

const NotificationsPage = () => {
  const { 
    notifications, 
    unreadCount, 
    loading, 
    loadNotifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    createTestNotification,
    createSystemAnnouncement,
    getNotificationStats
  } = useNotifications();
  
  const [filters, setFilters] = useState({
    category: '',
    priority: '',
    isRead: '',
    search: ''
  });
  const [stats, setStats] = useState(null);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [testNotification, setTestNotification] = useState({ title: '', message: '' });
  const [announcement, setAnnouncement] = useState({ title: '', message: '', priority: 'medium' });

  useEffect(() => {
    loadNotifications({ limit: 50 });
    loadStats();
  }, []);

  useEffect(() => {
    loadNotifications({ 
      limit: 50,
      category: filters.category || undefined,
      priority: filters.priority || undefined,
      unreadOnly: filters.isRead === 'unread',
      search: filters.search || undefined
    });
  }, [filters]);

  const loadStats = async () => {
    const statsData = await getNotificationStats();
    if (statsData) {
      setStats(statsData);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    await markAsRead(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleDelete = async (notificationId) => {
    await deleteNotification(notificationId);
  };

  const handleCreateTest = async () => {
    if (testNotification.title && testNotification.message) {
      await createTestNotification(testNotification.title, testNotification.message);
      setTestNotification({ title: '', message: '' });
      setShowTestModal(false);
    }
  };

  const handleCreateAnnouncement = async () => {
    if (announcement.title && announcement.message) {
      await createSystemAnnouncement(announcement.title, announcement.message, announcement.priority);
      setAnnouncement({ title: '', message: '', priority: 'medium' });
      setShowAnnouncementModal(false);
    }
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
      case 'appointment': return <Calendar className="h-4 w-4" />;
      case 'prescription': return <Pill className="h-4 w-4" />;
      case 'system': return <Bell className="h-4 w-4" />;
      case 'security': return <Shield className="h-4 w-4" />;
      case 'reminder': return <Clock className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (isRead) => {
    return isRead ? 
      <CheckCircle className="h-4 w-4 text-green-500" /> : 
      <AlertCircle className="h-4 w-4 text-blue-500" />;
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffTime = Math.abs(now - new Date(date));
    const diffMinutes = Math.ceil(diffTime / (1000 * 60));
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffMinutes < 60) {
      return diffMinutes <= 1 ? 'Just now' : `${diffMinutes} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else {
      return `${diffDays} days ago`;
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      if (!notification.title.toLowerCase().includes(searchTerm) && 
          !notification.message.toLowerCase().includes(searchTerm)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Manage your notifications and stay updated
                </p>
              </div>
              <div className="flex items-center space-x-3">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="btn-secondary"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Mark All Read
                  </button>
                )}
                <button
                  onClick={() => setShowTestModal(true)}
                  className="btn-secondary"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Test Notification
                </button>
                <button
                  onClick={() => setShowAnnouncementModal(true)}
                  className="btn-primary"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Send Announcement
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100">
                  <Bell className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Notifications</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalNotifications}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-red-100">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Unread</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalUnread}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Read</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalNotifications - stats.totalUnread}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Period</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.period}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="input-field pl-10"
              />
            </div>
            
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="input-field"
            >
              <option value="">All Categories</option>
              <option value="appointment">Appointment</option>
              <option value="prescription">Prescription</option>
              <option value="system">System</option>
              <option value="security">Security</option>
              <option value="reminder">Reminder</option>
            </select>
            
            <select
              value={filters.priority}
              onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
              className="input-field"
            >
              <option value="">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            
            <select
              value={filters.isRead}
              onChange={(e) => setFilters(prev => ({ ...prev, isRead: e.target.value }))}
              className="input-field"
            >
              <option value="">All Status</option>
              <option value="unread">Unread Only</option>
              <option value="read">Read Only</option>
            </select>
            
            <button 
              onClick={() => setFilters({ category: '', priority: '', isRead: '', search: '' })}
              className="btn-secondary"
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Notifications ({filteredNotifications.length})
            </h3>
          </div>
          
          <div className="overflow-hidden">
            {loading ? (
              <div className="p-6 text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2">Loading notifications...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Bell className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p>No notifications found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-6 hover:bg-gray-50 transition-colors ${
                      !notification.isRead ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className={`p-2 rounded-full ${
                          !notification.isRead ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          {getCategoryIcon(notification.category)}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <h4 className={`text-sm font-medium ${
                              !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {notification.title}
                            </h4>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(notification.priority)}`}>
                              {notification.priority}
                            </span>
                            {getStatusIcon(notification.isRead)}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {!notification.isRead && (
                              <button
                                onClick={() => handleMarkAsRead(notification.id)}
                                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Mark read
                              </button>
                            )}
                            
                            <button
                              onClick={() => handleDelete(notification.id)}
                              className="text-sm text-red-600 hover:text-red-800 flex items-center"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </button>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-xs text-gray-500">
                            {formatTimeAgo(notification.createdAt)}
                          </span>
                          
                          {notification.actionRequired && notification.actionUrl && (
                            <a
                              href={notification.actionUrl}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                              {notification.actionText || 'View Details'} →
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Test Notification Modal */}
      {showTestModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create Test Notification</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={testNotification.title}
                    onChange={(e) => setTestNotification(prev => ({ ...prev, title: e.target.value }))}
                    className="input-field"
                    placeholder="Notification title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea
                    value={testNotification.message}
                    onChange={(e) => setTestNotification(prev => ({ ...prev, message: e.target.value }))}
                    className="input-field"
                    rows={3}
                    placeholder="Notification message"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowTestModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTest}
                  className="btn-primary"
                >
                  Create Test
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* System Announcement Modal */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Send System Announcement</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={announcement.title}
                    onChange={(e) => setAnnouncement(prev => ({ ...prev, title: e.target.value }))}
                    className="input-field"
                    placeholder="Announcement title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea
                    value={announcement.message}
                    onChange={(e) => setAnnouncement(prev => ({ ...prev, message: e.target.value }))}
                    className="input-field"
                    rows={3}
                    placeholder="Announcement message"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={announcement.priority}
                    onChange={(e) => setAnnouncement(prev => ({ ...prev, priority: e.target.value }))}
                    className="input-field"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAnnouncementModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateAnnouncement}
                  className="btn-primary"
                >
                  Send Announcement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
