const express = require('express');
const router = express.Router();
const { body, validationResult, query } = require('express-validator');
const { auth, authorize, isOwnerOrAdmin } = require('../middleware/auth');
const CheckIn = require('../models/CheckIn');
const User = require('../models/User');
const Clinic = require('../models/Clinic');
const Appointment = require('../models/Appointment');

// @route   GET /api/checkin
// @desc    Get check-ins with filtering and pagination
// @access  Private
router.get('/', auth, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['checked-in', 'waiting', 'in-consultation', 'completed', 'cancelled']),
  query('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  query('clinic').optional().isMongoId().withMessage('Valid clinic ID is required')
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
      // Doctors can see check-ins for their appointments
      const doctorAppointments = await Appointment.find({ doctor: req.user.userId }).select('_id');
      filter.appointment = { $in: doctorAppointments.map(apt => apt._id) };
    }

    // Additional filters
    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;
    if (req.query.clinic) filter.clinic = req.query.clinic;

    const checkIns = await CheckIn.find(filter)
      .populate('patient', 'name email phone dateOfBirth address emergencyContact')
      .populate('appointment', 'appointmentDate appointmentTime reason')
      .populate('clinic', 'name address contact')
      .populate('assignedStaff', 'name email phone')
      .sort({ checkInTime: -1 })
      .skip(skip)
      .limit(limit);

    const total = await CheckIn.countDocuments(filter);

    res.json({
      checkIns,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalCheckIns: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get check-ins error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/checkin/:id
// @desc    Get single check-in
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const checkIn = await CheckIn.findById(req.params.id)
      .populate('patient', 'name email phone dateOfBirth address emergencyContact medicalHistory allergies currentMedications')
      .populate('appointment', 'appointmentDate appointmentTime reason symptoms')
      .populate('clinic', 'name address contact')
      .populate('assignedStaff', 'name email phone');

    if (!checkIn) {
      return res.status(404).json({ message: 'Check-in not found' });
    }

    // Check permissions
    if (req.user.role === 'patient' && checkIn.patient._id.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ checkIn });
  } catch (error) {
    console.error('Get check-in error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/checkin
// @desc    Create new check-in
// @access  Private
router.post('/', auth, [
  body('clinic').isMongoId().withMessage('Valid clinic ID is required'),
  body('chiefComplaint').trim().isLength({ min: 10, max: 500 }).withMessage('Chief complaint must be between 10 and 500 characters'),
  body('symptoms').optional().isArray(),
  body('symptoms.*.symptom').optional().trim().notEmpty().withMessage('Symptom description is required'),
  body('symptoms.*.severity').optional().isIn(['mild', 'moderate', 'severe']),
  body('vitalSigns.bloodPressure.systolic').optional().isInt({ min: 50, max: 300 }),
  body('vitalSigns.bloodPressure.diastolic').optional().isInt({ min: 30, max: 200 }),
  body('vitalSigns.heartRate').optional().isInt({ min: 30, max: 200 }),
  body('vitalSigns.temperature').optional().isFloat({ min: 95, max: 110 }),
  body('vitalSigns.oxygenSaturation').optional().isInt({ min: 70, max: 100 }),
  body('painLevel').optional().isInt({ min: 0, max: 10 }),
  body('additionalNotes').optional().isLength({ max: 1000 }).withMessage('Additional notes cannot exceed 1000 characters')
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
      clinic,
      appointment,
      chiefComplaint,
      symptoms = [],
      vitalSigns = {},
      painLevel = 0,
      currentMedications = [],
      allergies = [],
      medicalHistory = [],
      additionalNotes,
      priority = 'medium'
    } = req.body;

    // Verify clinic exists
    const clinicExists = await Clinic.findOne({ _id: clinic, isActive: true });
    if (!clinicExists) {
      return res.status(400).json({ message: 'Clinic not found or inactive' });
    }

    // Verify appointment if provided
    if (appointment) {
      const appointmentExists = await Appointment.findOne({
        _id: appointment,
        patient: req.user.userId
      });
      if (!appointmentExists) {
        return res.status(400).json({ message: 'Appointment not found or access denied' });
      }
    }

    // Create check-in
    const checkIn = new CheckIn({
      patient: req.user.userId,
      clinic,
      appointment,
      chiefComplaint,
      symptoms,
      vitalSigns,
      painLevel,
      currentMedications,
      allergies,
      medicalHistory,
      additionalNotes,
      priority
    });

    await checkIn.save();

    // Populate the check-in for response
    await checkIn.populate([
      { path: 'patient', select: 'name email phone' },
      { path: 'appointment', select: 'appointmentDate appointmentTime reason' },
      { path: 'clinic', select: 'name address contact' }
    ]);

    res.status(201).json({
      message: 'Check-in created successfully',
      checkIn
    });
  } catch (error) {
    console.error('Create check-in error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PUT /api/checkin/:id
// @desc    Update check-in
// @access  Private
router.put('/:id', auth, [
  body('status').optional().isIn(['checked-in', 'waiting', 'in-consultation', 'completed', 'cancelled']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('staffNotes').optional().isLength({ max: 1000 }).withMessage('Staff notes cannot exceed 1000 characters'),
  body('estimatedWaitTime').optional().isInt({ min: 0 }).withMessage('Estimated wait time must be a positive integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const checkIn = await CheckIn.findById(req.params.id);
    if (!checkIn) {
      return res.status(404).json({ message: 'Check-in not found' });
    }

    // Check permissions
    if (req.user.role === 'patient' && checkIn.patient.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update allowed fields based on role
    const allowedUpdates = ['status', 'priority', 'estimatedWaitTime', 'assignedStaff'];
    if (req.user.role !== 'patient') {
      allowedUpdates.push('staffNotes', 'followUpRequired', 'followUpNotes');
    }

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    // Handle status changes
    if (updates.status === 'in-consultation') {
      updates.checkInTime = new Date();
    }
    if (updates.status === 'completed') {
      updates.checkOutTime = new Date();
    }

    const updatedCheckIn = await CheckIn.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate([
      { path: 'patient', select: 'name email phone' },
      { path: 'appointment', select: 'appointmentDate appointmentTime reason' },
      { path: 'clinic', select: 'name address contact' },
      { path: 'assignedStaff', select: 'name email phone' }
    ]);

    res.json({
      message: 'Check-in updated successfully',
      checkIn: updatedCheckIn
    });
  } catch (error) {
    console.error('Update check-in error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/checkin/waiting-list/:clinicId
// @desc    Get waiting list for a clinic
// @access  Private
router.get('/waiting-list/:clinicId', auth, async (req, res) => {
  try {
    const { clinicId } = req.params;

    // Verify clinic exists
    const clinic = await Clinic.findById(clinicId);
    if (!clinic) {
      return res.status(404).json({ message: 'Clinic not found' });
    }

    // Get waiting patients
    const waitingList = await CheckIn.find({
      clinic: clinicId,
      status: { $in: ['checked-in', 'waiting', 'in-consultation'] }
    })
      .populate('patient', 'name email phone')
      .populate('appointment', 'appointmentDate appointmentTime reason')
      .populate('assignedStaff', 'name email')
      .sort({ priority: -1, checkInTime: 1 });

    // Calculate wait times
    const waitingListWithWaitTimes = waitingList.map(checkIn => {
      const waitTime = checkIn.calculateWaitTime();
      return {
        ...checkIn.toObject(),
        waitTime
      };
    });

    res.json({
      clinic: clinic.name,
      waitingList: waitingListWithWaitTimes,
      totalWaiting: waitingList.length
    });
  } catch (error) {
    console.error('Get waiting list error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   DELETE /api/checkin/:id
// @desc    Cancel check-in
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const checkIn = await CheckIn.findById(req.params.id);
    if (!checkIn) {
      return res.status(404).json({ message: 'Check-in not found' });
    }

    // Check permissions
    if (req.user.role === 'patient' && checkIn.patient.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if check-in can be cancelled
    if (['completed', 'cancelled'].includes(checkIn.status)) {
      return res.status(400).json({ 
        message: 'Cannot cancel a completed or already cancelled check-in' 
      });
    }

    // Update status to cancelled
    checkIn.status = 'cancelled';
    checkIn.checkOutTime = new Date();
    await checkIn.save();

    res.json({ message: 'Check-in cancelled successfully' });
  } catch (error) {
    console.error('Cancel check-in error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router; 