const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Company = require('../models/Company');
const { protect } = require('../middleware/auth');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecret_key_12345_taskmanager_app', {
    expiresIn: '30d',
  });
};

// Register
router.post('/register', async (req, res) => {
  const { name, email, password, role, companyName, accessCode } = req.body;
  try {
    if (role === 'creator') {
      const CREATOR_SECRET = process.env.CREATOR_SECRET || 'supersecretcreator';
      if (accessCode !== CREATOR_SECRET) {
        return res.status(403).json({ success: false, message: 'Invalid Creator Access Code. You are not authorized.' });
      }
    }

    if (role !== 'creator' && !companyName) {
      return res.status(400).json({ success: false, message: 'Company name is required' });
    }

    let company = null;
    if (role !== 'creator') {
      company = await Company.findOne({ name: { $regex: new RegExp(`^${companyName}$`, 'i') }, isDeleted: { $ne: true } });
      if (!company) {
        return res.status(404).json({ success: false, message: 'Company not found.' });
      }
    }

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    if (role === 'admin') {
      const existingAdmin = await User.findOne({ 
        company: company._id, 
        role: 'admin' 
      });
      if (existingAdmin) {
        return res.status(400).json({ success: false, message: 'An admin already exists for this company. Only 1 admin is allowed.' });
      }
    }

    user = await User.create({
      name,
      email,
      password,
      role: role || 'user',
      company: company ? company._id : undefined,
    });
    
    const token = generateToken(user._id);
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: company ? company.name : null,
        companyId: company ? company._id : null,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email }).select('+password').populate('company', 'name');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const token = generateToken(user._id);
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company ? user.company.name : null,
        companyId: user.company ? user.company._id : null,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get current user details
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('company', 'name');
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company ? user.company.name : null,
        companyId: user.company ? user.company._id : null,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all users (useful for selecting assignee in task creation)
router.get('/users', protect, async (req, res) => {
  try {
    const users = await User.find({ company: req.user.company }, 'name email role');
    res.json({
      success: true,
      users,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Request account deletion (soft delete - pending creator approval)
router.delete('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Creators cannot delete themselves via this route
    if (user.role === 'creator') {
      return res.status(403).json({ success: false, message: 'Creators cannot delete their own account this way.' });
    }

    // Mark for pending deletion (will be approved by creator)
    user.pendingDeletion = true;
    user.deletionReason = 'self';
    await user.save();

    // Notify creator via socket
    const io = req.app.get('io');
    if (io && user.company) {
      io.to(`company_${user.company}`).emit('self_delete_pending', {
        userId: user._id.toString(),
        userName: user.name,
        userRole: user.role,
        userEmail: user.email,
      });
    }

    res.json({ success: true, message: 'Account deletion requested. Awaiting creator approval.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
