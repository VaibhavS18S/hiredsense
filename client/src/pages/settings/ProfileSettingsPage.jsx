import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Shield,
  Sliders,
  Users,
  Lock,
  Save,
  CheckCircle2,
  Clock,
  Activity,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';

export const ProfileSettingsPage = () => {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    title: user?.title || '',
    preferences: user?.preferences || {},
  });
  const [auditLogs, setAuditLogs] = useState([]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      const res = await api.get('/settings/audit');
      if (res.success) {
        setAuditLogs(res.data || []);
      }
    } catch (e) {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/auth/profile', formData);
      if (res.success) {
        updateUser(res.data);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-px overflow-x-auto text-xs font-medium">
        <Link
          to="/settings/profile"
          className="px-4 py-2 border-b-2 border-forest-600 text-forest-800 font-semibold bg-sage-50/50 rounded-t-lg"
        >
          Profile & Audit Trail
        </Link>
        <Link
          to="/settings/team"
          className="px-4 py-2 border-b-2 border-transparent text-ink-muted hover:text-ink"
        >
          Team & Roles
        </Link>
        <Link
          to="/settings/scoring"
          className="px-4 py-2 border-b-2 border-transparent text-ink-muted hover:text-ink"
        >
          Scoring Engine Weights
        </Link>
        <Link
          to="/settings/privacy"
          className="px-4 py-2 border-b-2 border-transparent text-ink-muted hover:text-ink"
        >
          Consent & Privacy (GDPR)
        </Link>
      </div>

      {/* Recruiter Profile Card */}
      <div className="surface-card rounded-2xl p-6">
        <h2 className="font-editorial text-xl font-bold text-ink mb-1">
          Recruiter Profile
        </h2>
        <p className="text-xs text-ink-muted mb-4">
          Manage your personal details and recruiting notification preferences.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-ink mb-1">Full Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-[#FBFBF9] border border-border rounded-lg px-3 py-2 text-xs text-ink focus:outline-none focus:border-forest-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink mb-1">Email (Read Only)</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full bg-[#F2F3EF] border border-border rounded-lg px-3 py-2 text-xs text-ink-muted cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink mb-1">Professional Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-[#FBFBF9] border border-border rounded-lg px-3 py-2 text-xs text-ink focus:outline-none focus:border-forest-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-between">
            {success && (
              <span className="text-xs font-semibold text-forest-700 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Profile saved!
              </span>
            )}
            <button
              type="submit"
              disabled={saving}
              className="ml-auto px-4 py-2 bg-forest-500 hover:bg-forest-600 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Profile'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Activity Audit Trail Viewer (Section 4, Feature 4) */}
      <div className="surface-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="font-editorial text-lg font-semibold text-ink flex items-center gap-2">
              <Activity className="w-4 h-4 text-forest-600" />
              Enterprise Activity Audit Trail
            </h3>
            <p className="text-xs text-ink-muted">
              Immutable ledger of job edits, candidate stage movements, scoring overrides, and GDPR data exports.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto pt-3">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAFBF9] border-b border-border text-ink-muted uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Actor</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Target Entity</th>
                <th className="py-2.5 px-3">Context & Audit Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {auditLogs.slice(0, 15).map((log) => (
                <tr key={log._id} className="hover:bg-sage-50/40 transition-colors">
                  <td className="py-2.5 px-3 font-mono text-[11px] text-ink-subtle">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-ink">
                    {log.user?.name || 'System'}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-mono text-[10px] bg-sage-50 text-forest-800 px-2 py-0.5 rounded font-bold border border-sage-200">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-ink-muted">{log.entityType}</td>
                  <td className="py-2.5 px-3 text-ink-muted text-[11px] truncate max-w-xs">
                    {JSON.stringify(log.details).replace(/[{}"]/g, ' ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
