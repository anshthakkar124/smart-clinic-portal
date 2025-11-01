const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // System notifications might not have a sender
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  type: {
    type: String,
    enum: [
      'appointment_booked',
      'appointment_accepted',
      'appointment_rejected',
      'appointment_cancelled',
      'appointment_rescheduled',
      'appointment_reminder',
      'prescription_issued',
      'prescription_expiring',
      'check_in_completed',
      'system_announcement',
      'profile_updated',
      'password_changed'
    ],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  data: {
    // Additional data specific to the notification type
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    prescriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription' },
    checkInId: { type: mongoose.Schema.Types.ObjectId, ref: 'CheckIn' },
    // Generic data field for any additional information
    metadata: mongoose.Schema.Types.Mixed
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['appointment', 'prescription', 'system', 'security', 'reminder'],
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  isEmailSent: {
    type: Boolean,
    default: false
  },
  emailSentAt: {
    type: Date,
    default: null
  },
  isPushSent: {
    type: Boolean,
    default: false
  },
  pushSentAt: {
    type: Date,
    default: null
  },
  scheduledFor: {
    type: Date,
    default: null // For scheduled notifications (like reminders)
  },
  expiresAt: {
    type: Date,
    default: null // Notifications can expire
  },
  actionRequired: {
    type: Boolean,
    default: false
  },
  actionUrl: {
    type: String,
    default: null // URL to navigate to when notification is clicked
  },
  actionText: {
    type: String,
    default: null // Text for action button
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ organizationId: 1, createdAt: -1 });
NotificationSchema.index({ type: 1, createdAt: -1 });
NotificationSchema.index({ isRead: 1, createdAt: -1 });
NotificationSchema.index({ scheduledFor: 1 });
NotificationSchema.index({ expiresAt: 1 });

// Virtual for notification age
NotificationSchema.virtual('age').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.createdAt);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.ceil(diffTime / (1000 * 60));
      return diffMinutes <= 1 ? 'Just now' : `${diffMinutes} minutes ago`;
    }
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  }
  
  return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
});

// Method to mark as read
NotificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Method to mark email as sent
NotificationSchema.methods.markEmailSent = function() {
  this.isEmailSent = true;
  this.emailSentAt = new Date();
  return this.save();
};

// Method to mark push as sent
NotificationSchema.methods.markPushSent = function() {
  this.isPushSent = true;
  this.pushSentAt = new Date();
  return this.save();
};

// Static method to create notification
NotificationSchema.statics.createNotification = async function(notificationData) {
  const notification = new this(notificationData);
  await notification.save();
  return notification;
};

// Static method to get unread count for user
NotificationSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({
    recipient: userId,
    isRead: false,
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ]
  });
};

// Static method to get notifications for user
NotificationSchema.statics.getUserNotifications = async function(userId, options = {}) {
  const {
    limit = 20,
    skip = 0,
    unreadOnly = false,
    type = null,
    category = null
  } = options;

  const query = {
    recipient: userId,
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ]
  };

  if (unreadOnly) {
    query.isRead = false;
  }

  if (type) {
    query.type = type;
  }

  if (category) {
    query.category = category;
  }

  return await this.find(query)
    .populate('sender', 'name email')
    .populate('organizationId', 'name')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to mark all as read for user
NotificationSchema.statics.markAllAsRead = async function(userId) {
  return await this.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
};

// Static method to clean up expired notifications
NotificationSchema.statics.cleanupExpired = async function() {
  return await this.deleteMany({
    expiresAt: { $lt: new Date() }
  });
};

module.exports = mongoose.model('Notification', NotificationSchema);
