const express = require('express');
const router = express.Router();
const { body, validationResult, query } = require('express-validator');
const { auth, authorize, isAdmin } = require('../middleware/auth');
const Clinic = require('../models/Clinic');
const User = require('../models/User');
const Appointment = require('../models/Appointment');

// @route   GET /api/clinic
// @desc    Get clinics with filtering and search
// @access  Public
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().trim().isLength({ min: 2 }).withMessage('Search term must be at least 2 characters'),
  query('specialty').optional().isIn(['general', 'cardiology', 'dermatology', 'pediatrics', 'orthopedics', 'neurology', 'psychiatry', 'gynecology', 'urology', 'ophthalmology', 'dentistry', 'emergency']),
  query('city').optional().trim().notEmpty().withMessage('City cannot be empty'),
  query('state').optional().trim().notEmpty().withMessage('State cannot be empty')
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
    const filter = { isActive: true };

    // Search functionality
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
        { 'address.city': { $regex: req.query.search, $options: 'i' } },
        { 'address.state': { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Filter by specialty
    if (req.query.specialty) {
      filter.specialties = req.query.specialty;
    }

    // Filter by location
    if (req.query.city) {
      filter['address.city'] = { $regex: req.query.city, $options: 'i' };
    }
    if (req.query.state) {
      filter['address.state'] = { $regex: req.query.state, $options: 'i' };
    }

    const clinics = await Clinic.find(filter)
      .select('name description address contact specialties rating services facilities')
      .sort({ 'rating.average': -1, name: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Clinic.countDocuments(filter);

    res.json({
      clinics,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalClinics: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get clinics error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/clinic/:id
// @desc    Get single clinic
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const clinic = await Clinic.findById(req.params.id)
      .populate('doctors', 'name email phone')
      .populate('staff', 'name email phone role');

    if (!clinic) {
      return res.status(404).json({ message: 'Clinic not found' });
    }

    res.json({ clinic });
  } catch (error) {
    console.error('Get clinic error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/clinic
// @desc    Create new clinic
// @access  Private (Admin only)
router.post('/', auth, isAdmin, [
  body('name').trim().isLength({ min: 2 }).withMessage('Clinic name must be at least 2 characters'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('address.street').trim().notEmpty().withMessage('Street address is required'),
  body('address.city').trim().notEmpty().withMessage('City is required'),
  body('address.state').trim().notEmpty().withMessage('State is required'),
  body('address.zipCode').trim().notEmpty().withMessage('ZIP code is required'),
  body('contact.phone').trim().isLength({ min: 10 }).withMessage('Valid phone number is required'),
  body('contact.email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('specialties').optional().isArray(),
  body('services').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const clinic = new Clinic(req.body);
    await clinic.save();

    res.status(201).json({
      message: 'Clinic created successfully',
      clinic
    });
  } catch (error) {
    console.error('Create clinic error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PUT /api/clinic/:id
// @desc    Update clinic
// @access  Private (Admin only)
router.put('/:id', auth, isAdmin, [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Clinic name must be at least 2 characters'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('address.street').optional().trim().notEmpty().withMessage('Street address is required'),
  body('address.city').optional().trim().notEmpty().withMessage('City is required'),
  body('address.state').optional().trim().notEmpty().withMessage('State is required'),
  body('address.zipCode').optional().trim().notEmpty().withMessage('ZIP code is required'),
  body('contact.phone').optional().trim().isLength({ min: 10 }).withMessage('Valid phone number is required'),
  body('contact.email').optional().isEmail().normalizeEmail().withMessage('Valid email is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const clinic = await Clinic.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!clinic) {
      return res.status(404).json({ message: 'Clinic not found' });
    }

    res.json({
      message: 'Clinic updated successfully',
      clinic
    });
  } catch (error) {
    console.error('Update clinic error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   DELETE /api/clinic/:id
// @desc    Delete clinic
// @access  Private (Admin only)
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    const clinic = await Clinic.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!clinic) {
      return res.status(404).json({ message: 'Clinic not found' });
    }

    res.json({ message: 'Clinic deactivated successfully' });
  } catch (error) {
    console.error('Delete clinic error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/clinic/:id/doctors
// @desc    Get doctors for a clinic
// @access  Public
router.get('/:id/doctors', async (req, res) => {
  try {
    const clinic = await Clinic.findById(req.params.id).populate('doctors', 'name email phone specialties');
    
    if (!clinic) {
      return res.status(404).json({ message: 'Clinic not found' });
    }

    res.json({ 
      clinic: clinic.name,
      doctors: clinic.doctors 
    });
  } catch (error) {
    console.error('Get clinic doctors error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/clinic/:id/appointments
// @desc    Get appointments for a clinic
// @access  Private
router.get('/:id/appointments', auth, [
  query('date').optional().isISO8601().withMessage('Valid date is required'),
  query('status').optional().isIn(['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { date, status } = req.query;

    // Verify clinic exists
    const clinic = await Clinic.findById(id);
    if (!clinic) {
      return res.status(404).json({ message: 'Clinic not found' });
    }

    // Build filter
    const filter = { clinic: id };
    if (date) {
      const appointmentDate = new Date(date);
      const nextDay = new Date(appointmentDate);
      nextDay.setDate(nextDay.getDate() + 1);
      filter.appointmentDate = {
        $gte: appointmentDate,
        $lt: nextDay
      };
    }
    if (status) {
      filter.status = status;
    }

    const appointments = await Appointment.find(filter)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name email phone')
      .sort({ appointmentDate: 1, appointmentTime: 1 });

    res.json({
      clinic: clinic.name,
      appointments,
      total: appointments.length
    });
  } catch (error) {
    console.error('Get clinic appointments error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/clinic/:id/doctors
// @desc    Add doctor to clinic
// @access  Private (Admin only)
router.post('/:id/doctors', auth, isAdmin, [
  body('doctorId').isMongoId().withMessage('Valid doctor ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { doctorId } = req.body;

    // Verify clinic exists
    const clinic = await Clinic.findById(id);
    if (!clinic) {
      return res.status(404).json({ message: 'Clinic not found' });
    }

    // Verify doctor exists
    const doctor = await User.findOne({ _id: doctorId, role: 'doctor', isActive: true });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Add doctor to clinic
    if (!clinic.doctors.includes(doctorId)) {
      clinic.doctors.push(doctorId);
      await clinic.save();
    }

    res.json({
      message: 'Doctor added to clinic successfully',
      clinic: clinic.name,
      doctor: doctor.name
    });
  } catch (error) {
    console.error('Add doctor to clinic error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   DELETE /api/clinic/:id/doctors/:doctorId
// @desc    Remove doctor from clinic
// @access  Private (Admin only)
router.delete('/:id/doctors/:doctorId', auth, isAdmin, async (req, res) => {
  try {
    const { id, doctorId } = req.params;

    const clinic = await Clinic.findById(id);
    if (!clinic) {
      return res.status(404).json({ message: 'Clinic not found' });
    }

    // Remove doctor from clinic
    clinic.doctors = clinic.doctors.filter(doc => doc.toString() !== doctorId);
    await clinic.save();

    res.json({ message: 'Doctor removed from clinic successfully' });
  } catch (error) {
    console.error('Remove doctor from clinic error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;