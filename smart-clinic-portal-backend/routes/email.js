const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { auth, multiTenant } = require('../middleware/auth');
const emailService = require('../services/EmailService');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');
const Organization = require('../models/Organization');

// @route   POST /api/email/send-appointment-confirmation
// @desc    Send appointment confirmation email
// @access  Private (Admin/Doctor)
router.post('/send-appointment-confirmation', [
  auth,
  multiTenant,
  body('appointmentId').isMongoId().withMessage('Valid appointment ID is required'),
  body('patientEmail').isEmail().withMessage('Valid patient email is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    if (req.userData.role !== 'admin' && req.userData.role !== 'doctor' && req.userData.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { appointmentId, patientEmail } = req.body;

    // Fetch appointment details
    const appointment = await Appointment.findById(appointmentId)
      .populate('patient', 'name email')
      .populate('doctor', 'name email')
      .populate('organizationId', 'name');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check organization access
    if (req.userData.role !== 'superadmin' && 
        appointment.organizationId._id.toString() !== req.userData.organizationId._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Generate email content
    const emailContent = emailService.generateAppointmentConfirmationEmail(
      appointment,
      appointment.patient,
      appointment.doctor,
      appointment.organizationId
    );

    // Send email
    const result = await emailService.sendEmail(
      patientEmail,
      emailContent.subject,
      emailContent.html
    );

    if (result.success) {
      res.json({ 
        message: 'Appointment confirmation email sent successfully',
        messageId: result.messageId
      });
    } else {
      res.status(500).json({ message: 'Failed to send email', error: result.error });
    }
  } catch (error) {
    console.error('Error sending appointment confirmation email:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/email/send-appointment-reminder
// @desc    Send appointment reminder email
// @access  Private (Admin/Doctor)
router.post('/send-appointment-reminder', [
  auth,
  multiTenant,
  body('appointmentId').isMongoId().withMessage('Valid appointment ID is required'),
  body('patientEmail').isEmail().withMessage('Valid patient email is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    if (req.userData.role !== 'admin' && req.userData.role !== 'doctor' && req.userData.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { appointmentId, patientEmail } = req.body;

    // Fetch appointment details
    const appointment = await Appointment.findById(appointmentId)
      .populate('patient', 'name email')
      .populate('doctor', 'name email')
      .populate('organizationId', 'name');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check organization access
    if (req.userData.role !== 'superadmin' && 
        appointment.organizationId._id.toString() !== req.userData.organizationId._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Generate email content
    const emailContent = emailService.generateAppointmentReminderEmail(
      appointment,
      appointment.patient,
      appointment.doctor,
      appointment.organizationId
    );

    // Send email
    const result = await emailService.sendEmail(
      patientEmail,
      emailContent.subject,
      emailContent.html
    );

    if (result.success) {
      res.json({ 
        message: 'Appointment reminder email sent successfully',
        messageId: result.messageId
      });
    } else {
      res.status(500).json({ message: 'Failed to send email', error: result.error });
    }
  } catch (error) {
    console.error('Error sending appointment reminder email:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/email/send-prescription-notification
// @desc    Send prescription issued notification email
// @access  Private (Doctor/Admin)
router.post('/send-prescription-notification', [
  auth,
  multiTenant,
  body('prescriptionId').isMongoId().withMessage('Valid prescription ID is required'),
  body('patientEmail').isEmail().withMessage('Valid patient email is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    if (req.userData.role !== 'admin' && req.userData.role !== 'doctor' && req.userData.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { prescriptionId, patientEmail } = req.body;

    // Fetch prescription details
    const prescription = await Prescription.findById(prescriptionId)
      .populate('patient', 'name email')
      .populate('doctor', 'name email')
      .populate('organizationId', 'name');

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    // Check organization access
    if (req.userData.role !== 'superadmin' && 
        prescription.organizationId._id.toString() !== req.userData.organizationId._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Generate email content
    const emailContent = emailService.generatePrescriptionIssuedEmail(
      prescription,
      prescription.patient,
      prescription.doctor,
      prescription.organizationId
    );

    // Send email
    const result = await emailService.sendEmail(
      patientEmail,
      emailContent.subject,
      emailContent.html
    );

    if (result.success) {
      res.json({ 
        message: 'Prescription notification email sent successfully',
        messageId: result.messageId
      });
    } else {
      res.status(500).json({ message: 'Failed to send email', error: result.error });
    }
  } catch (error) {
    console.error('Error sending prescription notification email:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/email/send-prescription-expiry-warning
// @desc    Send prescription expiry warning email
// @access  Private (Admin/Doctor)
router.post('/send-prescription-expiry-warning', [
  auth,
  multiTenant,
  body('prescriptionId').isMongoId().withMessage('Valid prescription ID is required'),
  body('patientEmail').isEmail().withMessage('Valid patient email is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    if (req.userData.role !== 'admin' && req.userData.role !== 'doctor' && req.userData.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { prescriptionId, patientEmail } = req.body;

    // Fetch prescription details
    const prescription = await Prescription.findById(prescriptionId)
      .populate('patient', 'name email')
      .populate('doctor', 'name email')
      .populate('organizationId', 'name');

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    // Check organization access
    if (req.userData.role !== 'superadmin' && 
        prescription.organizationId._id.toString() !== req.userData.organizationId._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Generate email content
    const emailContent = emailService.generatePrescriptionExpiryEmail(
      prescription,
      prescription.patient,
      prescription.doctor,
      prescription.organizationId
    );

    // Send email
    const result = await emailService.sendEmail(
      patientEmail,
      emailContent.subject,
      emailContent.html
    );

    if (result.success) {
      res.json({ 
        message: 'Prescription expiry warning email sent successfully',
        messageId: result.messageId
      });
    } else {
      res.status(500).json({ message: 'Failed to send email', error: result.error });
    }
  } catch (error) {
    console.error('Error sending prescription expiry warning email:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/email/send-system-announcement
// @desc    Send system announcement email to all users
// @access  Private (SuperAdmin/Admin)
router.post('/send-system-announcement', [
  auth,
  multiTenant,
  body('title').notEmpty().withMessage('Title is required'),
  body('message').notEmpty().withMessage('Message is required'),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    if (req.userData.role !== 'admin' && req.userData.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { title, message, priority = 'medium' } = req.body;

    // Build user query based on role
    let userQuery = { isActive: true };
    if (req.userData.role !== 'superadmin') {
      userQuery.organizationId = req.userData.organizationId._id;
    }

    // Fetch users
    const users = await User.find(userQuery).select('name email');
    const organization = await Organization.findById(req.userData.organizationId._id).select('name');

    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    const announcement = { title, message, priority };
    const emailPromises = users.map(user => {
      const emailContent = emailService.generateSystemAnnouncementEmail(
        announcement,
        user,
        organization
      );
      
      return emailService.sendEmail(
        user.email,
        emailContent.subject,
        emailContent.html
      );
    });

    const results = await Promise.allSettled(emailPromises);
    const successful = results.filter(result => result.status === 'fulfilled' && result.value.success).length;
    const failed = results.length - successful;

    res.json({
      message: `System announcement sent to ${successful} users`,
      successful,
      failed,
      total: results.length
    });
  } catch (error) {
    console.error('Error sending system announcement email:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/email/send-password-reset
// @desc    Send password reset email
// @access  Public
router.post('/send-password-reset', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('resetToken').notEmpty().withMessage('Reset token is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, resetToken } = req.body;

    // Find user by email
    const user = await User.findOne({ email, isActive: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate email content
    const emailContent = emailService.generatePasswordResetEmail(user, resetToken);

    // Send email
    const result = await emailService.sendEmail(
      email,
      emailContent.subject,
      emailContent.html
    );

    if (result.success) {
      res.json({ 
        message: 'Password reset email sent successfully',
        messageId: result.messageId
      });
    } else {
      res.status(500).json({ message: 'Failed to send email', error: result.error });
    }
  } catch (error) {
    console.error('Error sending password reset email:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/email/test-email
// @desc    Send test email (for development/testing)
// @access  Private (Admin/SuperAdmin)
router.post('/test-email', [
  auth,
  multiTenant,
  body('to').isEmail().withMessage('Valid email address is required'),
  body('subject').notEmpty().withMessage('Subject is required'),
  body('message').notEmpty().withMessage('Message is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    if (req.userData.role !== 'admin' && req.userData.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { to, subject, message } = req.body;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Test Email</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { background: #f9fafb; padding: 20px; }
          .footer { background: #374151; color: white; padding: 20px; text-align: center; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Test Email</h1>
            <p>Smart Clinic Portal</p>
          </div>
          
          <div class="content">
            <h2>Email Test Successful!</h2>
            <p>This is a test email from the Smart Clinic Portal email service.</p>
            <p><strong>Message:</strong> ${message}</p>
            <p>If you received this email, the email service is working correctly.</p>
          </div>
          
          <div class="footer">
            <p>This is a test email. Please do not reply.</p>
            <p>&copy; 2024 Smart Clinic Portal. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const result = await emailService.sendEmail(to, subject, html);

    if (result.success) {
      res.json({ 
        message: 'Test email sent successfully',
        messageId: result.messageId
      });
    } else {
      res.status(500).json({ message: 'Failed to send test email', error: result.error });
    }
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
