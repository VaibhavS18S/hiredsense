import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Plus, Shield, Mail, CheckCircle2 } from 'lucide-react';
import { api } from '../../api/client';

export const TeamSettingsPage = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    role: 'recruiter',
    title: 'Senior Technical Recruiter',
  });

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    setLoading(true);
    try {
      const res = await api.get('/settings/team');
      if (res.success) setMembers(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/settings/team', newMember);
      if (res.success) {
        setShowInviteModal(false);
        setNewMember({ name: '', email: '', role: 'recruiter', title: 'Senior Technical Recruiter' });
        fetchTeam();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-px overflow-x-auto text-xs font-medium">
        <Link
          to="/settings/profile"
          className="px-4 py-2 border-b-2 border-transparent text-ink-muted hover:text-ink"
        >
          Profile & Audit Trail
        </Link>
        <Link
          to="/settings/team"
          className="px-4 py-2 border-b-2 border-forest-600 text-forest-800 font-semibold bg-sage-50/50 rounded-t-lg"
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

      <div className="surface-card rounded-2xl p-6">
        <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
          <div>
            <h2 className="font-editorial text-xl font-bold text-ink">
              Team Member Access & Roles
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Manage organization recruiters, hiring managers, and review permissions.
            </p>
          </div>

          <button
            onClick={() => setShowInviteModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-forest-500 hover:bg-forest-600 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Member</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAFBF9] border-b border-border text-ink-muted uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {members.map((m) => (
                <tr key={m._id} className="hover:bg-sage-50/40 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-bold text-ink block">{m.name}</span>
                    <span className="text-[11px] text-ink-subtle">{m.email}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="capitalize text-xs font-mono px-2 py-0.5 rounded bg-sage-100 text-forest-800 font-medium">
                      {m.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-ink-muted">{m.title}</td>
                  <td className="py-3 px-4 text-ink-subtle">
                    {new Date(m.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-dropdown border border-border max-w-sm w-full p-6 space-y-4">
            <h3 className="font-editorial text-lg font-bold text-ink">
              Add Team Member
            </h3>

            <form onSubmit={handleAddMember} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-ink mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Alex Rivera"
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  className="w-full bg-[#FBFBF9] border border-border rounded-lg px-3 py-1.5 text-xs text-ink focus:outline-none focus:border-forest-500"
                />
              </div>

              <div>
                <label className="block font-medium text-ink mb-1">Email</label>
                <input
                  type="email"
                  required
                  placeholder="alex@vanguardtalent.io"
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  className="w-full bg-[#FBFBF9] border border-border rounded-lg px-3 py-1.5 text-xs text-ink focus:outline-none focus:border-forest-500"
                />
              </div>

              <div>
                <label className="block font-medium text-ink mb-1">Role</label>
                <select
                  value={newMember.role}
                  onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                  className="w-full bg-[#FBFBF9] border border-border rounded-lg px-3 py-1.5 text-xs text-ink focus:outline-none focus:border-forest-500"
                >
                  <option value="recruiter">Recruiter</option>
                  <option value="hiring_manager">Hiring Manager</option>
                  <option value="reviewer">Reviewer</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-ink mb-1">Title</label>
                <input
                  type="text"
                  value={newMember.title}
                  onChange={(e) => setNewMember({ ...newMember, title: e.target.value })}
                  className="w-full bg-[#FBFBF9] border border-border rounded-lg px-3 py-1.5 text-xs text-ink focus:outline-none focus:border-forest-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-3.5 py-1.5 border border-border rounded-lg text-xs font-medium text-ink hover:bg-sage-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-forest-500 hover:bg-forest-600 text-white rounded-lg text-xs font-semibold"
                >
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
