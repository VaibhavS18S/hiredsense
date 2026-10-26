import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Briefcase,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Save,
  HelpCircle,
} from 'lucide-react';
import { api } from '../api/client';

export const JobCreateEditPage = () => {
  const { jobId } = useParams();
  const isEdit = Boolean(jobId);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    department: 'Engineering',
    location: 'San Francisco, CA (Hybrid)',
    type: 'Full-time',
    experienceLevel: 'Senior Level',
    minYearsExperience: 5,
    salaryRange: { min: 150000, max: 200000, currency: 'USD' },
    qualifications: ["Bachelor's Degree in Computer Science or equivalent practical experience"],
    mandatorySkills: [
      { name: 'React', minYears: 3, importance: 'critical', category: 'Frontend' },
      { name: 'Node.js', minYears: 3, importance: 'critical', category: 'Backend' },
    ],
    preferredSkills: [
      { name: 'Docker', importance: 'high', category: 'Cloud & DevOps' },
    ],
    responsibilities: [
      'Design, develop, and maintain performant web applications and services.',
      'Collaborate with cross-functional teams to define architecture and requirements.',
    ],
    rawDescription: '',
    status: 'active',
  });

  const [newMandatorySkill, setNewMandatorySkill] = useState({ name: '', minYears: 3, importance: 'high', category: 'Core' });
  const [newPreferredSkill, setNewPreferredSkill] = useState({ name: '', importance: 'medium', category: 'General' });
  const [newResp, setNewResp] = useState('');
  const [readiness, setReadiness] = useState(null);
  const [loading, setLoading] = useState(false);
  const [enhancing, setEnhancing] = useState(false);

  useEffect(() => {
    if (isEdit) {
      loadJob();
    } else {
      triggerAnalysis(formData);
    }
  }, [jobId]);

  const loadJob = async () => {
    try {
      const res = await api.get(`/jobs/${jobId}`);
      if (res.success && res.data) {
        setFormData(res.data);
        triggerAnalysis(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const triggerAnalysis = async (dataToAnalyze) => {
    try {
      const res = await api.post('/jobs/analyze', dataToAnalyze);
      if (res.success) {
        setReadiness(res.data);
      }
    } catch (e) {}
  };

  const handleInputChange = (field, value) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    triggerAnalysis(updated);
  };

  const handleSalaryChange = (field, value) => {
    const updated = {
      ...formData,
      salaryRange: { ...formData.salaryRange, [field]: Number(value) },
    };
    setFormData(updated);
  };

  // Add Skill
  const addMandatorySkill = () => {
    if (newMandatorySkill.name.trim()) {
      const updated = {
        ...formData,
        mandatorySkills: [...formData.mandatorySkills, { ...newMandatorySkill, name: newMandatorySkill.name.trim() }],
      };
      setFormData(updated);
      setNewMandatorySkill({ name: '', minYears: 3, importance: 'high', category: 'Core' });
      triggerAnalysis(updated);
    }
  };

  const removeMandatorySkill = (index) => {
    const updated = {
      ...formData,
      mandatorySkills: formData.mandatorySkills.filter((_, i) => i !== index),
    };
    setFormData(updated);
    triggerAnalysis(updated);
  };

  const addPreferredSkill = () => {
    if (newPreferredSkill.name.trim()) {
      const updated = {
        ...formData,
        preferredSkills: [...formData.preferredSkills, { ...newPreferredSkill, name: newPreferredSkill.name.trim() }],
      };
      setFormData(updated);
      setNewPreferredSkill({ name: '', importance: 'medium', category: 'General' });
      triggerAnalysis(updated);
    }
  };

  const removePreferredSkill = (index) => {
    const updated = {
      ...formData,
      preferredSkills: formData.preferredSkills.filter((_, i) => i !== index),
    };
    setFormData(updated);
    triggerAnalysis(updated);
  };

  // Add Responsibility
  const addResponsibility = () => {
    if (newResp.trim()) {
      const updated = {
        ...formData,
        responsibilities: [...formData.responsibilities, newResp.trim()],
      };
      setFormData(updated);
      setNewResp('');
      triggerAnalysis(updated);
    }
  };

  const removeResponsibility = (index) => {
    const updated = {
      ...formData,
      responsibilities: formData.responsibilities.filter((_, i) => i !== index),
    };
    setFormData(updated);
    triggerAnalysis(updated);
  };

  // AI Enhancer
  const handleAIEnhance = async () => {
    if (!formData.title) {
      alert('Please enter a Job Title first so the AI can suggest relevant competencies.');
      return;
    }
    setEnhancing(true);
    try {
      const res = await api.post('/jobs/enhance', { title: formData.title });
      if (res.success && res.data) {
        const enhanced = {
          ...formData,
          mandatorySkills: res.data.mandatorySkills || formData.mandatorySkills,
          preferredSkills: res.data.preferredSkills || formData.preferredSkills,
          responsibilities: res.data.responsibilities || formData.responsibilities,
          qualifications: res.data.qualifications || formData.qualifications,
        };
        setFormData(enhanced);
        triggerAnalysis(enhanced);
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setEnhancing(false);
    }
  };

  // Form Submit
  const handleSubmit = async (e, targetStatus) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        status: targetStatus || formData.status,
      };

      if (isEdit) {
        await api.put(`/jobs/${jobId}`, payload);
      } else {
        await api.post('/jobs', payload);
      }

      navigate('/jobs');
    } catch (err) {
      alert(err.message || 'Failed to save job opening');
    } finally {
      setLoading(false);
    }
  };

  const isReady = (readiness?.clarityScore || 0) >= 70;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <Link to="/jobs" className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to jobs</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => handleSubmit(e, 'draft')}
            disabled={loading}
            className="px-3.5 py-1.5 border border-border bg-white rounded-lg text-xs font-medium text-ink hover:bg-sage-50 transition-colors shadow-subtle disabled:opacity-50"
          >
            Save as Draft
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e, 'active')}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-forest-500 hover:bg-forest-600 text-white rounded-lg text-xs font-medium shadow-sm transition-colors disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isEdit ? 'Update & Publish' : 'Publish Job Opening'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Information */}
          <div className="surface-card rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-editorial text-lg font-semibold text-ink">
                Role Overview
              </h2>
              <button
                type="button"
                onClick={handleAIEnhance}
                disabled={enhancing}
                className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-sage-100 text-forest-700 border border-sage-300 hover:bg-sage-200 transition-colors font-medium"
              >
                <Sparkles className="w-3.5 h-3.5 text-forest-600" />
                <span>{enhancing ? 'Analyzing Role...' : 'Auto-Generate Skills with AI'}</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink mb-1">Job Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Senior Full-Stack Engineer"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full bg-[#FBFBF9] border border-border rounded-lg px-3 py-2 text-xs text-ink focus:outline-none focus:border-forest-500 focus:bg-white transition-all font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-ink mb-1">Department</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  className="w-full bg-[#FBFBF9] border border-border rounded-lg px-3 py-2 text-xs text-ink focus:outline-none focus:border-forest-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink mb-1">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full bg-[#FBFBF9] border border-border rounded-lg px-3 py-2 text-xs text-ink focus:outline-none focus:border-forest-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-ink mb-1">Employment Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className="w-full bg-[#FBFBF9] border border-border rounded-lg px-3 py-2 text-xs text-ink focus:outline-none focus:border-forest-500 focus:bg-white transition-all"
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink mb-1">Experience Level</label>
                <select
                  value={formData.experienceLevel}
                  onChange={(e) => handleInputChange('experienceLevel', e.target.value)}
                  className="w-full bg-[#FBFBF9] border border-border rounded-lg px-3 py-2 text-xs text-ink focus:outline-none focus:border-forest-500 focus:bg-white transition-all"
                >
                  <option value="Entry Level">Entry Level</option>
                  <option value="Mid Level">Mid Level</option>
                  <option value="Senior Level">Senior Level</option>
                  <option value="Lead / Staff">Lead / Staff</option>
                  <option value="Executive">Executive</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink mb-1">Min Experience (Yrs)</label>
                <input
                  type="number"
                  min={0}
                  max={25}
                  value={formData.minYearsExperience}
                  onChange={(e) => handleInputChange('minYearsExperience', Number(e.target.value))}
                  className="w-full bg-[#FBFBF9] border border-border rounded-lg px-3 py-2 text-xs text-ink focus:outline-none focus:border-forest-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Salary Band */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-medium text-ink mb-1">Min Salary ($ USD)</label>
                <input
                  type="number"
                  step={5000}
                  value={formData.salaryRange?.min || 0}
                  onChange={(e) => handleSalaryChange('min', e.target.value)}
                  className="w-full bg-[#FBFBF9] border border-border rounded-lg px-3 py-2 text-xs text-ink focus:outline-none focus:border-forest-500 focus:bg-white transition-all font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink mb-1">Max Salary ($ USD)</label>
                <input
                  type="number"
                  step={5000}
                  value={formData.salaryRange?.max || 0}
                  onChange={(e) => handleSalaryChange('max', e.target.value)}
                  className="w-full bg-[#FBFBF9] border border-border rounded-lg px-3 py-2 text-xs text-ink focus:outline-none focus:border-forest-500 focus:bg-white transition-all font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink mb-1">Role Summary & Overview</label>
              <textarea
                rows={3}
                placeholder="Paste or write detailed role summary..."
                value={formData.rawDescription}
                onChange={(e) => handleInputChange('rawDescription', e.target.value)}
                className="w-full bg-[#FBFBF9] border border-border rounded-lg px-3 py-2 text-xs text-ink focus:outline-none focus:border-forest-500 focus:bg-white transition-all leading-relaxed"
              />
            </div>
          </div>

          {/* Mandatory Skills (Separated from preferred) */}
          <div className="surface-card rounded-2xl p-6">
            <div className="mb-3">
              <h3 className="font-editorial text-lg font-semibold text-ink">
                Mandatory Skills & Requirements
              </h3>
              <p className="text-xs text-ink-muted">
                Critical core competencies required for candidate eligibility.
              </p>
            </div>

            {/* Skill list */}
            <div className="space-y-2 mb-4">
              {formData.mandatorySkills.map((sk, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#FBFBF9] border border-border text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-ink">{sk.name}</span>
                    <span className="text-[10px] text-ink-subtle">({sk.category})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-forest-700 bg-sage-100 px-2 py-0.5 rounded font-medium">
                      {sk.minYears}+ yrs
                    </span>
                    <button
                      type="button"
                      onClick={() => removeMandatorySkill(index)}
                      className="text-ink-subtle hover:text-red-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add skill row */}
            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <input
                type="text"
                placeholder="Skill name (e.g. React, Docker)"
                value={newMandatorySkill.name}
                onChange={(e) => setNewMandatorySkill({ ...newMandatorySkill, name: e.target.value })}
                className="flex-1 bg-white border border-border rounded-lg px-3 py-1.5 text-xs text-ink focus:outline-none focus:border-forest-500"
              />
              <input
                type="number"
                min={1}
                max={20}
                placeholder="Min Yrs"
                value={newMandatorySkill.minYears}
                onChange={(e) => setNewMandatorySkill({ ...newMandatorySkill, minYears: Number(e.target.value) })}
                className="w-20 bg-white border border-border rounded-lg px-2 py-1.5 text-xs text-ink text-center"
              />
              <button
                type="button"
                onClick={addMandatorySkill}
                className="px-3 py-1.5 bg-sage-100 text-forest-700 hover:bg-sage-200 border border-sage-300 rounded-lg text-xs font-medium"
              >
                Add Skill
              </button>
            </div>
          </div>

          {/* Preferred Skills */}
          <div className="surface-card rounded-2xl p-6">
            <div className="mb-3">
              <h3 className="font-editorial text-lg font-semibold text-ink">
                Preferred Skills (Advantage)
              </h3>
              <p className="text-xs text-ink-muted">
                Desirable secondary skills that give candidates a competitive edge.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {formData.preferredSkills.map((sk, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-sage-50 border border-sage-200 text-xs text-ink font-medium"
                >
                  <span>{sk.name}</span>
                  <button
                    type="button"
                    onClick={() => removePreferredSkill(index)}
                    className="text-ink-subtle hover:text-red-700 ml-1"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <input
                type="text"
                placeholder="Preferred skill name (e.g. GraphQL, Tailwind)"
                value={newPreferredSkill.name}
                onChange={(e) => setNewPreferredSkill({ ...newPreferredSkill, name: e.target.value })}
                className="flex-1 bg-white border border-border rounded-lg px-3 py-1.5 text-xs text-ink focus:outline-none focus:border-forest-500"
              />
              <button
                type="button"
                onClick={addPreferredSkill}
                className="px-3 py-1.5 bg-sage-100 text-forest-700 hover:bg-sage-200 border border-sage-300 rounded-lg text-xs font-medium"
              >
                Add Preferred
              </button>
            </div>
          </div>

          {/* Key Responsibilities */}
          <div className="surface-card rounded-2xl p-6">
            <div className="mb-3">
              <h3 className="font-editorial text-lg font-semibold text-ink">
                Key Responsibilities & Deliverables
              </h3>
              <p className="text-xs text-ink-muted">
                What this hire will own and execute.
              </p>
            </div>

            <div className="space-y-2 mb-4">
              {formData.responsibilities.map((resp, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between gap-2 p-2.5 rounded-xl bg-[#FBFBF9] border border-border text-xs leading-relaxed"
                >
                  <span className="text-ink-muted">{resp}</span>
                  <button
                    type="button"
                    onClick={() => removeResponsibility(index)}
                    className="text-ink-subtle hover:text-red-700 shrink-0 mt-0.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <input
                type="text"
                placeholder="Add responsibility (e.g. Architect and scale distributed services...)"
                value={newResp}
                onChange={(e) => setNewResp(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addResponsibility(); } }}
                className="flex-1 bg-white border border-border rounded-lg px-3 py-1.5 text-xs text-ink focus:outline-none focus:border-forest-500"
              />
              <button
                type="button"
                onClick={addResponsibility}
                className="px-3 py-1.5 bg-sage-100 text-forest-700 hover:bg-sage-200 border border-sage-300 rounded-lg text-xs font-medium shrink-0"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Real-time Readiness Inspector & Suggestions */}
        <div className="space-y-6">
          <div className="surface-card rounded-2xl p-6 sticky top-20">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-editorial text-base font-semibold text-ink">
                Live Job Readiness
              </h3>
              <span
                className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                  isReady ? 'bg-forest-50 text-forest-700' : 'bg-amber-50 text-amber-700'
                }`}
              >
                {readiness?.clarityScore || 0}%
              </span>
            </div>

            <div className="w-full bg-[#EAECE5] h-2 rounded-full overflow-hidden mb-4">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isReady ? 'bg-forest-500' : 'bg-amber-500'
                }`}
                style={{ width: `${readiness?.clarityScore || 0}%` }}
              />
            </div>

            <div className="space-y-4 text-xs">
              {/* Missing elements alert */}
              {readiness?.missingElements && readiness.missingElements.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                  <span className="font-semibold block mb-1 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-700" /> Missing Information:
                  </span>
                  <ul className="space-y-1 text-[11px] list-disc list-inside text-amber-800">
                    {readiness.missingElements.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Vague wording alert */}
              {readiness?.vaguePhrases && readiness.vaguePhrases.length > 0 && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-900">
                  <span className="font-semibold block mb-1">Vague Terms Detected:</span>
                  <p className="text-[11px] text-red-800 leading-relaxed">
                    Found: {readiness.vaguePhrases.join(', ')}. Replace with concrete targets.
                  </p>
                </div>
              )}

              {/* Suggestions */}
              {readiness?.suggestions && readiness.suggestions.length > 0 && (
                <div>
                  <span className="font-semibold uppercase tracking-wider text-[10px] text-ink-subtle block mb-1.5">
                    Actionable Guidance:
                  </span>
                  <div className="space-y-1.5 text-[11px] text-ink-muted leading-relaxed">
                    {readiness.suggestions.map((s, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-forest-600 shrink-0 mt-0.5" />
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
