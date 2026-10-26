import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  EyeOff,
  Clock,
  Download,
  Trash2,
  CheckCircle2,
  Save,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../../api/client';

export const PrivacySettingsPage = () => {
  const [retentionDays, setRetentionDays] = useState(365);
  const [anonymizedScreening, setAnonymizedScreening] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidateForExport, setSelectedCandidateForExport] = useState('');
  const [selectedCandidateForDelete, setSelectedCandidateForDelete] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetchOrgSettings();
    fetchCandidates();
  }, []);

  const fetchOrgSettings = async () => {
    try {
      const res = await api.get('/settings/organization');
      if (res.success && res.data) {
        setRetentionDays(res.data.retentionDays || 365);
        setAnonymizedScreening(res.data.anonymizedScreening || false);
      }
    } catch (e) {}
  };

  const fetchCandidates = async () => {
    try {
      const res = await api.get('/candidates?limit=50');
      if (res.success) {
        setCandidates(res.data || []);
        if (res.data.length > 0) {
          setSelectedCandidateForExport(res.data[0]._id);
          setSelectedCandidateForDelete(res.data[0]._id);
        }
      }
    } catch (e) {}
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/settings/organization', {
        retentionDays: Number(retentionDays),
        anonymizedScreening,
      });

      if (res.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleExportCandidateData = async () => {
    if (!selectedCandidateForExport) return;
    try {
      const res = await api.get(`/settings/privacy/export/${selectedCandidateForExport}`);
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(res, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `candidate_gdpr_export_${selectedCandidateForExport}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      alert('Export failed: ' + err.message);
    }
  };

  const handleDeleteCandidatePermanently = async () => {
    if (!selectedCandidateForDelete) return;
    const confirmName = prompt('Type "DELETE" to permanently purge candidate records, resumes, and screening assessments (GDPR Right to be Forgotten):');
    if (confirmName === 'DELETE') {
      try {
        const res = await api.delete(`/settings/privacy/delete/${selectedCandidateForDelete}`);
        alert(res.message || 'Candidate records successfully purged.');
        fetchCandidates();
      } catch (err) {
        alert(err.message);
      }
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
          className="px-4 py-2 border-b-2 border-forest-600 text-forest-800 font-semibold bg-sage-50/50 rounded-t-lg"
        >
          Consent & Privacy (GDPR)
        </Link>
      </div>

      {/* Responsible Screening & Fairness Pledge */}
      <div className="surface-card rounded-2xl p-6 border-l-4 border-l-forest-500">
        <h2 className="font-editorial text-xl font-bold text-ink mb-1 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-forest-600" />
          Responsible AI Screening & Fairness Guarantee
        </h2>
        <p className="text-xs text-ink-muted leading-relaxed">
          HireSense AI never uses gender, religion, caste, ethnicity, age, photographs, disability, or protected personal characteristics in calculating candidate scores. Algorithmic results serve strictly as evidence-based recommendations for recruiter evaluation.
        </p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Retention Policy */}
        <div className="surface-card rounded-2xl p-6 space-y-4">
          <h3 className="font-editorial text-lg font-semibold text-ink">
            Configurable Resume Data Retention
          </h3>
          <p className="text-xs text-ink-muted">
            Automatically flag or archive uploaded candidate documents older than the designated retention window.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {[180, 365, 730].map((days) => (
              <label
                key={days}
                className={`p-3.5 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                  retentionDays === days
                    ? 'bg-sage-50 border-forest-500 ring-1 ring-forest-500'
                    : 'bg-[#FBFBF9] border-border hover:border-forest-300'
                }`}
              >
                <div>
                  <span className="font-bold text-xs text-ink block">{days} Days</span>
                  <span className="text-[11px] text-ink-muted">
                    {days === 180 ? '6 Months' : days === 365 ? '1 Year (Default)' : '2 Years'}
                  </span>
                </div>
                <input
                  type="radio"
                  name="retention"
                  checked={retentionDays === days}
                  onChange={() => setRetentionDays(days)}
                  className="text-forest-600 focus:ring-forest-500"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Anonymized Screening Mode Toggle */}
        <div className="surface-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-editorial text-lg font-semibold text-ink flex items-center gap-2">
                <EyeOff className="w-4 h-4 text-forest-600" />
                Blind / Anonymized Screening Mode
              </h3>
              <p className="text-xs text-ink-muted mt-0.5">
                Mask candidate names, email handles, phone numbers, and profile avatars across candidate lists and screening hub to enforce unbiased skill evaluation.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setAnonymizedScreening(!anonymizedScreening)}
              className={`w-12 h-6 rounded-full p-1 transition-colors ${
                anonymizedScreening ? 'bg-forest-500' : 'bg-gray-300'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  anonymizedScreening ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Save Retention & Blind Mode */}
        <div className="flex items-center justify-between">
          {savedSuccess && (
            <span className="text-xs font-semibold text-forest-700 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Privacy settings saved!
            </span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="ml-auto px-4 py-2 bg-forest-500 hover:bg-forest-600 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Updating...' : 'Save Privacy Controls'}</span>
          </button>
        </div>
      </form>

      {/* GDPR Data Portability & Deletion Workflow */}
      <div className="surface-card rounded-2xl p-6 space-y-6">
        <h3 className="font-editorial text-lg font-semibold text-ink">
          GDPR & CCPA Candidate Data Rights
        </h3>

        {/* Export candidate data */}
        <div className="p-4 rounded-xl bg-[#FBFBF9] border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-bold text-ink block">Authorized Candidate Data Portability Export</span>
            <span className="text-ink-muted text-[11px]">
              Export full JSON data package containing parsed profile, application history, and screening scores.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedCandidateForExport}
              onChange={(e) => setSelectedCandidateForExport(e.target.value)}
              className="bg-white border border-border rounded-lg text-xs px-2.5 py-1.5 text-ink max-w-[180px]"
            >
              {candidates.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleExportCandidateData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sage-100 hover:bg-sage-200 border border-sage-300 text-forest-800 rounded-lg font-semibold shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>

        {/* Permanent Right to be forgotten deletion */}
        <div className="p-4 rounded-xl bg-red-50/50 border border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-bold text-red-900 block">Right to be Forgotten (Permanent Purge)</span>
            <span className="text-red-800/80 text-[11px]">
              Permanently cascades and deletes candidate record, uploaded resumes, applications, and evaluations.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedCandidateForDelete}
              onChange={(e) => setSelectedCandidateForDelete(e.target.value)}
              className="bg-white border border-red-200 rounded-lg text-xs px-2.5 py-1.5 text-ink max-w-[180px]"
            >
              {candidates.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleDeleteCandidatePermanently}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold shrink-0 shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Purge Records</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
