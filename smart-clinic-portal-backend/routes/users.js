const express = require('express');
const router = express.Router();
const { body, validationResult, query } = require('express-validator');
const { auth } = require('../middleware/auth');
const User = require('../models/User');

// GET /api/users (supports filtering)
router.get('/', auth, [
  query('role').optional().isIn(['superadmin', 'admin', 'doctor', 'patient']),
  query('isActive').optional().isBoolean().toBoolean(),
  query('search').optional().trim().isLength({ min: 2 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const filter = {};

    if (req.query.role) {
      filter.role = req.query.role;
    }

    // Apply organization filter only if not requesting patients (since patients don't have organizationId)
    if (req.query.organizationId && req.query.role !== 'patient') {
      filter.organizationId = req.query.organizationId;
    } else if (['admin', 'doctor'].includes(req.user.role) && req.userData?.organizationId && (!req.query.role || req.query.role !== 'patient')) {
      filter.organizationId = req.userData.organizationId._id;
    }

    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive;
    }

    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { phone: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('name email role phone isActive organizationId createdAt')
      .sort({ name: 1 });

    res.json({ users, total: users.length });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/users (create user by admin/superadmin)
router.post('/', auth, [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').trim().isLength({ min: 10 }).withMessage('Phone number must be at least 10 digits'),
  body('dateOfBirth').isISO8601().withMessage('Valid date of birth is required'),
  body('role').isIn(['admin','doctor','patient']).withMessage('Invalid role'),
  body('organizationId').optional().isMongoId().withMessage('Valid organization ID is required when provided'),
  body('address.street').trim().notEmpty().withMessage('Street address is required'),
  body('address.city').trim().notEmpty().withMessage('City is required'),
  body('address.state').trim().notEmpty().withMessage('State is required'),
  body('address.zipCode').trim().notEmpty().withMessage('Zip code is required'),
  body('emergencyContact.name').trim().notEmpty().withMessage('Emergency contact name is required'),
  body('emergencyContact.phone').trim().isLength({ min: 10 }).withMessage('Emergency contact phone is required'),
  body('emergencyContact.relationship').trim().notEmpty().withMessage('Emergency contact relationship is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const {
      name,
      email,
      password,
      phone,
      dateOfBirth,
      role,
      organizationId,
      address,
      emergencyContact,
      medicalHistory = [],
      allergies = [],
      currentMedications = []
    } = req.body;

    // Permissions: admins can only create doctors within their organization
    let assignedOrganization = organizationId;
    if (req.user.role === 'admin') {
      if (!req.userData?.organizationId) {
        return res.status(400).json({ message: 'Organization context missing for admin user' });
      }
      if (role !== 'doctor') {
        return res.status(403).json({ message: 'Clinic admins can only create doctor accounts' });
      }
      assignedOrganization = req.userData.organizationId._id;
    }

    if (role !== 'patient' && !assignedOrganization) {
      return res.status(400).json({ message: 'Organization is required for non-patient roles' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone,
      dateOfBirth,
      role,
      organizationId: role !== 'patient' ? assignedOrganization : undefined,
      address,
      emergencyContact,
      medicalHistory,
      allergies,
      currentMedications
    });

    const sanitized = user.toObject();
    delete sanitized.password;

    res.status(201).json({ message: 'User created successfully', user: sanitized });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/users/:id (update user fields)
router.put('/:id', auth, [
  body('name').optional().trim().isLength({ min: 2 }),
  body('email').optional().isEmail(),
  body('phone').optional().trim().isLength({ min: 10 }),
  body('role').optional().isIn(['patient','doctor','admin','superadmin']),
  body('isActive').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Permission checks
    if (req.user.role === 'admin') {
      if (!req.userData?.organizationId || !targetUser.organizationId ||
        targetUser.organizationId.toString() !== req.userData.organizationId._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
      if (['superadmin', 'admin'].includes(targetUser.role) && targetUser._id.toString() !== req.user.userId) {
        return res.status(403).json({ message: 'Clinic admins can only manage doctor accounts' });
      }
      if (req.body.role && req.body.role !== 'doctor') {
        return res.status(403).json({ message: 'Clinic admins cannot change role' });
      }
    }

    if (req.body.email && req.body.email !== targetUser.email) {
      const emailExists = await User.findOne({ email: req.body.email });
      if (emailExists) {
        return res.status(400).json({ message: 'Another user already uses this email' });
      }
    }

    const allowed = ['name','email','phone','role','isActive'];
    const updates = {};
    Object.keys(req.body).forEach(k => { if (allowed.includes(k)) updates[k] = req.body[k]; });

    const updated = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
      .select('name email role phone isActive organizationId');

    res.json({ message: 'User updated', user: updated });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


