const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Add user info to request
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    try {
      const fs = require('fs');
      fs.appendFileSync('auth_error.log', `${new Date().toISOString()} - Token Error: ${error.message}\nToken: ${req.headers.authorization}\nStack: ${error.stack}\n`);
    } catch (logErr) {
       console.error('Failed to write to auth_error.log:', logErr);
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

// Middleware to check if user is a teacher
const isTeacher = (req, res, next) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Teachers only.'
    });
  }
  next();
};

// Middleware to check if user is an admin (legacy - kept for backward compat)
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'principal' && req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admins only.'
    });
  }
  next();
};

// Middleware to check if user is an HOD (campus-level admin)
const isPrincipal = (req, res, next) => {
  if (req.user.role !== 'principal') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. HODs only.'
    });
  }
  next();
};

// Middleware to check if user is a Super Admin (platform-level)
const isSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Super Admins only.'
    });
  }
  next();
};

// Middleware to check if user is a student
const isStudent = (req, res, next) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Students only.'
    });
  }
  next();
};

// Middleware to check if user is a BD Agent
const isBDAgent = (req, res, next) => {
  if (!['bd_agent', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. BD Agents only.'
    });
  }
  next();
};

// Chat: HOD, Admin, Teacher, Student can use chat. Super Admin cannot.
const isChatUser = (req, res, next) => {
  const allowed = ['admin', 'principal', 'teacher', 'student', 'bd_agent'];
  if (!allowed.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Chat is not available for this role.'
    });
  }
  next();
};

module.exports = {
  verifyToken,
  isTeacher,
  isAdmin,
  isPrincipal,
  isSuperAdmin,
  isStudent,
  isBDAgent,
  isChatUser
};
