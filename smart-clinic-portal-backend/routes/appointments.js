const express = require('express');
const router = express.Router();
const { body, validationResult, query } = require('express-validator');
const { auth, authorize, isOwnerOrAdmin } = require('../middleware/auth');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Clinic = require('../models/Clinic');

// @route   GET /api/appointments
// @desc    Get appointments with filtering and pagination
// @access  Private
router.get('/', auth, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show']),
  query('type').optional().isIn(['consultation', 'follow-up', 'emergency', 'routine-checkup', 'vaccination']),
  query('date').optional().isISO8601().withMessage('Date must be in ISO format')
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
    if (req.query.type) filter.type = req.query.type;
    if (req.query.date) {
      const date = new Date(req.query.date);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      filter.appointmentDate = {
        $gte: date,
        $lt: nextDay
      };
    }

    const appointments = await Appointment.find(filter)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name email phone')
      .populate('clinic', 'name address')
      .sort({ appointmentDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Appointment.countDocuments(filter);

    res.json({
      appointments,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalAppointments: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/appointments/:id
// @desc    Get single appointment
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patient', 'name email phone dateOfBirth address emergencyContact medicalHistory allergies currentMedications')
      .populate('doctor', 'name email phone')
      .populate('clinic', 'name address contact')
      .populate('prescription');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check if user can access this appointment
    if (req.user.role === 'patient' && appointment.patient._id.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (req.user.role === 'doctor' && appointment.doctor._id.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ appointment });
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/appointments
// @desc    Create new appointment
// @access  Private
router.post('/', auth, [
  body('doctor').isMongoId().withMessage('Valid doctor ID is required'),
  body('clinic').isMongoId().withMessage('Valid clinic ID is required'),
  body('appointmentDate').isISO8601().withMessage('Valid appointment date is required'),
  body('appointmentTime').notEmpty().withMessage('Appointment time is required'),
  body('reason').trim().isLength({ min: 10, max: 500 }).withMessage('Reason must be between 10 and 500 characters'),
  body('type').optional().isIn(['consultation', 'follow-up', 'emergency', 'routine-checkup', 'vaccination']),
  body('symptoms').optional().isArray(),
  body('notes').optional().isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters')
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
      doctor,
      clinic,
      appointmentDate,
      appointmentTime,
      reason,
      type = 'consultation',
      symptoms = [],
      notes,
      duration = 30
    } = req.body;

    // Verify doctor exists and is active
    const doctorExists = await User.findOne({ _id: doctor, role: 'doctor', isActive: true });
    if (!doctorExists) {
      return res.status(400).json({ message: 'Doctor not found or inactive' });
    }

    // Verify clinic exists and is active
    const clinicExists = await Clinic.findOne({ _id: clinic, isActive: true });
    if (!clinicExists) {
      return res.status(400).json({ message: 'Clinic not found or inactive' });
    }

    // Check for conflicting appointments
    const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
    const endTime = new Date(appointmentDateTime.getTime() + duration * 60000);

    const conflictingAppointment = await Appointment.findOne({
      doctor,
      appointmentDate: new Date(appointmentDate),
      $or: [
        {
          appointmentTime: {
            $gte: appointmentTime,
            $lt: endTime.toTimeString().slice(0, 5)
          }
        }
      ],
      status: { $in: ['scheduled', 'confirmed', 'in-progress'] }
    });

    if (conflictingAppointment) {
      return res.status(400).json({ 
        message: 'Doctor has a conflicting appointment at this time' 
      });
    }

    // Create appointment
    const appointment = new Appointment({
      patient: req.user.userId,
      doctor,
      clinic,
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      duration,
      reason,
      type,
      symptoms,
      notes
    });

    await appointment.save();

    // Populate the appointment for response
    await appointment.populate([
      { path: 'patient', select: 'name email phone' },
      { path: 'doctor', select: 'name email phone' },
      { path: 'clinic', select: 'name address contact' }
    ]);

    res.status(201).json({
      message: 'Appointment created successfully',
      appointment
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PUT /api/appointments/:id
// @desc    Update appointment
// @access  Private
router.put('/:id', auth, [
  body('appointmentDate').optional().isISO8601().withMessage('Valid appointment date is required'),
  body('appointmentTime').optional().notEmpty().withMessage('Appointment time is required'),
  body('reason').optional().trim().isLength({ min: 10, max: 500 }).withMessage('Reason must be between 10 and 500 characters'),
  body('status').optional().isIn(['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show']),
  body('notes').optional().isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check permissions
    if (req.user.role === 'patient' && appointment.patient.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (req.user.role === 'doctor' && appointment.doctor.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update allowed fields
    const allowedUpdates = ['appointmentDate', 'appointmentTime', 'reason', 'status', 'notes', 'symptoms'];
    const updates = {};

    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    // Handle status changes
    if (updates.status === 'in-progress') {
      updates.checkInTime = new Date();
    }
    if (updates.status === 'completed') {
      updates.checkOutTime = new Date();
    }

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate([
      { path: 'patient', select: 'name email phone' },
      { path: 'doctor', select: 'name email phone' },
      { path: 'clinic', select: 'name address contact' }
    ]);

    res.json({
      message: 'Appointment updated successfully',
      appointment: updatedAppointment
    });
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   DELETE /api/appointments/:id
// @desc    Cancel appointment
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check permissions
    if (req.user.role === 'patient' && appointment.patient.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (req.user.role === 'doctor' && appointment.doctor.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if appointment can be cancelled
    if (['completed', 'cancelled'].includes(appointment.status)) {
      return res.status(400).json({ 
        message: 'Cannot cancel a completed or already cancelled appointment' 
      });
    }

    // Update status to cancelled
    appointment.status = 'cancelled';
    await appointment.save();

    res.json({ message: 'Appointment cancelled successfully' });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/appointments/available-slots
// @desc    Get available appointment slots for a doctor on a specific date
// @access  Private
router.get('/available-slots/:doctorId', auth, [
  query('date').isISO8601().withMessage('Valid date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { doctorId } = req.params;
    const { date } = req.query;

    // Verify doctor exists
    const doctor = await User.findOne({ _id: doctorId, role: 'doctor', isActive: true });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Get existing appointments for the date
    const appointments = await Appointment.find({
      doctor: doctorId,
      appointmentDate: new Date(date),
      status: { $in: ['scheduled', 'confirmed', 'in-progress'] }
    }).select('appointmentTime duration');

    // Generate available time slots (9 AM to 5 PM, 30-minute intervals)
    const slots = [];
    const startHour = 9;
    const endHour = 17;
    const slotDuration = 30; // minutes

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minutes = 0; minutes < 60; minutes += slotDuration) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        
        // Check if this slot is available
        const isBooked = appointments.some(apt => {
          const aptTime = apt.appointmentTime;
          const aptEndTime = new Date(`2000-01-01T${aptTime}`);
          aptEndTime.setMinutes(aptEndTime.getMinutes() + apt.duration);
          const slotTime = new Date(`2000-01-01T${timeString}`);
          
          return slotTime >= new Date(`2000-01-01T${aptTime}`) && 
                 slotTime < aptEndTime;
        });

        if (!isBooked) {
          slots.push(timeString);
        }
      }
    }

    res.json({ 
      doctor: doctor.name,
      date,
      availableSlots: slots 
    });
  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
