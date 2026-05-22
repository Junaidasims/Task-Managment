import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import { Building2, Users, Shield, ShieldOff, Trash2, Settings, Loader2, Save, Calendar } from 'lucide-react';
import Navbar from '../components/Navbar';

const WorkspaceSettings = () => {
  const [company, setCompany] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const socketRef = useRef(null);

  useEffect(() => {
    if (currentUser.role !== 'creator') {
      navigate('/dashboard');
      return;
    }
    fetchWorkspaceDetails();

    // Setup Socket connection
    socketRef.current = io('http://localhost:5000');
    
    socketRef.current.on('connect', () => {
      console.log('Socket connected');
      if (currentUser.companyId) {
        socketRef.current.emit('join_company', currentUser.companyId);
      }
    });

    socketRef.current.on('self_delete_pending', ({ userId, userName, userRole }) => {
      console.log('Pending deletion received:', userId, userName, userRole);
      fetchWorkspaceDetails();
    });

    socketRef.current.on('user_permanently_deleted', ({ userId, userName, userRole }) => {
      console.log('User permanently deleted:', userId, userName, userRole);
      fetchWorkspaceDetails();
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const fetchWorkspaceDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/company/workspace', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setCompany(res.data.company);
        setEditingName(res.data.company.name);
        setUsers(res.data.users);
      }
    } catch (error) {
      console.error('Error fetching workspace details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateName = async () => {
    if (!editingName.trim() || editingName === company.name) {
      setIsEditing(false);
      return;
    }
    setActionLoading('rename');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put('http://localhost:5000/api/company/name', { name: editingName }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setCompany(res.data.company);
        setIsEditing(false);
        // Update local storage user context
        const updatedUser = { ...currentUser, company: res.data.company.name };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Error updating company name:', error);
      alert(error.response?.data?.message || 'Failed to update company name');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleBlock = async (userId, isBlocked) => {
    if (!window.confirm(`Are you sure you want to ${isBlocked ? 'unblock' : 'block'} this user?`)) return;
    setActionLoading(userId);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`http://localhost:5000/api/company/users/${userId}/block`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setUsers(users.map(u => u._id === userId ? { ...u, isBlocked: !u.isBlocked } : u));
      }
    } catch (error) {
      console.error('Error blocking user:', error);
    } finally {
      setActionLoading(null);
    }
  };

  // Remove user (Creator only) - permanently delete a user
  const handleRemoveUser = async (userId) => {
    if (!window.confirm('Are you sure you want to permanently remove this user? This action cannot be undone.')) return;
    setActionLoading(userId);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.delete(`http://localhost:5000/api/company/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        fetchWorkspaceDetails();
      }
    } catch (error) {
      console.error('Error removing user:', error);
    } finally {
      setActionLoading(null);
    }
  };
  // Request self-deletion (admin or user)
  const requestSelfDeletion = async () => {
    if (!window.confirm('Are you sure you want to request account deletion? This will notify the creator for approval.')) return;
    setActionLoading('self_delete');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.delete(`http://localhost:5000/api/company/users/${currentUser.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        alert('Deletion request sent. Your account will be removed after creator approval.');
        localStorage.clear();
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Error requesting self-deletion:', error);
    } finally {
      setActionLoading(null);
    }
  };

  // Approve pending deletion (creator)
  const approvePendingDeletion = async (userId) => {
    console.log('Approving deletion for user:', userId);
    setActionLoading(userId.toString());
    try {
      const token = localStorage.getItem('token');
      console.log('Token:', token);
      console.log('API URL:', `http://localhost:5000/api/company/users/${userId}/force`);
      
      const res = await axios.delete(`http://localhost:5000/api/company/users/${userId}/force`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Response:', res.data);
      
      if (res.data.success) {
        alert('User account permanently deleted successfully.');
        fetchWorkspaceDetails();
      }
    } catch (error) {
      console.error('Error approving deletion:', error);
      console.error('Error response:', error.response?.data);
      alert(error.response?.data?.message || 'Failed to approve deletion. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteCompany = async () => {
    const confirmation = window.confirm(
      'CRITICAL WARNING:\n\nAre you absolutely sure you want to delete this company?\nThis action will lock out all workspace administrators and users immediately.\n\nType DELETE in the next prompt to confirm:'
    );
    if (!confirmation) return;
    
    const secondConfirmation = window.prompt('Type DELETE to confirm company removal:');
    if (secondConfirmation !== 'DELETE') {
      alert('Confirmation mismatch. Company deletion cancelled.');
      return;
    }

    setActionLoading('delete_company');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.delete('http://localhost:5000/api/company/delete-company', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        alert('Company has been successfully removed by the creator.');
        localStorage.clear();
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Error deleting company:', error);
      alert(error.response?.data?.message || 'Failed to delete company');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex flex-col pb-12">
      <Navbar />

      {/* Glow Rings */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-amber-500/10 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-pink-500/10 blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-5xl mx-auto px-6 relative z-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-amber-600/20 p-3 rounded-xl border border-amber-500/30">
            <Settings className="w-6 h-6 text-amber-400" />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Workspace Settings</h2>
        </div>

        {/* Company Details Card */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5 shadow-lg mb-8">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-400" />
            Company Details
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Workspace Name
              </label>
              <div className="flex gap-3">
                {isEditing ? (
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="glass-input flex-1 px-4 py-2 text-sm text-white focus:border-amber-400/50"
                  />
                ) : (
                  <div className="flex-1 px-4 py-2 text-sm text-white font-medium bg-white/5 rounded-xl border border-white/5">
                    {company?.name}
                  </div>
                )}
                {isEditing ? (
                  <button
                    onClick={handleUpdateName}
                    disabled={actionLoading === 'rename'}
                    className="flex items-center justify-center p-2 rounded-xl text-white bg-amber-600 hover:bg-amber-500 transition-colors"
                  >
                    {actionLoading === 'rename' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center justify-center p-2 rounded-xl text-amber-300 bg-amber-600/20 hover:bg-amber-600/40 border border-amber-500/30 transition-colors"
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>

            <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Date Established
              </label>
              <div className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 font-medium bg-white/5 rounded-xl border border-white/5">
                <Calendar className="w-4 h-4 text-slate-400" />
                {new Date(company?.createdAt).toLocaleDateString(undefined, {
                  year: 'numeric', month: 'long', day: 'numeric'
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="glass-panel p-6 rounded-2xl border border-rose-500/20 shadow-lg mb-8 bg-rose-950/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-rose-500/5 blur-2xl pointer-events-none"></div>
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <ShieldOff className="w-5 h-5 text-rose-400 animate-pulse" />
            Danger Zone
          </h3>
          <p className="text-sm text-slate-300 mb-6">
            Deleting this workspace will immediately soft-delete this company. All administrators and users will be locked out and receive a notification. To safeguard transactional integrity, database records will not be hard-deleted.
          </p>
          <button
            onClick={handleDeleteCompany}
            disabled={actionLoading === 'delete_company'}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-rose-600 hover:bg-rose-500 border border-rose-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionLoading === 'delete_company' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            <span>Delete Workspace Company</span>
          </button>
        </div>

        {/* User Management Card */}
        <div className="glass-panel rounded-2xl border border-white/5 shadow-lg overflow-hidden">
          <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/2">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400" />
              User Management
            </h3>
            <span className="text-xs font-semibold px-3 py-1 bg-white/10 text-slate-300 rounded-full border border-white/10">
              {users.length} Members
            </span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/2 border-b border-white/5">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((u) => (
                  <tr key={u._id} className={`hover:bg-white/2 transition-colors ${u.isBlocked ? 'opacity-70 bg-rose-500/5' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-inner ${
                          u.role === 'creator' ? 'bg-amber-500/20 text-amber-300' :
                          u.role === 'admin' ? 'bg-purple-500/20 text-purple-300' :
                          'bg-indigo-500/20 text-indigo-300'
                        }`}>
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{u.name}</p>
                          <p className="text-xs text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        u.role === 'creator' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : u.role === 'admin' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {u.isBlocked ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1 w-max">
                          <ShieldOff className="w-3 h-3" /> Blocked
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 w-max">
                          <Shield className="w-3 h-3" /> Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {u._id !== currentUser.id && (
                          <>
                            {u.pendingDeletion ? (
                              <>
                                <div className="text-xs px-3 py-1.5 bg-amber-500/20 text-amber-300 rounded-lg border border-amber-500/30 font-medium">
                                  {u.role === 'admin' && 'Admin'} {u.role === 'user' && 'User'} requested deletion
                                </div>
                                {currentUser.role === 'creator' && (
                                  <button
                                    onClick={() => {
                                      if (window.confirm(`Permanently delete ${u.name}'s account and all their tasks?`)) {
                                        approvePendingDeletion(u._id);
                                      }
                                    }}
                                    disabled={actionLoading === u._id.toString()}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 border border-rose-500/50 transition-colors flex items-center gap-1"
                                    title="Approve Deletion"
                                  >
                                    {actionLoading === u._id.toString() ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Trash2 className="w-3 h-3" />
                                    )}
                                    Approve
                                  </button>
                                )}
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleToggleBlock(u._id, u.isBlocked)}
                                  disabled={actionLoading === u._id}
                                  className={`p-2 rounded-xl text-sm font-medium transition-colors border ${
                                    u.isBlocked 
                                      ? 'text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30' 
                                      : 'text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30'
                                  }`}
                                  title={u.isBlocked ? 'Unblock User' : 'Block User'}
                                >
                                  {actionLoading === u._id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : u.isBlocked ? (
                                    <Shield className="w-4 h-4" />
                                  ) : (
                                    <ShieldOff className="w-4 h-4" />
                                  )}
                                </button>
                                <button
                                  onClick={() => handleRemoveUser(u._id)}
                                  disabled={actionLoading === u._id}
                                  className="p-2 rounded-xl text-rose-400 hover:text-white bg-white/5 hover:bg-rose-500 border border-white/5 transition-all"
                                  title="Remove User"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceSettings;
