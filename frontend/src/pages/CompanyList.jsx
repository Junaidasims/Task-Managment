import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api/config';
import { Building2, PlusCircle, CheckSquare, LogOut, Loader2 } from 'lucide-react';
import Navbar from '../components/Navbar';

const CompanyList = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await api.get('/company');
        if (res.data.success) {
          setCompanies(res.data.companies);
        }
      } catch (error) {
        console.error('Error fetching companies:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCompanies();
  }, []);

  const handleCompanySelect = (companyName) => {
    navigate('/login', { state: { companyName } });
  };

  return (
    <div className="min-h-screen relative flex flex-col">
      <Navbar />

      {/* Glow Rings */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-pink-500/10 blur-[100px] pointer-events-none"></div>

      <div className="flex-1 w-full max-w-6xl mx-auto px-6 py-12 relative z-10 flex flex-col items-center">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-extrabold text-white mb-4 tracking-tight">Select Your Workspace</h2>
          <p className="text-slate-400 max-w-lg mx-auto">
            Choose your company to log in or register. Workspaces are isolated for maximum security and productivity.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
          </div>
        ) : (
          <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map((company) => (
              <button
                key={company._id}
                onClick={() => handleCompanySelect(company.name)}
                className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center gap-4 hover:bg-white/10 transition-all duration-300 group border border-white/5 hover:border-indigo-500/30 transform hover:-translate-y-1 shadow-lg"
              >
                <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center border border-white/5 group-hover:scale-110 group-hover:bg-indigo-600/20 transition-all duration-300 shadow-inner">
                  <Building2 className="w-8 h-8 text-slate-400 group-hover:text-indigo-400 transition-colors duration-300" />
                </div>
                <h3 className="text-xl font-bold text-white group-hover:text-indigo-200 transition-colors duration-300">
                  {company.name}
                </h3>
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider group-hover:text-indigo-300/70">
                  Enter Workspace &rarr;
                </span>
              </button>
            ))}

            {user.role === 'creator' && !user.companyId && (
              <button
                onClick={() => navigate('/register-company')}
                className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center gap-4 hover:bg-indigo-600/10 transition-all duration-300 group border border-indigo-500/20 hover:border-indigo-500/50 border-dashed transform hover:-translate-y-1 shadow-[0_0_15px_rgba(99,102,241,0.1)] hover:shadow-[0_0_25px_rgba(99,102,241,0.2)]"
              >
                <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center border border-indigo-500/30 group-hover:scale-110 transition-transform duration-300">
                  <PlusCircle className="w-8 h-8 text-indigo-300 group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="text-xl font-bold text-indigo-300 group-hover:text-white transition-colors duration-300">
                  Create Company
                </h3>
                <span className="text-xs text-indigo-400/60 font-semibold uppercase tracking-wider group-hover:text-indigo-300/90">
                  Setup new workspace
                </span>
              </button>
            )}

            {companies.length === 0 && (!user.role || user.role !== 'creator') && (
              <div className="col-span-full text-center py-12 glass-panel rounded-2xl border border-white/5">
                <Building2 className="w-12 h-12 text-slate-500 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold text-slate-300 mb-2">No Companies Found</h3>
                <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
                  There are currently no registered workspaces. You must register as a Company Creator to create one.
                </p>
                <button
                  onClick={() => navigate('/register-creator')}
                  className="px-6 py-2.5 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 rounded-xl text-indigo-300 hover:text-white transition-all text-sm font-semibold tracking-wider"
                >
                  Register as Creator
                </button>
              </div>
            )}
            {companies.length > 0 && (!user.role || user.role !== 'creator') && (
              <div className="col-span-full mt-8 text-center">
                <p className="text-slate-400 text-sm">
                  Want to create a new workspace?{' '}
                  <Link
                    to="/register-creator"
                    className="text-indigo-400 hover:text-indigo-300 font-semibold hover:underline transition-colors"
                  >
                    Register as a Company Creator
                  </Link>
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyList;
