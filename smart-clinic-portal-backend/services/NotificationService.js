const Notification = require('../models/Notification');
const User = require('../models/User');
const Organization = require('../models/Organization');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');

class NotificationService {
  constructor() {
    this.io = null; // Will be set when Socket.IO is initialized
  }

  // Set Socket.IO instance
  setSocketIO(io) {
    this.io = io;
  }

  // Create and send notification
  async createNotification(notificationData) {
    try {
      const notification = await Notification.createNotification(notificationData);
      
      // Send real-time notification if Socket.IO is available
      if (this.io) {
        this.sendRealtimeNotification(notification);
      }

      // Send email notification for high priority items
      if (notification.priority === 'high' || notification.priority === 'urgent') {
        this.sendEmailNotification(notification);
      }

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Send real-time notification via Socket.IO
  sendRealtimeNotification(notification) {
    if (!this.io) return;

    // Send to specific user
    this.io.to(notification.recipient.toString()).emit('notification', {
      id: notification._id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      priority: notification.priority,
      category: notification.category,
      actionRequired: notification.actionRequired,
      actionUrl: notification.actionUrl,
      actionText: notification.actionText,
      createdAt: notification.createdAt,
      data: notification.data
    });

    // Send unread count update
    this.sendUnreadCountUpdate(notification.recipient);
  }

  // Send unread count update
  async sendUnreadCountUpdate(userId) {
    if (!this.io) return;

    const unreadCount = await Notification.getUnreadCount(userId);
    this.io.to(userId.toString()).emit('unreadCount', unreadCount);
  }

  // Send email notification (placeholder - would integrate with email service)
  async sendEmailNotification(notification) {
    try {
      // This would integrate with your email service (SendGrid, AWS SES, etc.)
      console.log(`Email notification sent: ${notification.title} to user ${notification.recipient}`);
      
      // Mark email as sent
      await notification.markEmailSent();
    } catch (error) {
      console.error('Error sending email notification:', error);
    }
  }

  // Appointment-related notifications
  async notifyAppointmentBooked(appointment) {
    const patient = await User.findById(appointment.patient);
    const doctor = await User.findById(appointment.doctor);
    const organization = await Organization.findById(appointment.organizationId);

    // Notify doctor
    await this.createNotification({
      recipient: appointment.doctor,
      organizationId: appointment.organizationId,
      type: 'appointment_booked',
      title: 'New Appointment Booked',
      message: `${patient.name} has booked an appointment for ${new Date(appointment.date).toLocaleDateString()} at ${appointment.startTime}`,
      data: {
        appointmentId: appointment._id,
        metadata: {
          patientName: patient.name,
          appointmentDate: appointment.date,
          appointmentTime: appointment.startTime
        }
      },
      priority: 'medium',
      category: 'appointment',
      actionRequired: true,
      actionUrl: `/appointment-management`,
      actionText: 'Review Appointment'
    });

    // Notify patient
    await this.createNotification({
      recipient: appointment.patient,
      organizationId: appointment.organizationId,
      type: 'appointment_booked',
      title: 'Appointment Booked Successfully',
      message: `Your appointment with Dr. ${doctor.name} at ${organization.name} has been booked for ${new Date(appointment.date).toLocaleDateString()} at ${appointment.startTime}`,
      data: {
        appointmentId: appointment._id,
        metadata: {
          doctorName: doctor.name,
          organizationName: organization.name,
          appointmentDate: appointment.date,
          appointmentTime: appointment.startTime
        }
      },
      priority: 'medium',
      category: 'appointment',
      actionRequired: false,
      actionUrl: `/appointments/${appointment._id}`,
      actionText: 'View Appointment'
    });
  }

  async notifyAppointmentAccepted(appointment) {
    const patient = await User.findById(appointment.patient);
    const doctor = await User.findById(appointment.doctor);
    const organization = await Organization.findById(appointment.organizationId);

    await this.createNotification({
      recipient: appointment.patient,
      organizationId: appointment.organizationId,
      type: 'appointment_accepted',
      title: 'Appointment Confirmed',
      message: `Your appointment with Dr. ${doctor.name} at ${organization.name} has been confirmed for ${new Date(appointment.date).toLocaleDateString()} at ${appointment.startTime}`,
      data: {
        appointmentId: appointment._id,
        metadata: {
          doctorName: doctor.name,
          organizationName: organization.name,
          appointmentDate: appointment.date,
          appointmentTime: appointment.startTime
        }
      },
      priority: 'high',
      category: 'appointment',
      actionRequired: false,
      actionUrl: `/appointments/${appointment._id}`,
      actionText: 'View Appointment'
    });
  }

  async notifyAppointmentRejected(appointment, reason) {
    const patient = await User.findById(appointment.patient);
    const doctor = await User.findById(appointment.doctor);
    const organization = await Organization.findById(appointment.organizationId);

    await this.createNotification({
      recipient: appointment.patient,
      organizationId: appointment.organizationId,
      type: 'appointment_rejected',
      title: 'Appointment Not Available',
      message: `Your appointment with Dr. ${doctor.name} at ${organization.name} could not be confirmed. Reason: ${reason}`,
      data: {
        appointmentId: appointment._id,
        metadata: {
          doctorName: doctor.name,
          organizationName: organization.name,
          appointmentDate: appointment.date,
          appointmentTime: appointment.startTime,
          reason: reason
        }
      },
      priority: 'high',
      category: 'appointment',
      actionRequired: true,
      actionUrl: `/book-appointment`,
      actionText: 'Book New Appointment'
    });
  }

  async notifyAppointmentCancelled(appointment, cancelledBy) {
    const patient = await User.findById(appointment.patient);
    const doctor = await User.findById(appointment.doctor);
    const organization = await Organization.findById(appointment.organizationId);

    // Notify the other party
    const recipient = cancelledBy === appointment.patient ? appointment.doctor : appointment.patient;
    const cancelledByName = cancelledBy === appointment.patient ? patient.name : doctor.name;

    await this.createNotification({
      recipient: recipient,
      organizationId: appointment.organizationId,
      type: 'appointment_cancelled',
      title: 'Appointment Cancelled',
      message: `${cancelledByName} has cancelled the appointment scheduled for ${new Date(appointment.date).toLocaleDateString()} at ${appointment.startTime}`,
      data: {
        appointmentId: appointment._id,
        metadata: {
          cancelledByName: cancelledByName,
          appointmentDate: appointment.date,
          appointmentTime: appointment.startTime
        }
      },
      priority: 'medium',
      category: 'appointment',
      actionRequired: false,
      actionUrl: `/appointments/${appointment._id}`,
      actionText: 'View Details'
    });
  }

  async notifyAppointmentReminder(appointment) {
    const patient = await User.findById(appointment.patient);
    const doctor = await User.findById(appointment.doctor);
    const organization = await Organization.findById(appointment.organizationId);

    // Notify patient
    await this.createNotification({
      recipient: appointment.patient,
      organizationId: appointment.organizationId,
      type: 'appointment_reminder',
      title: 'Appointment Reminder',
      message: `You have an appointment with Dr. ${doctor.name} at ${organization.name} tomorrow at ${appointment.startTime}`,
      data: {
        appointmentId: appointment._id,
        metadata: {
          doctorName: doctor.name,
          organizationName: organization.name,
          appointmentDate: appointment.date,
          appointmentTime: appointment.startTime
        }
      },
      priority: 'medium',
      category: 'reminder',
      actionRequired: false,
      actionUrl: `/appointments/${appointment._id}`,
      actionText: 'View Appointment'
    });

    // Notify doctor
    await this.createNotification({
      recipient: appointment.doctor,
      organizationId: appointment.organizationId,
      type: 'appointment_reminder',
      title: 'Appointment Reminder',
      message: `You have an appointment with ${patient.name} tomorrow at ${appointment.startTime}`,
      data: {
        appointmentId: appointment._id,
        metadata: {
          patientName: patient.name,
          appointmentDate: appointment.date,
          appointmentTime: appointment.startTime
        }
      },
      priority: 'medium',
      category: 'reminder',
      actionRequired: false,
      actionUrl: `/appointments/${appointment._id}`,
      actionText: 'View Appointment'
    });
  }

  // Prescription-related notifications
  async notifyPrescriptionIssued(prescription) {
    const patient = await User.findById(prescription.patientId);
    const doctor = await User.findById(prescription.doctorId);
    const organization = await Organization.findById(prescription.organizationId);

    await this.createNotification({
      recipient: prescription.patientId,
      organizationId: prescription.organizationId,
      type: 'prescription_issued',
      title: 'New Prescription Available',
      message: `Dr. ${doctor.name} has issued a new prescription for you. It contains ${prescription.medications.length} medication(s) and expires on ${new Date(prescription.expiryDate).toLocaleDateString()}`,
      data: {
        prescriptionId: prescription._id,
        metadata: {
          doctorName: doctor.name,
          organizationName: organization.name,
          medicationCount: prescription.medications.length,
          expiryDate: prescription.expiryDate
        }
      },
      priority: 'high',
      category: 'prescription',
      actionRequired: false,
      actionUrl: `/my-prescriptions`,
      actionText: 'View Prescription'
    });
  }

  async notifyPrescriptionExpiring(prescription) {
    const patient = await User.findById(prescription.patientId);
    const doctor = await User.findById(prescription.doctorId);
    const organization = await Organization.findById(prescription.organizationId);

    await this.createNotification({
      recipient: prescription.patientId,
      organizationId: prescription.organizationId,
      type: 'prescription_expiring',
      title: 'Prescription Expiring Soon',
      message: `Your prescription from Dr. ${doctor.name} expires in 3 days. Please refill if needed.`,
      data: {
        prescriptionId: prescription._id,
        metadata: {
          doctorName: doctor.name,
          organizationName: organization.name,
          expiryDate: prescription.expiryDate
        }
      },
      priority: 'high',
      category: 'prescription',
      actionRequired: true,
      actionUrl: `/my-prescriptions`,
      actionText: 'View Prescription'
    });
  }

  // System notifications
  async notifySystemAnnouncement(organizationId, title, message, priority = 'medium') {
    // Get all users in the organization
    const users = await User.find({ 
      organizationId: organizationId,
      isActive: true 
    });

    // Create notifications for all users
    const notifications = users.map(user => ({
      recipient: user._id,
      organizationId: organizationId,
      type: 'system_announcement',
      title: title,
      message: message,
      priority: priority,
      category: 'system',
      actionRequired: false
    }));

    // Create all notifications
    await Notification.insertMany(notifications);

    // Send real-time notifications
    if (this.io) {
      users.forEach(user => {
        this.io.to(user._id.toString()).emit('notification', {
          type: 'system_announcement',
          title: title,
          message: message,
          priority: priority,
          category: 'system',
          createdAt: new Date()
        });
      });
    }
  }

  // Get notifications for user
  async getUserNotifications(userId, options = {}) {
    return await Notification.getUserNotifications(userId, options);
  }

  // Get unread count for user
  async getUnreadCount(userId) {
    return await Notification.getUnreadCount(userId);
  }

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: userId
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    await notification.markAsRead();
    
    // Send updated unread count
    if (this.io) {
      this.sendUnreadCountUpdate(userId);
    }

    return notification;
  }

  // Mark all notifications as read for user
  async markAllAsRead(userId) {
    await Notification.markAllAsRead(userId);
    
    // Send updated unread count
    if (this.io) {
      this.sendUnreadCountUpdate(userId);
    }
  }

  // Clean up expired notifications
  async cleanupExpired() {
    return await Notification.cleanupExpired();
  }

  // Schedule appointment reminders (to be called by a cron job)
  async scheduleAppointmentReminders() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    // Find appointments for tomorrow
    const appointments = await Appointment.find({
      date: {
        $gte: tomorrow,
        $lt: dayAfterTomorrow
      },
      status: { $in: ['scheduled', 'confirmed'] }
    }).populate('patient doctor organizationId');

    // Send reminders for each appointment
    for (const appointment of appointments) {
      await this.notifyAppointmentReminder(appointment);
    }

    console.log(`Sent ${appointments.length} appointment reminders`);
  }

  // Schedule prescription expiry reminders (to be called by a cron job)
  async schedulePrescriptionExpiryReminders() {
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    threeDaysFromNow.setHours(23, 59, 59, 999);

    // Find prescriptions expiring in 3 days
    const prescriptions = await Prescription.find({
      expiryDate: {
        $gte: new Date(),
        $lte: threeDaysFromNow
      },
      isDispensed: false
    }).populate('patientId doctorId organizationId');

    // Send expiry reminders
    for (const prescription of prescriptions) {
      await this.notifyPrescriptionExpiring(prescription);
    }

    console.log(`Sent ${prescriptions.length} prescription expiry reminders`);
  }
}

module.exports = new NotificationService();
