const express = require('express');
const router = express.Router();
const Company = require('../models/Company');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Register a new company
router.post('/register', protect, async (req, res) => {
  if (req.user.role !== 'creator') {
    return res.status(403).json({ success: false, message: 'Only Company Creators can register a new company' });
  }

  const { name } = req.body;
  try {
    let company = await Company.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (company) {
      return res.status(400).json({ success: false, message: 'Company already exists' });
    }

    company = await Company.create({ name });
    
    // Update the creator with the new company
    await User.findByIdAndUpdate(req.user.id, { company: company._id });
    
    res.status(201).json({ success: true, company });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get workspace details (Creator only)
router.get('/workspace', protect, async (req, res) => {
  if (req.user.role !== 'creator') {
    return res.status(403).json({ success: false, message: 'Only Creator can access workspace details' });
  }
  try {
    const company = await Company.findById(req.user.company);
    const users = await User.find({ company: req.user.company }).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, company, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update company name (Creator only)
router.put('/name', protect, async (req, res) => {
  if (req.user.role !== 'creator') {
    return res.status(403).json({ success: false, message: 'Only Creator can update company name' });
  }
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: 'Name is required' });
  }
  try {
    const existing = await Company.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') }, _id: { $ne: req.user.company } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Company name already in use' });
    }
    const company = await Company.findByIdAndUpdate(req.user.company, { name }, { new: true });
    res.json({ success: true, company });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Block/Unblock user (Creator only)
router.put('/users/:id/block', protect, async (req, res) => {
  if (req.user.role !== 'creator') {
    return res.status(403).json({ success: false, message: 'Only Creator can block users' });
  }
  try {
    const creatorCompanyId = (req.user.company._id || req.user.company).toString();
    const targetUser = await User.findById(req.params.id);
    if (!targetUser || targetUser.company.toString() !== creatorCompanyId) {
      return res.status(404).json({ success: false, message: 'User not found in your workspace' });
    }
    if (targetUser._id.toString() === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot block yourself' });
    }
    
    targetUser.isBlocked = !targetUser.isBlocked;
    await targetUser.save();

    // Emit socket event for real-time blocking response
    const io = req.app.get('io');
    if (io) {
      io.to(`company_${req.user.company}`).emit('user_blocked_status', { 
        userId: targetUser._id.toString(), 
        isBlocked: targetUser.isBlocked 
      });
    }

    res.json({ success: true, user: targetUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Remove user (Creator can remove anyone, Admin/User can request self-deletion)
router.delete('/users/:id', protect, async (req, res) => {
  try {
    const creatorCompanyId = (req.user.company._id || req.user.company).toString();
    const targetUser = await User.findById(req.params.id);
    if (!targetUser || targetUser.company.toString() !== creatorCompanyId) {
      return res.status(404).json({ success: false, message: 'User not found in your workspace' });
    }

    const isSelf = targetUser._id.toString() === req.user.id;
    const isCreator = req.user.role === 'creator';
    const isAdminOrUser = ['admin', 'user'].includes(req.user.role);

    // Case 1: Admin/User requesting self-deletion (soft delete - pending creator approval)
    if (isSelf && isAdminOrUser) {
      targetUser.pendingDeletion = true;
      targetUser.deletionReason = 'self';
      await targetUser.save();

      // Notify creator about pending self-deletion
      const io = req.app.get('io');
      if (io) {
        io.to(`company_${req.user.company}`).emit('self_delete_pending', {
          userId: targetUser._id.toString(),
          userName: targetUser.name,
          userRole: targetUser.role,
          userEmail: targetUser.email,
        });
      }
      return res.json({ success: true, message: 'Self deletion requested. Awaiting creator approval.' });
    }

    // Only creator can delete users
    if (!isCreator) {
      return res.status(403).json({ success: false, message: 'Only Creator can remove users' });
    }

    // Creator cannot delete themselves
    if (isSelf) {
      return res.status(400).json({ success: false, message: 'Creator cannot remove themselves' });
    }

    // Case 2: Creator deleting a user (permanent deletion immediately)
    const Task = require('../models/Task');
    
    // Delete all tasks created by the removed user
    await Task.deleteMany({ createdBy: req.params.id });
    // Unassign the removed user from any tasks
    await Task.updateMany({ assignedTo: req.params.id }, { assignedTo: null });

    // Delete the user
    await User.findByIdAndDelete(req.params.id);

    // Emit socket events
    const io = req.app.get('io');
    if (io) {
      // Notify creator
      io.to(`company_${req.user.company}`).emit('user_deleted_by_creator', {
        userId: req.params.id.toString(),
        userName: targetUser.name,
        userRole: targetUser.role,
      });
      // Notify the deleted user (they should receive this and log out)
      io.to(`user_${req.params.id}`).emit('account_deleted_by_creator', {
        message: `Your account was deleted by creator`,
        role: targetUser.role,
      });
    }

    res.json({ success: true, message: 'User removed from workspace and their tasks have been cleared.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Approve and permanently delete a pending self-deletion (Creator only)
router.delete('/users/:id/force', protect, async (req, res) => {
  if (req.user.role !== 'creator') {
    return res.status(403).json({ success: false, message: 'Only Creator can approve deletions' });
  }
  try {
    console.log('Force delete attempt - User ID:', req.params.id, 'Creator ID:', req.user.id, 'Creator Company:', req.user.company);
    
    const targetUser = await User.findById(req.params.id);
    console.log('Target user found:', targetUser ? targetUser._id : 'null');
    
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const creatorCompanyId = req.user.company._id ? req.user.company._id.toString() : req.user.company.toString();
    console.log('Target user company:', targetUser.company, 'Creator company:', creatorCompanyId);
    
    if (targetUser.company.toString() !== creatorCompanyId) {
      return res.status(404).json({ success: false, message: 'User not found in your workspace' });
    }
    
    if (!targetUser.pendingDeletion) {
      return res.status(400).json({ success: false, message: 'User is not pending deletion' });
    }

    const Task = require('../models/Task');
    const userRole = targetUser.role;
    const userEmail = targetUser.email;
    const userName = targetUser.name;
    const userId = targetUser._id.toString();

    // Delete all tasks created by the user
    await Task.deleteMany({ createdBy: userId });
    // Unassign the user from any tasks
    await Task.updateMany({ assignedTo: userId }, { assignedTo: null });
    
    // Permanently delete the user
    await User.findByIdAndDelete(userId);

    // Emit socket events
    const io = req.app.get('io');
    if (io) {
      // Notify creator
      io.to(`company_${req.user.company}`).emit('user_permanently_deleted', {
        userId: userId,
        userName: userName,
        userRole: userRole,
      });
      // Notify the deleted user (if still connected)
      io.to(`user_${userId}`).emit('account_permanently_deleted', {
        message: `Your account has been permanently deleted`,
      });
    }

    console.log('User successfully deleted:', userName);
    res.json({ success: true, message: `${userRole} account permanently deleted.` });
  } catch (error) {
    console.error('Force delete error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete company (soft-delete, Creator only)
router.delete('/delete-company', protect, async (req, res) => {
  if (req.user.role !== 'creator') {
    return res.status(403).json({ success: false, message: 'Only Creator can delete the company' });
  }
  try {
    const company = await Company.findById(req.user.company);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    company.isDeleted = true;
    await company.save();

    // Emit socket event for real-time company removal response
    const io = req.app.get('io');
    if (io) {
      io.to(`company_${req.user.company}`).emit('company_deleted', {
        companyId: company._id.toString()
      });
    }

    res.json({ success: true, message: 'Company was successfully removed.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all companies (useful for registration dropdown)
router.get('/', async (req, res) => {
  try {
    const companies = await Company.find({ isDeleted: { $ne: true } }, 'name').sort({ name: 1 });
    res.json({ success: true, companies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
