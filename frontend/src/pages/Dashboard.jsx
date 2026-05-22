import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { api, default as API_BASE_URL } from '../api/config';
import Navbar from '../components/Navbar';
import TaskCard from '../components/TaskCard';
import TaskFormModal from '../components/TaskFormModal';
import {
  Plus, Search, ListTodo, CheckCircle2, Clock,
  RefreshCw, X, HelpCircle, SortAsc, ShieldOff, Trash2, Building2, AlertTriangle
} from 'lucide-react';

const Dashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('latest');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isRemoved, setIsRemoved] = useState(false);
  const [isCompanyDeleted, setIsCompanyDeleted] = useState(false);
  const [accountDeletedByCreator, setAccountDeletedByCreator] = useState(false);

  // Real-time toast notifications
  const [toasts, setToasts] = useState([]);

  const socketRef = useRef(null);
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  // Setup error handling for API calls
  const authAxios = api;
  authAxios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response && error.response.status === 403 && error.response.data && error.response.data.message) {
        const msg = error.response.data.message.toLowerCase();
        if (msg.includes('company has been removed') || msg.includes('company was removed')) {
          setIsCompanyDeleted(true);
        } else if (msg.includes('block')) {
          setIsBlocked(true);
        }
      }
      return Promise.reject(error);
    }
  );

  // Load Data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [tasksRes, usersRes] = await Promise.all([
        authAxios.get('/tasks'),
        authAxios.get('/auth/users')
      ]);
      if (tasksRes.data.success) setTasks(tasksRes.data.tasks);
      if (usersRes.data.success) setUsers(usersRes.data.users);
    } catch (error) {
      console.error('Error fetching data:', error);
      if (error.response?.status === 403 && error.response?.data?.message) {
        const msg = error.response.data.message.toLowerCase();
        if (msg.includes('company has been removed') || msg.includes('company was removed')) {
          setIsCompanyDeleted(true);
        } else if (msg.includes('block')) {
          setIsBlocked(true);
        }
      } else {
        showToast('Error', 'Failed to retrieve tasks from server. Ensure API is running.', 'rose');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await authAxios.get('/auth/users');
      if (res.data.success) setUsers(res.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    fetchData();

    // Setup Socket connection
    socketRef.current = io(API_BASE_URL);

    socketRef.current.on('connect', () => {
      console.log('Socket.IO connected to server');
      if (currentUser.companyId) {
        socketRef.current.emit('join_company', currentUser.companyId);
      }
      if (currentUser.id) {
        socketRef.current.emit('join_user', currentUser.id);
      }
    });

    socketRef.current.on('user_blocked_status', ({ userId, isBlocked }) => {
      if (userId === currentUser.id && isBlocked) {
        setIsBlocked(true);
      }
    });

    socketRef.current.on('account_deleted_by_creator', ({ message, role }) => {
      setAccountDeletedByCreator(true);
    });

    socketRef.current.on('user_removed', ({ userId }) => {
      if (userId === currentUser.id) {
        setIsRemoved(true);
      } else {
        fetchUsers();
        fetchData();
      }
    });

    socketRef.current.on('company_deleted', () => {
      setIsCompanyDeleted(true);
    });

    socketRef.current.on('task_created', ({ task, sender }) => {
      setTasks((prev) => {
        if (prev.find((t) => t._id === task._id)) return prev;
        return [task, ...prev];
      });
      showToast('Task Created', `${sender} created task: "${task.title}"`, 'indigo');
    });

    socketRef.current.on('task_updated', ({ task, sender }) => {
      setTasks((prev) => {
        const exists = prev.find((t) => t._id === task._id);
        if (exists) {
          return prev.map((t) => (t._id === task._id ? task : t));
        } else {
          return [task, ...prev];
        }
      });
      showToast('Task Updated', `${sender} modified task: "${task.title}"`, 'amber');
    });

    socketRef.current.on('task_deleted', ({ taskId, sender }) => {
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
      showToast('Task Deleted', `${sender} removed a task`, 'rose');
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Show floating Toast
  const showToast = (title, message, color = 'indigo') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, title, message, color }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // CRUD Operations
  const handleOpenCreateModal = () => {
    fetchUsers();
    setSelectedTask(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (task) => {
    fetchUsers();
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (selectedTask) {
        // Edit Mode
        const res = await authAxios.put(`/tasks/${selectedTask._id}`, formData);
        if (res.data.success) {
          setTasks((prev) => prev.map((t) => (t._id === selectedTask._id ? res.data.task : t)));
          showToast('Updated Locally', 'Your changes have been updated.', 'indigo');
        }
      } else {
        // Create Mode
        const res = await authAxios.post('/tasks', formData);
        if (res.data.success) {
          setTasks((prev) => {
            if (prev.find((t) => t._id === res.data.task._id)) return prev;
            return [res.data.task, ...prev];
          });
          showToast('Created Locally', 'New task added.', 'emerald');
        }
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving task:', error);
      showToast('Action Failed', error.response?.data?.message || 'Error occurred while saving task', 'rose');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      const res = await authAxios.delete(`/tasks/${taskId}`);
      if (res.data.success) {
        setTasks((prev) => prev.filter((t) => t._id !== taskId));
        showToast('Deleted Locally', 'Task has been deleted.', 'rose');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      showToast('Delete Failed', error.response?.data?.message || 'Unable to delete task', 'rose');
    }
  };

  const handleToggleStatus = async (task) => {
    const nextStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      const res = await authAxios.put(`/tasks/${task._id}`, { status: nextStatus });
      if (res.data.success) {
        setTasks((prev) => prev.map((t) => (t._id === task._id ? res.data.task : t)));
        showToast(
          nextStatus === 'completed' ? 'Task Completed!' : 'Task Reopened',
          `"${task.title}" is now ${nextStatus}`,
          nextStatus === 'completed' ? 'emerald' : 'amber'
        );
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      showToast('Toggle Failed', 'Could not update task completion status', 'rose');
    }
  };

  // Helper selectors
  const totalCount = tasks.length;
  const pendingCount = tasks.filter((t) => t.status === 'pending').length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const overdueCount = tasks.filter((t) => {
    const isOverdue = t.status === 'pending' && t.dueDate && new Date(t.dueDate) < new Date(new Date().setHours(0, 0, 0, 0));
    return isOverdue;
  }).length;

  // Filter & Search Logic
  const filteredTasks = tasks.filter((t) => {
    // Search filter
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(search.toLowerCase()));

    // Status filter
    if (!matchesSearch) return false;
    if (statusFilter === 'all') return true;
    if (statusFilter === 'pending') return t.status === 'pending';
    if (statusFilter === 'completed') return t.status === 'completed';
    if (statusFilter === 'overdue') {
      return t.status === 'pending' && t.dueDate && new Date(t.dueDate) < new Date(new Date().setHours(0, 0, 0, 0));
    }
    return true;
  });

  // Sorting
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'latest') {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
    if (sortBy === 'oldest') {
      return new Date(a.createdAt) - new Date(b.createdAt);
    }
    if (sortBy === 'dueSoon') {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    }
    return 0;
  });

  if (currentUser.pendingDeletion) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-[#0b0f19]">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-amber-500/10 blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-rose-500/5 blur-[120px] pointer-events-none"></div>
        <div className="w-full max-w-md relative z-10 text-center space-y-6">
          <div className="mx-auto bg-amber-600/20 p-5 rounded-2xl border border-amber-500/30 shadow-[0_0_30px_rgba(234,179,8,0.25)] w-max animate-bounce">
            <AlertTriangle className="w-12 h-12 text-amber-400" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">Account Deletion Requested</h2>
          <div className="glass-panel p-6 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-md bg-white/2">
            <p className="text-sm text-slate-300 leading-relaxed font-semibold">
              Your account deletion has been requested. The workspace creator must approve it before your data is removed.
            </p>
          </div>
          <button
            onClick={() => {
              // optional: cancel request
            }}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-white/5 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Acknowledge
          </button>
        </div>
      </div>
    );
  }

  if (accountDeletedByCreator) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-[#0b0f19]">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-rose-500/10 blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-amber-500/5 blur-[120px] pointer-events-none"></div>

        <div className="w-full max-w-md relative z-10 text-center space-y-6">
          <div className="mx-auto bg-rose-600/20 p-5 rounded-2xl border border-rose-500/30 shadow-[0_0_30px_rgba(239,68,68,0.25)] w-max animate-bounce">
            <Trash2 className="w-12 h-12 text-rose-400" />
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight text-white">
            Your Account Was Deleted
          </h2>

          <div className="glass-panel p-6 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-md bg-white/2">
            <p className="text-sm text-slate-300 leading-relaxed font-semibold">
              Your account has been deleted by the workspace creator. All your tasks associated with your account have been deleted or unassigned.
            </p>
          </div>

          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = '/';
            }}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-white/5 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Exit & Return to Login
          </button>
        </div>
      </div>
    );
  }

  if (isRemoved) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-[#0b0f19]">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-rose-500/10 blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-amber-500/5 blur-[120px] pointer-events-none"></div>

        <div className="w-full max-w-md relative z-10 text-center space-y-6">
          <div className="mx-auto bg-rose-600/20 p-5 rounded-2xl border border-rose-500/30 shadow-[0_0_30px_rgba(239,68,68,0.25)] w-max animate-bounce">
            <Trash2 className="w-12 h-12 text-rose-400" />
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight text-white">
            Removed from Workspace
          </h2>

          <div className="glass-panel p-6 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-md bg-white/2">
            <p className="text-sm text-slate-300 leading-relaxed font-semibold">
              Your account has been completely removed from this company workspace by the Creator. All tasks associated with your account have been deleted or unassigned.
            </p>
          </div>

          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = '/';
            }}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-white/5 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Acknowledge & Exit
          </button>
        </div>
      </div>
    );
  }

  if (isCompanyDeleted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-[#0b0f19]">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-rose-500/10 blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-amber-500/5 blur-[120px] pointer-events-none"></div>

        <div className="w-full max-w-md relative z-10 text-center space-y-6">
          <div className="mx-auto bg-rose-600/20 p-5 rounded-2xl border border-rose-500/30 shadow-[0_0_30px_rgba(239,68,68,0.25)] w-max animate-pulse">
            <Building2 className="w-12 h-12 text-rose-400" />
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight text-white">
            Company Was Removed by Creator
          </h2>

          <div className="glass-panel p-6 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-md bg-white/2">
            <p className="text-sm text-slate-300 leading-relaxed font-medium">
              This company workspace has been permanently removed by the workspace creator.
            </p>
            <p className="text-xs text-rose-300 mt-4 leading-relaxed">
              All administrative and general operations are closed. Database logs have been archived securely for transaction compliance.
            </p>
          </div>

          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = '/';
            }}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-white/5 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Return to Directory
          </button>
        </div>
      </div>
    );
  }

  if (isBlocked) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-[#0b0f19]">
        {/* Glow rings */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-rose-500/10 blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-amber-500/5 blur-[120px] pointer-events-none"></div>

        <div className="w-full max-w-md relative z-10 text-center space-y-6">
          <div className="mx-auto bg-rose-600/20 p-5 rounded-2xl border border-rose-500/30 shadow-[0_0_30px_rgba(239,68,68,0.25)] w-max animate-pulse">
            <ShieldOff className="w-12 h-12 text-rose-400" />
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight text-white">
            You are blocked by creator
          </h2>

          <div className="glass-panel p-6 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-md bg-white/2">
            <p className="text-sm text-slate-300 leading-relaxed">
              Your account has been restricted. Only the Workspace Creator holds the permissions to manage, block, or unblock team member accounts within this workspace.
            </p>
            <p className="text-xs text-rose-400 mt-4 font-semibold">
              Please contact your Workspace Creator to restore access.
            </p>
          </div>

          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = '/';
            }}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-white/5 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Go Back / Log Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pb-16">
      <Navbar />

      {/* Main dashboard space */}
      <main className="max-w-7xl mx-auto px-6 w-full flex-1 space-y-8 relative z-10">

        {/* STATS HUD CONTAINER */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card: Total */}
          <div className="glass-panel p-5 rounded-2xl border border-white/5 relative overflow-hidden flex items-center gap-4">
            <div className="bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/20 text-indigo-400">
              <ListTodo className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Tasks</p>
              <h3 className="text-2xl font-bold text-white mt-1">{totalCount}</h3>
            </div>
            <div className="absolute right-0 bottom-0 w-16 h-16 bg-indigo-500/5 blur-xl rounded-full"></div>
          </div>

          {/* Card: Pending */}
          <div className="glass-panel p-5 rounded-2xl border border-white/5 relative overflow-hidden flex items-center gap-4">
            <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 text-amber-400">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending</p>
              <h3 className="text-2xl font-bold text-white mt-1">{pendingCount}</h3>
            </div>
            <div className="absolute right-0 bottom-0 w-16 h-16 bg-amber-500/5 blur-xl rounded-full"></div>
          </div>

          {/* Card: Completed */}
          <div className="glass-panel p-5 rounded-2xl border border-white/5 relative overflow-hidden flex items-center gap-4">
            <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Completed</p>
              <h3 className="text-2xl font-bold text-white mt-1">{completedCount}</h3>
            </div>
            <div className="absolute right-0 bottom-0 w-16 h-16 bg-emerald-500/5 blur-xl rounded-full"></div>
          </div>

          {/* Card: Overdue */}
          <div className="glass-panel p-5 rounded-2xl border border-white/5 relative overflow-hidden flex items-center gap-4">
            <div className="bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 text-rose-400">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overdue</p>
              <h3 className="text-2xl font-bold text-white mt-1 flex items-center gap-2">
                <span>{overdueCount}</span>
                {overdueCount > 0 && (
                  <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping"></span>
                )}
              </h3>
            </div>
            <div className="absolute right-0 bottom-0 w-16 h-16 bg-rose-500/5 blur-xl rounded-full"></div>
          </div>
        </section>

        {/* CONTROLS HUD */}
        <section className="glass-panel p-4 rounded-2xl border border-white/5 flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..."
              className="glass-input w-full px-4 py-2.5 pl-10 text-sm"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-3.5 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Tabs Filter */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {['all', 'pending', 'completed', 'overdue'].map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${statusFilter === tab
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/35 border border-indigo-500'
                    : 'text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5'
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Sorting and Add Actions */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            {/* Sorting Select */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="glass-input py-2 px-3 pl-8 text-xs cursor-pointer [&>option]:bg-slate-900 [&>option]:text-white"
              >
                <option value="latest">Latest</option>
                <option value="oldest">Oldest</option>
                <option value="dueSoon">Due Soon</option>
              </select>
              <SortAsc className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
            </div>

            {/* Create Task Button */}
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Add Task</span>
            </button>
          </div>
        </section>

        {/* LOADING & TASKS GRID AREA */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <RefreshCw className="w-10 h-10 text-indigo-400 animate-spin" />
            <p className="text-sm text-slate-400">Loading your real-time tasks workspace...</p>
          </div>
        ) : sortedTasks.length === 0 ? (
          <div className="glass-panel rounded-2xl border border-white/5 p-12 text-center flex flex-col items-center justify-center gap-4 py-20">
            <div className="bg-slate-800/50 p-4 rounded-full border border-white/10 text-slate-400">
              <ListTodo className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">No tasks found</h3>
              <p className="text-sm text-slate-400 max-w-sm mt-1 mx-auto">
                {search || statusFilter !== 'all'
                  ? "We couldn't find any matches for your current active search filters. Try clearing them!"
                  : "Welcome to your new Task Workspace! Tap 'Add Task' above to log your first syncable action."
                }
              </p>
            </div>
            {(search || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearch('');
                  setStatusFilter('all');
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold uppercase bg-white/5 hover:bg-white/10 border border-white/10 text-indigo-300 transition-colors"
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedTasks.map((t) => (
              <div key={t._id} className="h-full">
                <TaskCard
                  task={t}
                  onEdit={handleOpenEditModal}
                  onDelete={handleDeleteTask}
                  onToggleStatus={handleToggleStatus}
                  currentUser={currentUser}
                />
              </div>
            ))}
          </section>
        )}

      </main>

      {/* FORM MODAL */}
      <TaskFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        task={selectedTask}
        users={users}
      />

      {/* FLOATING REAL-TIME TOAST NOTIFICATIONS */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`custom-toast p-4 rounded-xl border pointer-events-auto flex justify-between gap-3 shadow-xl backdrop-blur-md ${toast.color === 'indigo'
                ? 'bg-indigo-950/85 border-indigo-500/30 text-indigo-100'
                : toast.color === 'emerald'
                  ? 'bg-emerald-950/85 border-emerald-500/30 text-emerald-100'
                  : toast.color === 'amber'
                    ? 'bg-amber-950/85 border-amber-500/30 text-amber-100'
                    : 'bg-rose-950/85 border-rose-500/30 text-rose-100'
              }`}
          >
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${toast.color === 'indigo' ? 'bg-indigo-400' :
                    toast.color === 'emerald' ? 'bg-emerald-400' :
                      toast.color === 'amber' ? 'bg-amber-400' : 'bg-rose-400'
                  }`}></span>
                {toast.title}
              </h4>
              <p className="text-xs opacity-90">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white shrink-0 self-start"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
