import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api/config';
import { Building2, Sparkles, AlertCircle, Loader2, CheckSquare } from 'lucide-react';

const RegisterCompany = () => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (user.role !== 'creator') {
      navigate('/');
    }
  }, [user, navigate]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter a company name');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/company/register', { name });
      if (response.data.success) {
        // Update user context to reflect the new company
        user.company = response.data.company.name;
        user.companyId = response.data.company._id;
        localStorage.setItem('user', JSON.stringify(user));
        
        // Redirect to dashboard as they are now the admin
        navigate('/dashboard');
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Could not register the company. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Glow Rings */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-indigo-500/10 blur-[80px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-pink-500/10 blur-[80px] pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Brand Logo Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-indigo-600/20 p-3.5 rounded-2xl border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.25)] mb-3 animate-pulse-glow">
            <CheckSquare className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-wider bg-gradient-to-r from-white via-indigo-100 to-indigo-400 bg-clip-text text-transparent">
            TaskManager
          </h1>
          <p className="text-sm text-slate-400 mt-1.5 font-medium">Register Your Company Workspace</p>
        </div>

        {/* Form Container */}
        <div className="glass-panel p-8 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-md">
          <h2 className="text-xl font-bold text-white mb-6 text-center">Create Company</h2>

          {error && (
            <div className="flex items-start gap-2.5 p-3.5 mb-5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm animate-pulse">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Company Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Company Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter company name"
                  className="glass-input w-full px-4 py-3 pl-10 text-sm"
                />
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 mt-6 px-6 py-3 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Register Workspace</span>
                </>
              )}
            </button>
          </form>

          {/* Bottom links */}
          <p className="text-center text-sm text-slate-400 mt-6">
            Joining an existing company?{' '}
            <Link
              to="/register"
              className="text-indigo-400 hover:text-indigo-300 font-semibold hover:underline transition-colors"
            >
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterCompany;
