const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const { protect } = require('../middleware/auth');

// Get all tasks
router.get('/', protect, async (req, res) => {
  try {
    const tasks = await Task.find({ company: req.user.company })
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create task
router.post('/', protect, async (req, res) => {
  const { title, description, status, dueDate, assignedTo } = req.body;
  
  // Permission check for task assignment based on role
  const User = require('../models/User');
  let allowedAssign = false;
  if (assignedTo) {
    const targetUser = await User.findById(assignedTo).select('role');
    if (!targetUser) {
      return res.status(400).json({ success: false, message: 'Assignee not found' });
    }
    const targetRole = targetUser.role;
    if (req.user.role === 'creator') {
      // creator can assign to admin, users, self, or leave unassigned
      allowedAssign = targetRole === 'admin' || targetRole === 'user' || assignedTo === req.user.id;
    } else if (req.user.role === 'admin') {
      // admin can assign to users, self, or unassigned, but not creator
      allowedAssign = targetRole === 'user' || assignedTo === req.user.id;
    } else {
      // standard user can assign only to self or unassigned
      allowedAssign = assignedTo === req.user.id;
    }
    if (!allowedAssign) {
      return res.status(403).json({ success: false, message: 'You are not permitted to assign tasks to this user' });
    }
  }
  // If we reach here, permission check passed (or no assignee). Continue to create task.


  try {
    let task = await Task.create({
      title,
      description,
      status: status || 'pending',
      dueDate: dueDate || null,
      assignedTo: assignedTo || null,
      assignedByCreator: req.user.role === 'creator' && assignedTo ? true : false,
      createdBy: req.user.id,
      company: req.user.company,
    });

    task = await Task.findById(task._id)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email');

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`company_${req.user.company}`).emit('task_created', { task, sender: req.user.name });
    }

    res.status(201).json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update task
router.put('/:id', protect, async (req, res) => {
  try {
    let task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (task.company.toString() !== (req.user.company._id || req.user.company).toString()) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Authorized if admin or creator
    if (req.user.role !== 'admin' && req.user.role !== 'creator' && task.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only edit tasks that you created' });
    }

    const { title, description, status, dueDate, assignedTo } = req.body;

    // Permission check when updating assignedTo
    if (assignedTo !== undefined) {
      const User = require('../models/User');
      if (assignedTo) {
        const targetUser = await User.findById(assignedTo).select('role');
        if (!targetUser) {
          return res.status(400).json({ success: false, message: 'Assignee not found' });
        }
        const targetRole = targetUser.role;
        let allowedAssign = false;
        if (req.user.role === 'creator') {
          allowedAssign = targetRole === 'admin' || targetRole === 'user' || assignedTo === req.user.id;
        } else if (req.user.role === 'admin') {
          allowedAssign = targetRole === 'user' || assignedTo === req.user.id;
        } else {
          allowedAssign = assignedTo === req.user.id;
        }
        if (!allowedAssign) {
          return res.status(403).json({ success: false, message: 'You are not permitted to assign tasks to this user' });
        }
      }
      // Permission check passed; proceed with update.
    }

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (dueDate !== undefined) task.dueDate = dueDate || null;
    if (assignedTo !== undefined) {
      task.assignedTo = assignedTo || null;
      if (req.user.role === 'creator' && assignedTo) {
        task.assignedByCreator = true;
      }
    }

    await task.save();

    task = await Task.findById(task._id)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email');

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`company_${req.user.company}`).emit('task_updated', { task, sender: req.user.name });
    }

    res.json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete task
router.delete('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (task.company.toString() !== (req.user.company._id || req.user.company).toString()) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Authorized if admin or creator
    if (req.user.role !== 'admin' && req.user.role !== 'creator' && task.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this task' });
    }

    await Task.findByIdAndDelete(req.params.id);

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`company_${req.user.company}`).emit('task_deleted', { taskId: req.params.id, sender: req.user.name });
    }

    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
