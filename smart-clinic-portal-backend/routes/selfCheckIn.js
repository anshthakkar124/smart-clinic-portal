const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { auth, multiTenant } = require('../middleware/auth');
const SelfCheckIn = require('../models/SelfCheckIn');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const notificationService = require('../services/NotificationService');

// @route   GET /api/self-checkin
// @desc    Get self-check-ins for user or organization
// @access  Private
router.get('/', auth, multiTenant, async (req, res) => {
  try {
    const {
      patientId,
      appointmentId,
      status,
      riskLevel,
      flagged,
      limit = 20,
      skip = 0,
      sortBy = 'checkInDate',
      sortOrder = 'desc'
    } = req.query;

    let query = {};

    // Role-based filtering
    if (req.userData.role === 'patient') {
      query.patient = req.user.userId;
    } else if (req.userData.role === 'doctor' || req.userData.role === 'admin') {
      query.organizationId = req.userData.organizationId._id;
    } else if (req.userData.role === 'superadmin') {
      // SuperAdmin can see all
    }

    // Additional filters
    if (patientId) query.patient = patientId;
    if (appointmentId) query.appointment = appointmentId;
    if (status) query.status = status;
    if (riskLevel) query['assessmentResults.riskLevel'] = riskLevel;
    if (flagged === 'true') query['assessmentResults.flaggedForReview'] = true;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const checkIns = await SelfCheckIn.find(query)
      .populate('patient', 'name email phone')
      .populate('appointment', 'date startTime endTime reason')
      .populate('organizationId', 'name')
      .populate('assessmentResults.assessedBy', 'name')
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await SelfCheckIn.countDocuments(query);

    res.json({
      checkIns,
      total,
      hasMore: checkIns.length === parseInt(limit)
    });
  } catch (error) {
    console.error('Error fetching self-check-ins:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/self-checkin/:id
// @desc    Get specific self-check-in
// @access  Private
router.get('/:id', auth, multiTenant, async (req, res) => {
  try {
    const checkIn = await SelfCheckIn.findById(req.params.id)
      .populate('patient', 'name email phone dateOfBirth')
      .populate('appointment', 'date startTime endTime reason')
      .populate('organizationId', 'name')
      .populate('assessmentResults.assessedBy', 'name');

    if (!checkIn) {
      return res.status(404).json({ message: 'Self-check-in not found' });
    }

    // Check access permissions
    if (req.userData.role === 'patient' && checkIn.patient._id.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if ((req.userData.role === 'doctor' || req.userData.role === 'admin') && 
        checkIn.organizationId._id.toString() !== req.userData.organizationId._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(checkIn);
  } catch (error) {
    console.error('Error fetching self-check-in:', error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/self-checkin
// @desc    Create new self-check-in
// @access  Private (Patient)
router.post('/', [
  auth,
  multiTenant,
  body('appointmentId').isMongoId().withMessage('Valid appointment ID is required'),
  body('consentGiven').isBoolean().withMessage('Consent must be given'),
  body('dataSharingConsent').isBoolean().withMessage('Data sharing consent is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { appointmentId, ...checkInData } = req.body;

    // Verify appointment exists and belongs to patient
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.patient.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if check-in already exists for this appointment
    const existingCheckIn = await SelfCheckIn.findOne({ appointment: appointmentId });
    if (existingCheckIn) {
      return res.status(400).json({ message: 'Self-check-in already exists for this appointment' });
    }

    const selfCheckIn = new SelfCheckIn({
      ...checkInData,
      patient: req.user.userId,
      appointment: appointmentId,
      organizationId: appointment.organizationId,
      consentGiven: checkInData.consentGiven,
      dataSharingConsent: checkInData.dataSharingConsent
    });

    await selfCheckIn.save();

    // Populate the response
    await selfCheckIn.populate([
      { path: 'patient', select: 'name email phone' },
      { path: 'appointment', select: 'date startTime endTime reason' },
      { path: 'organizationId', select: 'name' }
    ]);

    res.status(201).json({
      message: 'Self-check-in created successfully',
      checkIn: selfCheckIn
    });
  } catch (error) {
    console.error('Error creating self-check-in:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/self-checkin/:id
// @desc    Update self-check-in
// @access  Private
router.put('/:id', [
  auth,
  multiTenant,
  body('consentGiven').optional().isBoolean().withMessage('Consent must be boolean'),
  body('dataSharingConsent').optional().isBoolean().withMessage('Data sharing consent must be boolean')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const checkIn = await SelfCheckIn.findById(req.params.id);
    if (!checkIn) {
      return res.status(404).json({ message: 'Self-check-in not found' });
    }

    // Check access permissions
    if (req.userData.role === 'patient' && checkIn.patient.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if ((req.userData.role === 'doctor' || req.userData.role === 'admin') && 
        checkIn.organizationId.toString() !== req.userData.organizationId._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update fields
    const updatedCheckIn = await SelfCheckIn.findByIdAndUpdate(
      req.params.id,
      { 
        ...req.body,
        status: req.body.status || 'completed'
      },
      { new: true, runValidators: true }
    ).populate([
      { path: 'patient', select: 'name email phone' },
      { path: 'appointment', select: 'date startTime endTime reason' },
      { path: 'organizationId', select: 'name' }
    ]);

    // Send notification if flagged for review
    if (updatedCheckIn.assessmentResults.flaggedForReview && 
        updatedCheckIn.assessmentResults.riskLevel === 'critical') {
      
      const appointment = await Appointment.findById(updatedCheckIn.appointment);
      const doctor = await User.findById(appointment.doctor);
      
      await notificationService.createNotification({
        recipient: appointment.doctor,
        organizationId: appointment.organizationId,
        type: 'check_in_completed',
        title: 'Critical Self-Check-in Alert',
        message: `${updatedCheckIn.patient.name} has completed a self-check-in with critical risk level. Immediate review required.`,
        data: {
          checkInId: updatedCheckIn._id,
          appointmentId: appointment._id,
          metadata: {
            riskLevel: updatedCheckIn.assessmentResults.riskLevel,
            patientName: updatedCheckIn.patient.name
          }
        },
        priority: 'urgent',
        category: 'system',
        actionRequired: true,
        actionUrl: `/self-checkin/${updatedCheckIn._id}`,
        actionText: 'Review Check-in'
      });
    }

    res.json({
      message: 'Self-check-in updated successfully',
      checkIn: updatedCheckIn
    });
  } catch (error) {
    console.error('Error updating self-check-in:', error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/self-checkin/:id/review
// @desc    Review self-check-in (Doctor/Admin)
// @access  Private (Doctor/Admin)
router.put('/:id/review', [
  auth,
  multiTenant,
  body('reviewNotes').optional().isString().withMessage('Review notes must be a string'),
  body('riskLevel').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid risk level')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    if (req.userData.role !== 'doctor' && req.userData.role !== 'admin' && req.userData.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const checkIn = await SelfCheckIn.findById(req.params.id);
    if (!checkIn) {
      return res.status(404).json({ message: 'Self-check-in not found' });
    }

    // Check organization access
    if (req.userData.role !== 'superadmin' && 
        checkIn.organizationId.toString() !== req.userData.organizationId._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updatedCheckIn = await SelfCheckIn.findByIdAndUpdate(
      req.params.id,
      {
        'assessmentResults.assessedBy': req.user.userId,
        'assessmentResults.assessmentDate': new Date(),
        'assessmentResults.reviewNotes': req.body.reviewNotes,
        'assessmentResults.riskLevel': req.body.riskLevel || checkIn.assessmentResults.riskLevel,
        'assessmentResults.flaggedForReview': false,
        status: 'reviewed'
      },
      { new: true, runValidators: true }
    ).populate([
      { path: 'patient', select: 'name email phone' },
      { path: 'appointment', select: 'date startTime endTime reason' },
      { path: 'organizationId', select: 'name' },
      { path: 'assessmentResults.assessedBy', select: 'name' }
    ]);

    res.json({
      message: 'Self-check-in reviewed successfully',
      checkIn: updatedCheckIn
    });
  } catch (error) {
    console.error('Error reviewing self-check-in:', error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/self-checkin/:id
// @desc    Delete self-check-in
// @access  Private (Patient or Admin)
router.delete('/:id', auth, multiTenant, async (req, res) => {
  try {
    const checkIn = await SelfCheckIn.findById(req.params.id);
    if (!checkIn) {
      return res.status(404).json({ message: 'Self-check-in not found' });
    }

    // Check access permissions
    if (req.userData.role === 'patient' && checkIn.patient.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if ((req.userData.role === 'doctor' || req.userData.role === 'admin') && 
        checkIn.organizationId.toString() !== req.userData.organizationId._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await SelfCheckIn.findByIdAndDelete(req.params.id);

    res.json({ message: 'Self-check-in deleted successfully' });
  } catch (error) {
    console.error('Error deleting self-check-in:', error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/self-checkin/stats/overview
// @desc    Get self-check-in statistics
// @access  Private (Admin/Doctor/SuperAdmin)
router.get('/stats/overview', auth, multiTenant, async (req, res) => {
  try {
    if (req.userData.role !== 'admin' && req.userData.role !== 'doctor' && req.userData.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    let query = {};
    
    if (req.userData.role !== 'superadmin') {
      query.organizationId = req.userData.organizationId._id;
    }

    const [
      totalCheckIns,
      completedCheckIns,
      flaggedCheckIns,
      riskLevelStats,
      recentCheckIns
    ] = await Promise.all([
      SelfCheckIn.countDocuments(query),
      SelfCheckIn.countDocuments({ ...query, status: 'completed' }),
      SelfCheckIn.countDocuments({ ...query, 'assessmentResults.flaggedForReview': true }),
      SelfCheckIn.aggregate([
        { $match: query },
        { $group: { _id: '$assessmentResults.riskLevel', count: { $sum: 1 } } }
      ]),
      SelfCheckIn.find(query)
        .populate('patient', 'name')
        .populate('appointment', 'date startTime')
        .sort({ checkInDate: -1 })
        .limit(5)
    ]);

    res.json({
      totalCheckIns,
      completedCheckIns,
      flaggedCheckIns,
      riskLevelStats,
      recentCheckIns,
      completionRate: totalCheckIns > 0 ? Math.round((completedCheckIns / totalCheckIns) * 100) : 0
    });
  } catch (error) {
    console.error('Error fetching self-check-in stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
