import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, CheckSquare, Trash2, Settings } from 'lucide-react';
import { api } from '../api/config';

const Navbar = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) return;
    
    try {
      await api.delete('/auth/me');
      handleLogout();
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account');
    }
  };

  return (
    <nav className="glass-panel sticky top-0 z-50 px-6 py-4 mb-8 shadow-lg backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600/20 p-2 rounded-xl border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)] animate-pulse-glow">
            <CheckSquare className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wider bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
              TaskManager
            </h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Real-Time Sync</p>
          </div>
        </div>

        {/* Home Button (Visible only on non-home pages) */}
        {window.location.pathname !== '/' && (
          <button
            onClick={() => navigate('/')}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-all duration-300"
          >
            Switch Workspace
          </button>
        )}

        {/* User Stats and Actions */}
        {user.name && (
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-3 border-r border-white/10 pr-6">
              <div className="w-9 h-9 bg-slate-800 rounded-full border border-white/10 flex items-center justify-center text-indigo-300 font-bold shadow-inner">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-white">{user.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      user.role === 'creator' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : user.role === 'admin' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    }`}>
                    {user.role}
                  </span>
                  {user.company && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-slate-500/20 text-slate-300 border border-slate-500/30">
                      {user.company}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Workspace Settings (Creator only) */}
              {user.role === 'creator' && window.location.pathname !== '/workspace-settings' && (
                <button
                  onClick={() => navigate('/workspace-settings')}
                  title="Workspace Settings"
                  className="flex items-center justify-center p-2 rounded-xl text-amber-400 hover:text-white bg-white/5 hover:bg-amber-500/80 border border-white/5 hover:border-amber-500/50 transition-all duration-300 transform hover:scale-[1.03] active:scale-[0.98]"
                >
                  <Settings className="w-4 h-4" />
                </button>
              )}

              {/* Delete Account Button */}
              <button
                onClick={handleDeleteAccount}
                title="Delete Account"
                className="flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-rose-500/80 border border-white/5 hover:border-rose-500/50 transition-all duration-300 transform hover:scale-[1.03] active:scale-[0.98]"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-600/30 border border-rose-500/20 hover:border-rose-500/40 shadow-md transition-all duration-300 transform hover:scale-[1.03] active:scale-[0.98]"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
