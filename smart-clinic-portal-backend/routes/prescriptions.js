const express = require('express');
const router = express.Router();
const { body, validationResult, query } = require('express-validator');
const { auth, authorize, isDoctor, isOwnerOrAdmin } = require('../middleware/auth');
const Prescription = require('../models/Prescription');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Organization = require('../models/Organization');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// @route   GET /api/prescriptions
// @desc    Get prescriptions with filtering and pagination
// @access  Private
router.get('/', auth, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['active', 'completed', 'cancelled', 'expired']),
  query('patient').optional().isMongoId().withMessage('Valid patient ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};

    // Role-based filtering
    if (req.user.role === 'patient') {
      filter.patient = req.user.userId;
    } else if (req.user.role === 'doctor') {
      filter.doctor = req.user.userId;
    }

    // Additional filters
    if (req.query.status) filter.status = req.query.status;
    if (req.query.patient && req.user.role !== 'patient') {
      filter.patient = req.query.patient;
    }

    const prescriptions = await Prescription.find(filter)
      .populate('patient', 'name email phone dateOfBirth address')
      .populate('doctor', 'name email phone')
      .populate('organization', 'name address contact')
      .populate('appointment', 'appointmentDate appointmentTime reason')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Prescription.countDocuments(filter);

    res.json({
      prescriptions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalPrescriptions: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get prescriptions error:', error);
    res.status(500).json({
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/prescriptions/:id
// @desc    Get single prescription
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('patient', 'name email phone dateOfBirth address emergencyContact')
      .populate('doctor', 'name email phone')
      .populate('organization', 'name address contact')
      .populate('appointment', 'appointmentDate appointmentTime reason symptoms');

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    // Check permissions
    if (req.user.role === 'patient' && prescription.patient._id.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (req.user.role === 'doctor' && prescription.doctor._id.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ prescription });
  } catch (error) {
    console.error('Get prescription error:', error);
    res.status(500).json({
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/prescriptions
// @desc    Create new prescription
// @access  Private (Doctor only)
router.post('/', auth, isDoctor, [
  body('patient').isMongoId().withMessage('Valid patient ID is required'),
  body('appointment').isMongoId().withMessage('Valid appointment ID is required'),
  body('organization').isMongoId().withMessage('Valid organization ID is required'),
  body('diagnosis.primary').trim().notEmpty().withMessage('Primary diagnosis is required'),
  body('medications').isArray({ min: 1 }).withMessage('At least one medication is required'),
  body('medications.*.name').trim().notEmpty().withMessage('Medication name is required'),
  body('medications.*.dosage').trim().notEmpty().withMessage('Medication dosage is required'),
  body('medications.*.frequency').trim().notEmpty().withMessage('Medication frequency is required'),
  body('medications.*.duration').trim().notEmpty().withMessage('Medication duration is required'),
  body('medications.*.instructions').trim().notEmpty().withMessage('Medication instructions are required'),
  body('medications.*.quantity').isInt({ min: 1 }).withMessage('Medication quantity must be at least 1')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      patient,
      appointment,
      organization,
      diagnosis,
      medications,
      instructions = {},
      labTests = [],
      imaging = [],
      followUp = {}
    } = req.body;

    // Verify patient exists
    const patientExists = await User.findOne({ _id: patient, role: 'patient', isActive: true });
    if (!patientExists) {
      return res.status(400).json({ message: 'Patient not found or inactive' });
    }

    // Verify appointment exists and belongs to the doctor
    const appointmentExists = await Appointment.findOne({
      _id: appointment,
      doctor: req.user.userId,
      patient: patient
    });
    if (!appointmentExists) {
      return res.status(400).json({ message: 'Appointment not found or access denied' });
    }

    // Verify organization exists
    const organizationExists = await Organization.findOne({ _id: organization, isActive: true });
    if (!organizationExists) {
      return res.status(400).json({ message: 'Organization not found or inactive' });
    }

    // Create prescription
    const prescription = new Prescription({
      patient,
      doctor: req.user.userId,
      appointment,
      organization,
      diagnosis,
      medications,
      instructions,
      labTests,
      imaging,
      followUp
    });

    await prescription.save();

    // Update appointment with prescription reference
    appointmentExists.prescription = prescription._id;
    await appointmentExists.save();

    // Populate the prescription for response
    await prescription.populate([
      { path: 'patient', select: 'name email phone dateOfBirth address' },
      { path: 'doctor', select: 'name email phone' },
      { path: 'clinic', select: 'name address contact' },
      { path: 'appointment', select: 'appointmentDate appointmentTime reason' }
    ]);

    res.status(201).json({
      message: 'Prescription created successfully',
      prescription
    });
  } catch (error) {
    console.error('Create prescription error:', error);
    res.status(500).json({
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PUT /api/prescriptions/:id
// @desc    Update prescription
// @access  Private (Doctor only)
router.put('/:id', auth, isDoctor, [
  body('diagnosis.primary').optional().trim().notEmpty().withMessage('Primary diagnosis is required'),
  body('medications').optional().isArray({ min: 1 }).withMessage('At least one medication is required'),
  body('status').optional().isIn(['active', 'completed', 'cancelled', 'expired'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    // Check if prescription belongs to the doctor
    if (prescription.doctor.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update allowed fields
    const allowedUpdates = ['diagnosis', 'medications', 'instructions', 'labTests', 'imaging', 'followUp', 'status'];
    const updates = {};

    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const updatedPrescription = await Prescription.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate([
      { path: 'patient', select: 'name email phone dateOfBirth address' },
      { path: 'doctor', select: 'name email phone' },
      { path: 'clinic', select: 'name address contact' },
      { path: 'appointment', select: 'appointmentDate appointmentTime reason' }
    ]);

    res.json({
      message: 'Prescription updated successfully',
      prescription: updatedPrescription
    });
  } catch (error) {
    console.error('Update prescription error:', error);
    res.status(500).json({
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/prescriptions/:id/pdf
// @desc    Generate and download prescription PDF
// @access  Private
router.get('/:id/pdf', auth, async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('patient', 'name email phone dateOfBirth address')
      .populate('doctor', 'name email phone')
      .populate('organization', 'name address contact')
      .populate('appointment', 'appointmentDate appointmentTime reason');

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    // Check permissions
    if (req.user.role === 'patient' && prescription.patient._id.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (req.user.role === 'doctor' && prescription.doctor._id.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Create PDF
    const doc = new PDFDocument({ margin: 50 });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="prescription-${prescription.prescriptionNumber}.pdf"`);

    // Pipe PDF to response
    doc.pipe(res);

    // Header
    doc.fontSize(20).text('PRESCRIPTION', { align: 'center' });
    doc.fontSize(12).text(`Prescription #: ${prescription.prescriptionNumber}`, { align: 'center' });
    doc.moveDown();

    // Organization information
    doc.fontSize(14).text('ORGANIZATION INFORMATION', { underline: true });
    doc.fontSize(12).text(`${prescription.organization.name}`);
    doc.text(`${prescription.organization.address.street}`);
    doc.text(`${prescription.organization.address.city}, ${prescription.organization.address.state} ${prescription.organization.address.zipCode}`);
    doc.text(`Phone: ${prescription.organization.contact.phone}`);
    doc.text(`Email: ${prescription.organization.contact.email}`);
    doc.moveDown();

    // Doctor information
    doc.fontSize(14).text('PRESCRIBING DOCTOR', { underline: true });
    doc.fontSize(12).text(`Dr. ${prescription.doctor.name}`);
    doc.text(`Phone: ${prescription.doctor.phone}`);
    doc.text(`Email: ${prescription.doctor.email}`);
    doc.moveDown();

    // Patient information
    doc.fontSize(14).text('PATIENT INFORMATION', { underline: true });
    doc.fontSize(12).text(`Name: ${prescription.patient.name}`);
    doc.text(`Phone: ${prescription.patient.phone}`);
    doc.text(`Date of Birth: ${prescription.patient.dateOfBirth.toLocaleDateString()}`);
    doc.text(`Address: ${prescription.patient.address.street}, ${prescription.patient.address.city}, ${prescription.patient.address.state} ${prescription.patient.address.zipCode}`);
    doc.moveDown();

    // Appointment information
    doc.fontSize(14).text('APPOINTMENT DETAILS', { underline: true });
    doc.fontSize(12).text(`Date: ${prescription.appointment.appointmentDate.toLocaleDateString()}`);
    doc.text(`Time: ${prescription.appointment.appointmentTime}`);
    doc.text(`Reason: ${prescription.appointment.reason}`);
    doc.moveDown();

    // Diagnosis
    doc.fontSize(14).text('DIAGNOSIS', { underline: true });
    doc.fontSize(12).text(`Primary: ${prescription.diagnosis.primary}`);
    if (prescription.diagnosis.secondary && prescription.diagnosis.secondary.length > 0) {
      doc.text(`Secondary: ${prescription.diagnosis.secondary.join(', ')}`);
    }
    if (prescription.diagnosis.notes) {
      doc.text(`Notes: ${prescription.diagnosis.notes}`);
    }
    doc.moveDown();

    // Medications
    doc.fontSize(14).text('PRESCRIBED MEDICATIONS', { underline: true });
    prescription.medications.forEach((med, index) => {
      doc.fontSize(12).text(`${index + 1}. ${med.name}`, { continued: true });
      if (med.genericName) {
        doc.text(` (${med.genericName})`);
      } else {
        doc.text('');
      }
      doc.text(`   Dosage: ${med.dosage}`);
      doc.text(`   Frequency: ${med.frequency}`);
      doc.text(`   Duration: ${med.duration}`);
      doc.text(`   Quantity: ${med.quantity}`);
      if (med.refills > 0) {
        doc.text(`   Refills: ${med.refills}`);
      }
      doc.text(`   Instructions: ${med.instructions}`);
      if (med.sideEffects && med.sideEffects.length > 0) {
        doc.text(`   Side Effects: ${med.sideEffects.join(', ')}`);
      }
      if (med.warnings && med.warnings.length > 0) {
        doc.text(`   Warnings: ${med.warnings.join(', ')}`);
      }
      doc.moveDown(0.5);
    });

    // Lab Tests
    if (prescription.labTests && prescription.labTests.length > 0) {
      doc.fontSize(14).text('LABORATORY TESTS', { underline: true });
      prescription.labTests.forEach((test, index) => {
        doc.fontSize(12).text(`${index + 1}. ${test.testName}`);
        if (test.instructions) {
          doc.text(`   Instructions: ${test.instructions}`);
        }
        if (test.urgency) {
          doc.text(`   Urgency: ${test.urgency.toUpperCase()}`);
        }
        if (test.dueDate) {
          doc.text(`   Due Date: ${new Date(test.dueDate).toLocaleDateString()}`);
        }
        doc.moveDown(0.5);
      });
    }

    // Imaging
    if (prescription.imaging && prescription.imaging.length > 0) {
      doc.fontSize(14).text('IMAGING STUDIES', { underline: true });
      prescription.imaging.forEach((img, index) => {
        doc.fontSize(12).text(`${index + 1}. ${img.type} - ${img.bodyPart}`);
        if (img.instructions) {
          doc.text(`   Instructions: ${img.instructions}`);
        }
        if (img.urgency) {
          doc.text(`   Urgency: ${img.urgency.toUpperCase()}`);
        }
        if (img.dueDate) {
          doc.text(`   Due Date: ${new Date(img.dueDate).toLocaleDateString()}`);
        }
        doc.moveDown(0.5);
      });
    }

    // Follow-up
    if (prescription.followUp.required) {
      doc.fontSize(14).text('FOLLOW-UP', { underline: true });
      doc.fontSize(12).text(`Required: Yes`);
      if (prescription.followUp.timeframe) {
        doc.text(`Timeframe: ${prescription.followUp.timeframe}`);
      }
      if (prescription.followUp.reason) {
        doc.text(`Reason: ${prescription.followUp.reason}`);
      }
      if (prescription.followUp.instructions) {
        doc.text(`Instructions: ${prescription.followUp.instructions}`);
      }
      doc.moveDown();
    }

    // General instructions
    if (prescription.instructions.general) {
      doc.fontSize(14).text('GENERAL INSTRUCTIONS', { underline: true });
      doc.fontSize(12).text(prescription.instructions.general);
      doc.moveDown();
    }

    // Emergency instructions
    if (prescription.instructions.emergency) {
      doc.fontSize(14).text('EMERGENCY INSTRUCTIONS', { underline: true });
      doc.fontSize(12).text(prescription.instructions.emergency);
      doc.moveDown();
    }

    // Footer
    doc.fontSize(10).text(`Prescription valid until: ${prescription.validUntil.toLocaleDateString()}`, { align: 'center' });
    doc.text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('Generate PDF error:', error);
    res.status(500).json({
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   DELETE /api/prescriptions/:id
// @desc    Cancel prescription
// @access  Private (Doctor only)
router.delete('/:id', auth, isDoctor, async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    // Check if prescription belongs to the doctor
    if (prescription.doctor.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if prescription can be cancelled
    if (['completed', 'cancelled'].includes(prescription.status)) {
      return res.status(400).json({
        message: 'Cannot cancel a completed or already cancelled prescription'
      });
    }

    // Update status to cancelled
    prescription.status = 'cancelled';
    await prescription.save();

    res.json({ message: 'Prescription cancelled successfully' });
  } catch (error) {
    console.error('Cancel prescription error:', error);
    res.status(500).json({
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
