const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Organization = require('../models/Organization');

// Middleware to verify JWT token
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') || 
                  req.header('x-auth-token');
    
    if (!token) {
      return res.status(401).json({ 
        message: 'No token provided, authorization denied' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from token with organization data
    const user = await User.findById(decoded.userId)
      .select('-password')
      .populate('organizationId', 'name slug type isActive');
    
    if (!user) {
      return res.status(401).json({ 
        message: 'Token is valid but user no longer exists' 
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ 
        message: 'Account has been deactivated' 
      });
    }

    // Check if organization is active (for non-superadmin users)
    if (user.role !== 'superadmin' && user.organizationId && !user.organizationId.isActive) {
      return res.status(401).json({ 
        message: 'Organization has been deactivated' 
      });
    }

    req.user = decoded;
    req.userData = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Invalid token' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token has expired' 
      });
    }
    
    res.status(500).json({ 
      message: 'Server error during authentication' 
    });
  }
};

// Middleware to check if user has specific role
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. Required roles: ${roles.join(', ')}` 
      });
    }

    next();
  };
};

// Middleware to check if user is superadmin
const isSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      message: 'Authentication required' 
    });
  }

  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ 
      message: 'SuperAdmin access required' 
    });
  }

  next();
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      message: 'Authentication required' 
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      message: 'Admin access required' 
    });
  }

  next();
};

// Middleware to check if user is doctor
const isDoctor = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      message: 'Authentication required' 
    });
  }

  if (req.user.role !== 'doctor') {
    return res.status(403).json({ 
      message: 'Doctor access required' 
    });
  }

  next();
};

// Middleware to check if user is patient
const isPatient = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      message: 'Authentication required' 
    });
  }

  if (req.user.role !== 'patient') {
    return res.status(403).json({ 
      message: 'Patient access required' 
    });
  }

  next();
};

// Middleware to check if user can access their own resource or is admin
const isOwnerOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      message: 'Authentication required' 
    });
  }

  const resourceUserId = req.params.userId || req.params.id;
  
  if (req.user.role === 'admin' || req.user.userId === resourceUserId) {
    return next();
  }

  return res.status(403).json({ 
    message: 'Access denied. You can only access your own resources' 
  });
};

// Multi-tenant middleware - ensures user can only access their organization's data
const multiTenant = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      message: 'Authentication required' 
    });
  }

  // SuperAdmin can access all organizations
  if (req.user.role === 'superadmin') {
    return next();
  }

  // Patients can access all organizations (for booking appointments)
  if (req.user.role === 'patient') {
    return next();
  }

  // For admin and doctor, check organization access
  const userOrgId = req.userData.organizationId?._id?.toString();
  const requestedOrgId = req.params.organizationId || req.body.organizationId || req.query.organizationId;

  if (requestedOrgId && userOrgId !== requestedOrgId) {
    return res.status(403).json({ 
      message: 'Access denied. You can only access your organization\'s data.' 
    });
  }

  // Add organization context to request
  req.organizationId = userOrgId;
  next();
};

// Middleware to check if user can access specific organization
const canAccessOrganization = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      message: 'Authentication required' 
    });
  }

  const userRole = req.user.role;
  const userOrgId = req.userData.organizationId?._id?.toString();
  const requestedOrgId = req.params.organizationId || req.body.organizationId;

  // SuperAdmin can access all organizations
  if (userRole === 'superadmin') {
    return next();
  }

  // Patients can access all organizations
  if (userRole === 'patient') {
    return next();
  }

  // Admin and Doctor can only access their own organization
  if (userOrgId !== requestedOrgId) {
    return res.status(403).json({ 
      message: 'Access denied. You can only access your organization\'s data.' 
    });
  }

  next();
};

module.exports = {
  auth,
  authorize,
  isSuperAdmin,
  isAdmin,
  isDoctor,
  isPatient,
  isOwnerOrAdmin,
  multiTenant,
  canAccessOrganization
};
