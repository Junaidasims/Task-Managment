import React from 'react';
import { Calendar, User, Edit2, Trash2, CheckCircle, Clock } from 'lucide-react';

const TaskCard = ({ task, onEdit, onDelete, onToggleStatus, currentUser }) => {
  const isOverdue = task.status === 'pending' && task.dueDate && new Date(task.dueDate) < new Date(new Date().setHours(0, 0, 0, 0));

  const formatDate = (dateString) => {
    if (!dateString) return 'No due date';
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const canEdit = currentUser.role === 'admin' ||
    (task.createdBy && (task.createdBy._id || task.createdBy) === currentUser.id);

  const canDelete = currentUser.role === 'admin' ||
    (task.createdBy && (task.createdBy._id || task.createdBy) === currentUser.id);

  return (
    <div className={`glass-card p-5 rounded-2xl border flex flex-col justify-between h-full gap-4 relative overflow-hidden ${task.status === 'completed'
        ? 'border-emerald-500/20 hover:border-emerald-500/40 bg-emerald-500/[0.01]'
        : task.assignedByCreator
          ? 'border-amber-500/40 hover:border-amber-500/60 bg-amber-500/[0.03] shadow-[0_0_15px_rgba(245,158,11,0.1)]'
          : isOverdue
            ? 'border-rose-500/20 hover:border-rose-500/40 bg-rose-500/[0.01]'
            : 'border-white/5 hover:border-indigo-500/30'
      }`}>
      {/* Background Subtle Glows */}
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-[40px] pointer-events-none -mr-8 -mt-8 ${task.status === 'completed'
          ? 'bg-emerald-500/10'
          : task.assignedByCreator
            ? 'bg-amber-500/20'
            : isOverdue
              ? 'bg-rose-500/10'
              : 'bg-indigo-500/5'
        }`}></div>

      <div className="space-y-3 relative z-10">
        {/* Badges & Status */}
        <div className="flex justify-between items-start gap-2">
          {/* Status Badge */}
          <button
            onClick={() => canEdit && onToggleStatus(task)}
            disabled={!canEdit}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${!canEdit ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
              } ${task.status === 'completed'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                : 'bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20'
              }`}
          >
            <CheckCircle className={`w-3.5 h-3.5 ${task.status === 'completed' ? 'fill-emerald-300 text-emerald-950' : ''}`} />
            <span>{task.status}</span>
          </button>

          {/* Overdue Badge */}
          {isOverdue && (
            <span className="flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)] animate-pulse">
              <Clock className="w-3.5 h-3.5" />
              <span>Overdue</span>
            </span>
          )}
        </div>

        {/* Title & Desc */}
        <div>
          <h3 className={`text-base font-bold text-white tracking-wide line-clamp-1 ${task.status === 'completed' ? 'line-through text-slate-400' : ''
            }`}>
            {task.title}
          </h3>
          <p className={`text-sm text-slate-400 mt-1 line-clamp-2 h-10 ${task.status === 'completed' ? 'text-slate-500' : ''
            }`}>
            {task.description || 'No description provided.'}
          </p>
        </div>

        {/* Date & Assignee Details */}
        <div className="pt-2 space-y-2 border-t border-white/5 text-xs text-slate-400">
          {/* Due Date */}
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <span className={isOverdue ? 'text-rose-300 font-medium' : ''}>
              {formatDate(task.dueDate)}
            </span>
          </div>

          {/* Assigned To */}
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-indigo-400" />
            <span>
              Assigned: <span className="text-white font-medium">
                {task.assignedTo ? task.assignedTo.name : 'Unassigned'}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Footer Info & Actions */}
      <div className="flex justify-between items-center pt-3 border-t border-white/5 relative z-10 text-[10px] text-slate-500">
        <div className="flex items-center gap-2">
          <span>By: {task.createdBy ? task.createdBy.name : 'System'}</span>
          {task.assignedByCreator && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold uppercase">
              Creator
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {canEdit && (
            <button
              onClick={() => onEdit(task)}
              title="Edit Task"
              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}

          {canDelete && (
            <button
              onClick={() => onDelete(task._id)}
              title="Delete Task"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
