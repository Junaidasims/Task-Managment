const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecret_key_12345_taskmanager_app');
    req.user = await User.findById(decoded.id).populate('company');
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    if (req.user.company && req.user.company.isDeleted) {
      return res.status(403).json({ success: false, message: 'Your company has been removed by the workspace creator.' });
    }
    if (req.user.isBlocked) {
      return res.status(403).json({ success: false, message: 'Your account has been blocked by the workspace creator.' });
    }
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user ? req.user.role : 'none'}' is not authorized to access this route`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
