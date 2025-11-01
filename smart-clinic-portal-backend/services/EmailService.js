const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    // For development, we'll use a test account
    // In production, you would use your actual SMTP credentials
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || 'your-email@gmail.com',
        pass: process.env.SMTP_PASS || 'your-app-password'
      }
    });

    // Verify connection configuration
    this.transporter.verify((error, success) => {
      if (error) {
        console.log('Email service configuration error:', error);
      } else {
        console.log('Email service is ready to send messages');
      }
    });
  }

  async sendEmail(to, subject, html, text = '') {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || 'Smart Clinic Portal <noreply@smartclinic.com>',
        to: to,
        subject: subject,
        html: html,
        text: text || this.stripHtml(html)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending email:', error);
      return { success: false, error: error.message };
    }
  }

  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '');
  }

  // Email Templates
  generateAppointmentConfirmationEmail(appointment, patient, doctor, organization) {
    const appointmentDate = new Date(appointment.date).toLocaleDateString();
    const appointmentTime = appointment.startTime;
    
    return {
      subject: `Appointment Confirmed - ${appointmentDate} at ${appointmentTime}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Appointment Confirmation</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { background: #f9fafb; padding: 20px; }
            .appointment-details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #2563eb; }
            .footer { background: #374151; color: white; padding: 20px; text-align: center; font-size: 14px; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Appointment Confirmed</h1>
              <p>Smart Clinic Portal</p>
            </div>
            
            <div class="content">
              <h2>Hello ${patient.name},</h2>
              <p>Your appointment has been confirmed. Here are the details:</p>
              
              <div class="appointment-details">
                <h3>Appointment Details</h3>
                <p><strong>Doctor:</strong> Dr. ${doctor.name}</p>
                <p><strong>Organization:</strong> ${organization.name}</p>
                <p><strong>Date:</strong> ${appointmentDate}</p>
                <p><strong>Time:</strong> ${appointmentTime}</p>
                <p><strong>Reason:</strong> ${appointment.reason}</p>
                <p><strong>Status:</strong> Confirmed</p>
              </div>
              
              <p>Please arrive 15 minutes before your scheduled appointment time.</p>
              
              <p>If you need to reschedule or cancel this appointment, please contact us as soon as possible.</p>
              
              <p>Thank you for choosing ${organization.name}!</p>
            </div>
            
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
              <p>&copy; 2024 Smart Clinic Portal. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
  }

  generateAppointmentReminderEmail(appointment, patient, doctor, organization) {
    const appointmentDate = new Date(appointment.date).toLocaleDateString();
    const appointmentTime = appointment.startTime;
    
    return {
      subject: `Appointment Reminder - Tomorrow at ${appointmentTime}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Appointment Reminder</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f59e0b; color: white; padding: 20px; text-align: center; }
            .content { background: #f9fafb; padding: 20px; }
            .appointment-details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #f59e0b; }
            .footer { background: #374151; color: white; padding: 20px; text-align: center; font-size: 14px; }
            .reminder { background: #fef3c7; padding: 15px; border-radius: 6px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Appointment Reminder</h1>
              <p>Smart Clinic Portal</p>
            </div>
            
            <div class="content">
              <h2>Hello ${patient.name},</h2>
              <p>This is a friendly reminder about your upcoming appointment.</p>
              
              <div class="reminder">
                <h3>⏰ Reminder</h3>
                <p>Your appointment is scheduled for <strong>tomorrow</strong>!</p>
              </div>
              
              <div class="appointment-details">
                <h3>Appointment Details</h3>
                <p><strong>Doctor:</strong> Dr. ${doctor.name}</p>
                <p><strong>Organization:</strong> ${organization.name}</p>
                <p><strong>Date:</strong> ${appointmentDate}</p>
                <p><strong>Time:</strong> ${appointmentTime}</p>
                <p><strong>Reason:</strong> ${appointment.reason}</p>
              </div>
              
              <p><strong>Important:</strong> Please arrive 15 minutes before your scheduled appointment time.</p>
              
              <p>If you need to reschedule or cancel this appointment, please contact us immediately.</p>
              
              <p>We look forward to seeing you!</p>
            </div>
            
            <div class="footer">
              <p>This is an automated reminder. Please do not reply to this email.</p>
              <p>&copy; 2024 Smart Clinic Portal. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
  }

  generatePrescriptionIssuedEmail(prescription, patient, doctor, organization) {
    const issueDate = new Date(prescription.issueDate).toLocaleDateString();
    const expiryDate = new Date(prescription.expiryDate).toLocaleDateString();
    
    return {
      subject: `New Prescription Available - ${issueDate}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Prescription</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #059669; color: white; padding: 20px; text-align: center; }
            .content { background: #f9fafb; padding: 20px; }
            .prescription-details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #059669; }
            .medication { background: #f0fdf4; padding: 15px; margin: 10px 0; border-radius: 6px; }
            .footer { background: #374151; color: white; padding: 20px; text-align: center; font-size: 14px; }
            .warning { background: #fef2f2; color: #dc2626; padding: 15px; border-radius: 6px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Prescription Available</h1>
              <p>Smart Clinic Portal</p>
            </div>
            
            <div class="content">
              <h2>Hello ${patient.name},</h2>
              <p>Dr. ${doctor.name} has issued a new prescription for you.</p>
              
              <div class="prescription-details">
                <h3>Prescription Details</h3>
                <p><strong>Doctor:</strong> Dr. ${doctor.name}</p>
                <p><strong>Organization:</strong> ${organization.name}</p>
                <p><strong>Issue Date:</strong> ${issueDate}</p>
                <p><strong>Expiry Date:</strong> ${expiryDate}</p>
                <p><strong>Diagnosis:</strong> ${prescription.diagnosis}</p>
              </div>
              
              <h3>Medications</h3>
              ${prescription.medications.map(med => `
                <div class="medication">
                  <p><strong>${med.name}</strong> - ${med.dosage}</p>
                  <p><strong>Frequency:</strong> ${med.frequency}</p>
                  <p><strong>Instructions:</strong> ${med.instructions}</p>
                  ${med.quantity ? `<p><strong>Quantity:</strong> ${med.quantity}</p>` : ''}
                  ${med.refills > 0 ? `<p><strong>Refills:</strong> ${med.refills}</p>` : ''}
                </div>
              `).join('')}
              
              <div class="warning">
                <p><strong>Important:</strong> This prescription expires on ${expiryDate}. Please fill it at your pharmacy before the expiry date.</p>
              </div>
              
              ${prescription.notes ? `<p><strong>Additional Notes:</strong> ${prescription.notes}</p>` : ''}
              
              <p>You can view and download your prescription from your patient portal.</p>
            </div>
            
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
              <p>&copy; 2024 Smart Clinic Portal. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
  }

  generatePrescriptionExpiryEmail(prescription, patient, doctor, organization) {
    const expiryDate = new Date(prescription.expiryDate).toLocaleDateString();
    
    return {
      subject: `Prescription Expiring Soon - ${expiryDate}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Prescription Expiry Warning</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
            .content { background: #f9fafb; padding: 20px; }
            .prescription-details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #dc2626; }
            .footer { background: #374151; color: white; padding: 20px; text-align: center; font-size: 14px; }
            .urgent { background: #fef2f2; color: #dc2626; padding: 15px; border-radius: 6px; margin: 15px 0; border: 2px solid #dc2626; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Prescription Expiry Warning</h1>
              <p>Smart Clinic Portal</p>
            </div>
            
            <div class="content">
              <h2>Hello ${patient.name},</h2>
              
              <div class="urgent">
                <h3>⚠️ Urgent Notice</h3>
                <p>Your prescription is expiring soon! Please refill it at your pharmacy before the expiry date.</p>
              </div>
              
              <div class="prescription-details">
                <h3>Prescription Details</h3>
                <p><strong>Doctor:</strong> Dr. ${doctor.name}</p>
                <p><strong>Organization:</strong> ${organization.name}</p>
                <p><strong>Expiry Date:</strong> ${expiryDate}</p>
                <p><strong>Diagnosis:</strong> ${prescription.diagnosis}</p>
              </div>
              
              <p><strong>Action Required:</strong> Please visit your pharmacy to refill this prescription before it expires.</p>
              
              <p>If you have any questions about this prescription, please contact Dr. ${doctor.name} or ${organization.name}.</p>
              
              <p>You can view your prescription details in your patient portal.</p>
            </div>
            
            <div class="footer">
              <p>This is an automated warning. Please do not reply to this email.</p>
              <p>&copy; 2024 Smart Clinic Portal. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
  }

  generateSystemAnnouncementEmail(announcement, user, organization) {
    return {
      subject: `System Announcement: ${announcement.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>System Announcement</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #7c3aed; color: white; padding: 20px; text-align: center; }
            .content { background: #f9fafb; padding: 20px; }
            .announcement { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #7c3aed; }
            .footer { background: #374151; color: white; padding: 20px; text-align: center; font-size: 14px; }
            .priority-high { border-left-color: #dc2626; }
            .priority-medium { border-left-color: #f59e0b; }
            .priority-low { border-left-color: #059669; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>System Announcement</h1>
              <p>Smart Clinic Portal</p>
            </div>
            
            <div class="content">
              <h2>Hello ${user.name},</h2>
              
              <div class="announcement priority-${announcement.priority}">
                <h3>${announcement.title}</h3>
                <p>${announcement.message}</p>
              </div>
              
              <p>This announcement was sent by ${organization.name}.</p>
              
              <p>If you have any questions, please contact your administrator.</p>
            </div>
            
            <div class="footer">
              <p>This is an automated announcement. Please do not reply to this email.</p>
              <p>&copy; 2024 Smart Clinic Portal. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
  }

  generatePasswordResetEmail(user, resetToken) {
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
    
    return {
      subject: 'Password Reset Request - Smart Clinic Portal',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
            .content { background: #f9fafb; padding: 20px; }
            .reset-details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #dc2626; }
            .footer { background: #374151; color: white; padding: 20px; text-align: center; font-size: 14px; }
            .button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
            .warning { background: #fef2f2; color: #dc2626; padding: 15px; border-radius: 6px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
              <p>Smart Clinic Portal</p>
            </div>
            
            <div class="content">
              <h2>Hello ${user.name},</h2>
              <p>We received a request to reset your password for your Smart Clinic Portal account.</p>
              
              <div class="reset-details">
                <h3>Reset Your Password</h3>
                <p>Click the button below to reset your password:</p>
                <a href="${resetUrl}" class="button">Reset Password</a>
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; background: #f3f4f6; padding: 10px; border-radius: 4px;">${resetUrl}</p>
              </div>
              
              <div class="warning">
                <p><strong>Security Notice:</strong></p>
                <ul>
                  <li>This link will expire in 1 hour</li>
                  <li>If you didn't request this reset, please ignore this email</li>
                  <li>Never share this link with anyone</li>
                </ul>
              </div>
              
              <p>If you have any questions, please contact support.</p>
            </div>
            
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
              <p>&copy; 2024 Smart Clinic Portal. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
  }
}

module.exports = new EmailService();
