const express = require('express');
const router = express.Router();
const { auth, multiTenant } = require('../middleware/auth');
const User = require('../models/User');
const Organization = require('../models/Organization');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');
const SelfCheckIn = require('../models/SelfCheckIn');
const Notification = require('../models/Notification');

// @route   GET /api/analytics/overview
// @desc    Get overview analytics for dashboard
// @access  Private (Admin/Doctor/SuperAdmin)
router.get('/overview', auth, multiTenant, async (req, res) => {
  try {
    if (req.userData.role !== 'admin' && req.userData.role !== 'doctor' && req.userData.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    let organizationFilter = {};
    if (req.userData.role !== 'superadmin') {
      organizationFilter.organizationId = req.userData.organizationId._id;
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get basic counts
    const [
      totalUsers,
      totalAppointments,
      totalPrescriptions,
      totalCheckIns,
      monthlyAppointments,
      monthlyPrescriptions,
      monthlyCheckIns,
      lastMonthAppointments,
      lastMonthPrescriptions,
      lastMonthCheckIns
    ] = await Promise.all([
      User.countDocuments(organizationFilter),
      Appointment.countDocuments(organizationFilter),
      Prescription.countDocuments(organizationFilter),
      SelfCheckIn.countDocuments(organizationFilter),
      
      // Current month
      Appointment.countDocuments({ ...organizationFilter, createdAt: { $gte: startOfMonth } }),
      Prescription.countDocuments({ ...organizationFilter, createdAt: { $gte: startOfMonth } }),
      SelfCheckIn.countDocuments({ ...organizationFilter, createdAt: { $gte: startOfMonth } }),
      
      // Last month
      Appointment.countDocuments({ ...organizationFilter, createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
      Prescription.countDocuments({ ...organizationFilter, createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
      SelfCheckIn.countDocuments({ ...organizationFilter, createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } })
    ]);

    // Calculate growth percentages
    const appointmentGrowth = lastMonthAppointments > 0 
      ? Math.round(((monthlyAppointments - lastMonthAppointments) / lastMonthAppointments) * 100)
      : 0;
    
    const prescriptionGrowth = lastMonthPrescriptions > 0 
      ? Math.round(((monthlyPrescriptions - lastMonthPrescriptions) / lastMonthPrescriptions) * 100)
      : 0;
    
    const checkInGrowth = lastMonthCheckIns > 0 
      ? Math.round(((monthlyCheckIns - lastMonthCheckIns) / lastMonthCheckIns) * 100)
      : 0;

    res.json({
      overview: {
        totalUsers,
        totalAppointments,
        totalPrescriptions,
        totalCheckIns
      },
      monthlyStats: {
        appointments: monthlyAppointments,
        prescriptions: monthlyPrescriptions,
        checkIns: monthlyCheckIns
      },
      growth: {
        appointments: appointmentGrowth,
        prescriptions: prescriptionGrowth,
        checkIns: checkInGrowth
      }
    });
  } catch (error) {
    console.error('Error fetching overview analytics:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/analytics/appointments
// @desc    Get appointment analytics
// @access  Private (Admin/Doctor/SuperAdmin)
router.get('/appointments', auth, multiTenant, async (req, res) => {
  try {
    if (req.userData.role !== 'admin' && req.userData.role !== 'doctor' && req.userData.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    let organizationFilter = {};
    if (req.userData.role !== 'superadmin') {
      organizationFilter.organizationId = req.userData.organizationId._id;
    }

    const { period = '30d' } = req.query;
    let dateFilter = {};
    
    if (period === '7d') {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      dateFilter = { createdAt: { $gte: sevenDaysAgo } };
    } else if (period === '30d') {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      dateFilter = { createdAt: { $gte: thirtyDaysAgo } };
    } else if (period === '90d') {
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      dateFilter = { createdAt: { $gte: ninetyDaysAgo } };
    } else if (period === '1y') {
      const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      dateFilter = { createdAt: { $gte: oneYearAgo } };
    }

    const filter = { ...organizationFilter, ...dateFilter };

    // Appointment status distribution
    const statusDistribution = await Appointment.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Daily appointment trends
    const dailyTrends = await Appointment.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
      { $limit: 30 }
    ]);

    // Top doctors by appointment count
    const topDoctors = await Appointment.aggregate([
      { $match: filter },
      { $group: { _id: '$doctor', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'doctorInfo'
        }
      },
      {
        $project: {
          doctorName: { $arrayElemAt: ['$doctorInfo.name', 0] },
          count: 1
        }
      }
    ]);

    // Appointment completion rate
    const completionStats = await Appointment.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: {
            $sum: {
              $cond: [{ $in: ['$status', ['completed', 'confirmed']] }, 1, 0]
            }
          },
          cancelled: {
            $sum: {
              $cond: [{ $in: ['$status', ['cancelled', 'rejected']] }, 1, 0]
            }
          }
        }
      }
    ]);

    res.json({
      statusDistribution,
      dailyTrends,
      topDoctors,
      completionStats: completionStats[0] || { total: 0, completed: 0, cancelled: 0 }
    });
  } catch (error) {
    console.error('Error fetching appointment analytics:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/analytics/prescriptions
// @desc    Get prescription analytics
// @access  Private (Admin/Doctor/SuperAdmin)
router.get('/prescriptions', auth, multiTenant, async (req, res) => {
  try {
    if (req.userData.role !== 'admin' && req.userData.role !== 'doctor' && req.userData.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    let organizationFilter = {};
    if (req.userData.role !== 'superadmin') {
      organizationFilter.organizationId = req.userData.organizationId._id;
    }

    const { period = '30d' } = req.query;
    let dateFilter = {};
    
    if (period === '7d') {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      dateFilter = { createdAt: { $gte: sevenDaysAgo } };
    } else if (period === '30d') {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      dateFilter = { createdAt: { $gte: thirtyDaysAgo } };
    } else if (period === '90d') {
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      dateFilter = { createdAt: { $gte: ninetyDaysAgo } };
    } else if (period === '1y') {
      const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      dateFilter = { createdAt: { $gte: oneYearAgo } };
    }

    const filter = { ...organizationFilter, ...dateFilter };

    // Prescription status distribution
    const statusDistribution = await Prescription.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            $cond: [
              { $lt: ['$expiryDate', new Date()] },
              'expired',
              { $cond: ['$isDispensed', 'dispensed', 'active'] }
            ]
          },
          count: { $sum: 1 }
        }
      }
    ]);

    // Monthly prescription trends
    const monthlyTrends = await Prescription.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);

    // Top prescribed medications
    const topMedications = await Prescription.aggregate([
      { $match: filter },
      { $unwind: '$medications' },
      {
        $group: {
          _id: '$medications.name',
          count: { $sum: 1 },
          totalDosage: { $sum: { $toInt: { $substr: ['$medications.dosage', 0, 3] } } }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Prescription expiry analysis
    const expiryAnalysis = await Prescription.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          expiringSoon: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ['$expiryDate', new Date()] },
                    { $lte: ['$expiryDate', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)] }
                  ]
                },
                1,
                0
              ]
            }
          },
          expired: {
            $sum: {
              $cond: [{ $lt: ['$expiryDate', new Date()] }, 1, 0]
            }
          }
        }
      }
    ]);

    res.json({
      statusDistribution,
      monthlyTrends,
      topMedications,
      expiryAnalysis: expiryAnalysis[0] || { total: 0, expiringSoon: 0, expired: 0 }
    });
  } catch (error) {
    console.error('Error fetching prescription analytics:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/analytics/self-checkins
// @desc    Get self-check-in analytics
// @access  Private (Admin/Doctor/SuperAdmin)
router.get('/self-checkins', auth, multiTenant, async (req, res) => {
  try {
    if (req.userData.role !== 'admin' && req.userData.role !== 'doctor' && req.userData.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    let organizationFilter = {};
    if (req.userData.role !== 'superadmin') {
      organizationFilter.organizationId = req.userData.organizationId._id;
    }

    const { period = '30d' } = req.query;
    let dateFilter = {};
    
    if (period === '7d') {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      dateFilter = { createdAt: { $gte: sevenDaysAgo } };
    } else if (period === '30d') {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      dateFilter = { createdAt: { $gte: thirtyDaysAgo } };
    } else if (period === '90d') {
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      dateFilter = { createdAt: { $gte: ninetyDaysAgo } };
    } else if (period === '1y') {
      const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      dateFilter = { createdAt: { $gte: oneYearAgo } };
    }

    const filter = { ...organizationFilter, ...dateFilter };

    // Risk level distribution
    const riskDistribution = await SelfCheckIn.aggregate([
      { $match: filter },
      { $group: { _id: '$assessmentResults.riskLevel', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Completion rate analysis
    const completionAnalysis = await SelfCheckIn.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          flagged: {
            $sum: { $cond: ['$assessmentResults.flaggedForReview', 1, 0] }
          },
          avgCompletionTime: { $avg: '$timeSpent' }
        }
      }
    ]);

    // COVID screening results
    const covidScreening = await SelfCheckIn.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          hasSymptoms: {
            $sum: { $cond: ['$covidScreening.hasSymptoms', 1, 0] }
          },
          hasBeenExposed: {
            $sum: { $cond: ['$covidScreening.hasBeenExposed', 1, 0] }
          },
          isVaccinated: {
            $sum: { $cond: ['$covidScreening.isVaccinated', 1, 0] }
          }
        }
      }
    ]);

    // Mental health trends
    const mentalHealthTrends = await SelfCheckIn.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          avgMoodRating: { $avg: '$mentalHealth.moodRating' },
          avgAnxietyLevel: { $avg: '$mentalHealth.anxietyLevel' },
          avgSleepQuality: { $avg: '$mentalHealth.sleepQuality' },
          avgStressLevel: { $avg: '$mentalHealth.stressLevel' },
          hasConcerns: {
            $sum: { $cond: ['$mentalHealth.hasMentalHealthConcerns', 1, 0] }
          }
        }
      }
    ]);

    res.json({
      riskDistribution,
      completionAnalysis: completionAnalysis[0] || { total: 0, completed: 0, flagged: 0, avgCompletionTime: 0 },
      covidScreening: covidScreening[0] || { total: 0, hasSymptoms: 0, hasBeenExposed: 0, isVaccinated: 0 },
      mentalHealthTrends: mentalHealthTrends[0] || { avgMoodRating: 0, avgAnxietyLevel: 0, avgSleepQuality: 0, avgStressLevel: 0, hasConcerns: 0 }
    });
  } catch (error) {
    console.error('Error fetching self-check-in analytics:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/analytics/users
// @desc    Get user analytics
// @access  Private (Admin/SuperAdmin)
router.get('/users', auth, multiTenant, async (req, res) => {
  try {
    if (req.userData.role !== 'admin' && req.userData.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    let organizationFilter = {};
    if (req.userData.role !== 'superadmin') {
      organizationFilter.organizationId = req.userData.organizationId._id;
    }

    // User role distribution
    const roleDistribution = await User.aggregate([
      { $match: organizationFilter },
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // User registration trends
    const registrationTrends = await User.aggregate([
      { $match: organizationFilter },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);

    // Active vs inactive users
    const activityStats = await User.aggregate([
      { $match: organizationFilter },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: ['$isActive', 1, 0] } },
          inactive: { $sum: { $cond: ['$isActive', 0, 1] } }
        }
      }
    ]);

    res.json({
      roleDistribution,
      registrationTrends,
      activityStats: activityStats[0] || { total: 0, active: 0, inactive: 0 }
    });
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/analytics/notifications
// @desc    Get notification analytics
// @access  Private (Admin/SuperAdmin)
router.get('/notifications', auth, multiTenant, async (req, res) => {
  try {
    if (req.userData.role !== 'admin' && req.userData.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    let organizationFilter = {};
    if (req.userData.role !== 'superadmin') {
      organizationFilter.organizationId = req.userData.organizationId._id;
    }

    const { period = '30d' } = req.query;
    let dateFilter = {};
    
    if (period === '7d') {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      dateFilter = { createdAt: { $gte: sevenDaysAgo } };
    } else if (period === '30d') {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      dateFilter = { createdAt: { $gte: thirtyDaysAgo } };
    } else if (period === '90d') {
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      dateFilter = { createdAt: { $gte: ninetyDaysAgo } };
    } else if (period === '1y') {
      const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      dateFilter = { createdAt: { $gte: oneYearAgo } };
    }

    const filter = { ...organizationFilter, ...dateFilter };

    // Notification type distribution
    const typeDistribution = await Notification.aggregate([
      { $match: filter },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Priority distribution
    const priorityDistribution = await Notification.aggregate([
      { $match: filter },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Read vs unread statistics
    const readStats = await Notification.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          read: { $sum: { $cond: ['$isRead', 1, 0] } },
          unread: { $sum: { $cond: ['$isRead', 0, 1] } }
        }
      }
    ]);

    // Daily notification trends
    const dailyTrends = await Notification.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
      { $limit: 30 }
    ]);

    res.json({
      typeDistribution,
      priorityDistribution,
      readStats: readStats[0] || { total: 0, read: 0, unread: 0 },
      dailyTrends
    });
  } catch (error) {
    console.error('Error fetching notification analytics:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
