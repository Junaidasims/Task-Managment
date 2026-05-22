import React, { useState, useEffect } from 'react';
import { X, Save, Calendar, User, FileText, CheckCircle2 } from 'lucide-react';

const TaskFormModal = ({ isOpen, onClose, onSubmit, task, users }) => {
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('pending');
  const [dueDate, setDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setStatus(task.status || 'pending');
      setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
      setAssignedTo(task.assignedTo ? (task.assignedTo._id || task.assignedTo) : '');
    } else {
      setTitle('');
      setDescription('');
      setStatus('pending');
      setDueDate('');
      setAssignedTo('');
    }
    setErrors({});
  }, [task, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      title,
      description,
      status,
      dueDate: dueDate || null,
      assignedTo: assignedTo || null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex flex-col max-h-[90vh] custom-toast">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-white/10 bg-white/5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-indigo-400 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)] animate-pulse"></span>
            {task ? 'Edit Task Details' : 'Create New Task'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Task Title *
            </label>
            <div className="relative">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a descriptive task title"
                className={`glass-input w-full px-4 py-2.5 pl-10 text-sm ${errors.title ? 'border-rose-500/50 focus:border-rose-500' : ''
                  }`}
              />
              <CheckCircle2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
            {errors.title && (
              <p className="text-rose-400 text-xs mt-1.5 ml-1">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <div className="relative">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What needs to be done? Add details here..."
                rows="3"
                className="glass-input w-full px-4 py-2.5 pl-10 text-sm resize-none"
              ></textarea>
              <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="glass-input w-full px-4 py-2.5 text-sm cursor-pointer [&>option]:bg-slate-900 [&>option]:text-white"
              >
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Due Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="glass-input w-full px-4 py-2.5 pl-10 text-sm cursor-pointer"
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Assignee */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Assign to User
            </label>
            <div className="relative">
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="glass-input w-full px-4 py-2.5 pl-10 text-sm cursor-pointer [&>option]:bg-slate-900 [&>option]:text-white"
              >
                <option value="">Unassigned (Open for grabs)</option>
                {(currentUser.role === 'creator'
                  ? users
                  : currentUser.role === 'admin'
                    ? users.filter(u => u.role !== 'creator')
                    : users.filter(u => (u._id || u.id) === currentUser.id)
                ).map(u => (
                  <option key={u.id || u._id} value={u.id || u._id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <Save className="w-4 h-4" />
              <span>{task ? 'Update Task' : 'Create Task'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskFormModal;
