const express = require('express');
const router = express.Router();
const { auth, multiTenant } = require('../middleware/auth');
const Notification = require('../models/Notification');
const notificationService = require('../services/NotificationService');

// @route   GET /api/notifications
// @desc    Get user notifications
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const {
      limit = 20,
      skip = 0,
      unreadOnly = false,
      type = null,
      category = null
    } = req.query;

    const notifications = await notificationService.getUserNotifications(req.user.userId, {
      limit: parseInt(limit),
      skip: parseInt(skip),
      unreadOnly: unreadOnly === 'true',
      type,
      category
    });

    res.json({
      notifications,
      count: notifications.length,
      hasMore: notifications.length === parseInt(limit)
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/notifications/unread-count
// @desc    Get unread notification count
// @access  Private
router.get('/unread-count', auth, async (req, res) => {
  try {
    const unreadCount = await notificationService.getUnreadCount(req.user.userId);
    res.json({ unreadCount });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', auth, async (req, res) => {
  try {
    const notification = await notificationService.markAsRead(req.params.id, req.user.userId);
    res.json({ message: 'Notification marked as read', notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    if (error.message === 'Notification not found') {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/notifications/mark-all-read
// @desc    Mark all notifications as read
// @access  Private
router.put('/mark-all-read', auth, async (req, res) => {
  try {
    await notificationService.markAllAsRead(req.user.userId);
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/notifications/:id
// @desc    Delete notification
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user.userId
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Send updated unread count
    if (notificationService.io) {
      notificationService.sendUnreadCountUpdate(req.user.userId);
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/notifications/test
// @desc    Create test notification (for development)
// @access  Private (Admin/SuperAdmin only)
router.post('/test', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { title, message, type = 'system_announcement', priority = 'medium' } = req.body;

    const notification = await notificationService.createNotification({
      recipient: req.user.userId,
      organizationId: req.userData.organizationId?._id,
      type: type,
      title: title || 'Test Notification',
      message: message || 'This is a test notification',
      priority: priority,
      category: 'system',
      actionRequired: false
    });

    res.json({ message: 'Test notification created', notification });
  } catch (error) {
    console.error('Error creating test notification:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/notifications/system-announcement
// @desc    Create system announcement
// @access  Private (Admin/SuperAdmin only)
router.post('/system-announcement', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { title, message, priority = 'medium' } = req.body;

    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }

    const organizationId = req.user.role === 'superadmin' 
      ? req.body.organizationId 
      : req.userData.organizationId._id;

    if (!organizationId) {
      return res.status(400).json({ message: 'Organization ID is required' });
    }

    await notificationService.notifySystemAnnouncement(organizationId, title, message, priority);

    res.json({ message: 'System announcement sent successfully' });
  } catch (error) {
    console.error('Error creating system announcement:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/notifications/stats
// @desc    Get notification statistics
// @access  Private (Admin/SuperAdmin only)
router.get('/stats', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const organizationId = req.user.role === 'superadmin' 
      ? req.query.organizationId 
      : req.userData.organizationId._id;

    const stats = await Notification.aggregate([
      {
        $match: {
          organizationId: organizationId,
          createdAt: {
            $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          unreadCount: {
            $sum: { $cond: ['$isRead', 0, 1] }
          }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const totalNotifications = await Notification.countDocuments({
      organizationId: organizationId,
      createdAt: {
        $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      }
    });

    const totalUnread = await Notification.countDocuments({
      organizationId: organizationId,
      isRead: false,
      createdAt: {
        $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      }
    });

    res.json({
      stats,
      totalNotifications,
      totalUnread,
      period: '30 days'
    });
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
