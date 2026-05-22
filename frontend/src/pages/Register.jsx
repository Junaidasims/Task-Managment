import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { User, Mail, Lock, Sparkles, AlertCircle, Loader2, CheckSquare, Eye, EyeOff, Building2 } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [companyName] = useState(location.state?.companyName || '');

  // Redirect to company list if they try to access register without a company context
  useEffect(() => {
    if (!companyName) {
      navigate('/');
    }
  }, [companyName, navigate]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim() || !password.trim() || !companyName.trim()) {
      setError('Please fill in all fields');
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/;
    if (!passwordRegex.test(password)) {
      setError('Password must be at least 8 characters long, include 1 uppercase, 1 lowercase, and 1 special character');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/auth/register', {
        name,
        email,
        password,
        role,
        companyName,
      });

      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        navigate('/dashboard');
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Could not connect to the registration server. Ensure the backend is running.'
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
          <p className="text-sm text-slate-400 mt-1.5 font-medium">Streamlined Workflows & Real-Time Sync</p>
        </div>

        {/* Form Container */}
        <div className="glass-panel p-8 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-md">
          <h2 className="text-xl font-bold text-white mb-6 text-center">Create Your Account</h2>

          {error && (
            <div className="flex items-start gap-2.5 p-3.5 mb-5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm animate-pulse">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="glass-input w-full px-4 py-3 pl-10 text-sm"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            {/* Company Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Company Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={companyName}
                  disabled
                  className="glass-input w-full px-4 py-3 pl-10 text-sm opacity-70 cursor-not-allowed bg-white/5"
                />
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="glass-input w-full px-4 py-3 pl-10 text-sm"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="glass-input w-full px-4 py-3 pl-10 pr-10 text-sm"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-200 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Role selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Choose Role
              </label>
              <div className="relative">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="glass-input w-full px-4 py-3 pl-10 text-sm cursor-pointer [&>option]:bg-slate-900 [&>option]:text-white"
                >
                  <option value="user">Standard User</option>
                  <option value="admin">Administrator</option>
                </select>
                <Sparkles className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
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
                  <span>Sign Up</span>
                </>
              )}
            </button>
          </form>

          {/* Bottom links */}
          <p className="text-center text-sm text-slate-400 mt-6">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-indigo-400 hover:text-indigo-300 font-semibold hover:underline transition-colors"
            >
              Log in instead
            </Link>
            <br />
            <br />
            Want to create a new workspace?{' '}
            <Link
              to="/register-creator"
              className="text-indigo-400 hover:text-indigo-300 font-semibold hover:underline transition-colors"
            >
              Register as a Company Creator
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
