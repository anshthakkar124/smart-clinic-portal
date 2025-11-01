const express = require('express');
const router = express.Router();
const { body, validationResult, query } = require('express-validator');
const { auth, isSuperAdmin, isAdmin, multiTenant } = require('../middleware/auth');
const Organization = require('../models/Organization');
const User = require('../models/User');

// @route   GET /api/organizations
// @desc    Get organizations with filtering and search
// @access  Private (SuperAdmin, Admin, Patient)
router.get('/', auth, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().trim().isLength({ min: 2 }).withMessage('Search term must be at least 2 characters'),
  query('type').optional().isIn(['clinic', 'hospital', 'medical_center', 'pharmacy']),
  query('city').optional().trim().notEmpty().withMessage('City cannot be empty'),
  query('state').optional().trim().notEmpty().withMessage('State cannot be empty'),
  query('specialty').optional().isIn(['general', 'cardiology', 'dermatology', 'pediatrics', 'orthopedics', 'neurology', 'psychiatry', 'gynecology', 'urology', 'ophthalmology', 'dentistry', 'emergency'])
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

    // Role-based filtering
    if (req.user.role === 'admin' || req.user.role === 'doctor') {
      filter._id = req.userData.organizationId._id;
    }

    // Search functionality
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
        { 'address.city': { $regex: req.query.search, $options: 'i' } },
        { 'address.state': { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Filter by type
    if (req.query.type) {
      filter.type = req.query.type;
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

    const organizations = await Organization.find(filter)
      .select('name description type address contact specialties rating services settings isActive subscription')
      .populate('createdBy', 'name email')
      .sort({ 'rating.average': -1, name: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Organization.countDocuments(filter);

    res.json({
      organizations,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalOrganizations: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get organizations error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/organizations/:id
// @desc    Get single organization
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const organization = await Organization.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    // Check access permissions
    if (req.user.role === 'admin' || req.user.role === 'doctor') {
      if (organization._id.toString() !== req.userData.organizationId._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.json({ organization });
  } catch (error) {
    console.error('Get organization error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/organizations
// @desc    Create new organization
// @access  Private (SuperAdmin only)
router.post('/', auth, isSuperAdmin, [
  body('name').trim().isLength({ min: 2 }).withMessage('Organization name must be at least 2 characters'),
  body('type').isIn(['clinic', 'hospital', 'medical_center', 'pharmacy']).withMessage('Invalid organization type'),
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

    const organizationData = {
      ...req.body,
      createdBy: req.user.userId
    };

    const organization = new Organization(organizationData);
    await organization.save();

    res.status(201).json({
      message: 'Organization created successfully',
      organization
    });
  } catch (error) {
    console.error('Create organization error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PUT /api/organizations/:id
// @desc    Update organization
// @access  Private (SuperAdmin, Admin)
router.put('/:id', auth, [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Organization name must be at least 2 characters'),
  body('type').optional().isIn(['clinic', 'hospital', 'medical_center', 'pharmacy']).withMessage('Invalid organization type'),
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

    const organization = await Organization.findById(req.params.id);
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    // Check permissions
    if (req.user.role === 'admin') {
      if (organization._id.toString() !== req.userData.organizationId._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const updatedOrganization = await Organization.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    res.json({
      message: 'Organization updated successfully',
      organization: updatedOrganization
    });
  } catch (error) {
    console.error('Update organization error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   DELETE /api/organizations/:id
// @desc    Delete organization
// @access  Private (SuperAdmin only)
router.delete('/:id', auth, isSuperAdmin, async (req, res) => {
  try {
    const organization = await Organization.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    res.json({ message: 'Organization deactivated successfully' });
  } catch (error) {
    console.error('Delete organization error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/organizations/:id/users
// @desc    Get users for an organization
// @access  Private (SuperAdmin, Admin)
router.get('/:id/users', auth, async (req, res) => {
  try {
    const organization = await Organization.findById(req.params.id);
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    // Check permissions
    if (req.user.role === 'admin') {
      if (organization._id.toString() !== req.userData.organizationId._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const users = await User.find({ 
      organizationId: req.params.id,
      isActive: true 
    }).select('name email role phone createdAt');

    res.json({
      organization: organization.name,
      users,
      total: users.length
    });
  } catch (error) {
    console.error('Get organization users error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/organizations/:id/users
// @desc    Add user to organization
// @access  Private (SuperAdmin, Admin)
router.post('/:id/users', auth, [
  body('userId').isMongoId().withMessage('Valid user ID is required')
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
    const { userId } = req.body;

    // Check permissions
    if (req.user.role === 'admin') {
      if (id !== req.userData.organizationId._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    // Verify organization exists
    const organization = await Organization.findById(id);
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    // Verify user exists
    const user = await User.findOne({ _id: userId, isActive: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user's organization
    user.organizationId = id;
    await user.save();

    res.json({
      message: 'User added to organization successfully',
      organization: organization.name,
      user: user.name
    });
  } catch (error) {
    console.error('Add user to organization error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
