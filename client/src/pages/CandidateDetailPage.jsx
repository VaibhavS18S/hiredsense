import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Linkedin,
  Github,
  Globe,
  Briefcase,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowLeft,
  Edit,
  FileText,
  Sliders,
  Send,
  ShieldCheck,
  Award,
} from 'lucide-react';
import { api } from '../api/client';
import { ScoreBadge } from '../components/common/ScoreBadge';

export const CandidateDetailPage = () => {
  const { candidateId } = useParams();
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  // Correction Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    totalExperienceYears: 0,
    headline: '',
  });

  // Manual Override State
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideScreeningId, setOverrideScreeningId] = useState(null);
  const [newScore, setNewScore] = useState(85);
  const [overrideReason, setOverrideReason] = useState('');

  // Recruiter Note State
  const [noteText, setNoteText] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  useEffect(() => {
    fetchCandidateDetail();
  }, [candidateId]);

  const fetchCandidateDetail = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/candidates/${candidateId}`);
      if (res.success && res.data) {
        setData(res.data);
        const c = res.data.candidate;
        setEditFormData({
          name: c.name,
          email: c.email,
          phone: c.phone || '',
          location: c.location || '',
          totalExperienceYears: c.totalExperienceYears || 0,
          headline: c.headline || '',
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCorrection = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/candidates/${candidateId}`, editFormData);
      if (res.success) {
        setShowEditModal(false);
        fetchCandidateDetail();
      }
    } catch (err) {
      alert(err.message || 'Failed to update candidate details');
    }
  };

  const handleApplyOverride = async (e) => {
    e.preventDefault();
    if (!overrideReason.trim()) {
      alert('A justification reason is required for auditability.');
      return;
    }

    try {
      const res = await api.patch(`/screening/${overrideScreeningId}/override`, {
        adjustedScore: Number(newScore),
        reason: overrideReason.trim(),
      });
      if (res.success) {
        setShowOverrideModal(false);
        fetchCandidateDetail();
      }
    } catch (err) {
      alert(err.message || 'Override failed');
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    setSubmittingNote(true);
    try {
      const currentApp = (data?.applications || [])[0];
      await api.post(`/candidates/${candidateId}/notes`, {
        text: noteText.trim(),
        applicationId: currentApp?._id,
      });
      setNoteText('');
      fetchCandidateDetail();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmittingNote(false);
    }
  };

  if (loading) {
    return <div className="py-16 text-center text-xs text-ink-muted">Loading candidate profile...</div>;
  }

  if (!data?.candidate) {
    return (
      <div className="surface-card rounded-2xl p-8 text-center">
        <p className="text-xs text-ink-muted">Candidate record not found.</p>
        <Link to="/candidates" className="text-xs text-forest-600 font-medium mt-2 inline-block">
          &larr; Back to candidates
        </Link>
      </div>
    );
  }

  const { candidate, resumes, applications, screeningResults } = data;
  const primaryScreening = screeningResults && screeningResults.length > 0 ? screeningResults[0] : null;
  const primaryResume = resumes && resumes.length > 0 ? resumes[0] : null;

  // Group skills by category
  const skillsByCategory = {};
  (candidate.skills || []).forEach((sk) => {
    const cat = sk.category || 'General Competencies';
    if (!skillsByCategory[cat]) skillsByCategory[cat] = [];
    skillsByCategory[cat].push(sk);
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link to="/candidates" className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to candidates</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEditModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border bg-white rounded-lg text-xs font-medium text-ink hover:bg-sage-50 transition-colors shadow-subtle"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Correct Parsed Data</span>
          </button>
        </div>
      </div>

      {/* Candidate Profile Header Card */}
      <div className="surface-card rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-forest-100 text-forest-800 font-editorial text-2xl font-bold flex items-center justify-center shrink-0 border border-forest-200">
              {candidate.name.charAt(0)}
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-ink">
                  {candidate.name}
                </h1>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-sage-100 text-forest-800 border border-sage-300 font-mono font-medium">
                  {primaryResume?.confidenceScore || 92}% Parser Confidence
                </span>
              </div>

              <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                {candidate.headline || `${candidate.totalExperienceYears} Years Experience`}
              </p>

              <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-ink-subtle">
                {candidate.email && (
                  <span className="flex items-center gap-1 text-ink">
                    <Mail className="w-3.5 h-3.5 text-ink-subtle" />
                    {candidate.email}
                  </span>
                )}
                {candidate.phone && (
                  <span className="flex items-center gap-1 text-ink">
                    <Phone className="w-3.5 h-3.5 text-ink-subtle" />
                    {candidate.phone}
                  </span>
                )}
                <span className="flex items-center gap-1 text-ink">
                  <MapPin className="w-3.5 h-3.5 text-ink-subtle" />
                  {candidate.location || 'Remote'}
                </span>
                <span className="flex items-center gap-1 text-ink">
                  <Clock className="w-3.5 h-3.5 text-ink-subtle" />
                  {candidate.totalExperienceYears} years exp
                </span>
              </div>

              {/* External Links */}
              {candidate.links && (
                <div className="flex items-center gap-3 mt-3 text-xs">
                  {candidate.links.linkedin && (
                    <a
                      href={candidate.links.linkedin}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-forest-700 hover:text-forest-800 font-medium"
                    >
                      <Linkedin className="w-3.5 h-3.5" />
                      <span>LinkedIn</span>
                    </a>
                  )}
                  {candidate.links.github && (
                    <a
                      href={candidate.links.github}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-forest-700 hover:text-forest-800 font-medium"
                    >
                      <Github className="w-3.5 h-3.5" />
                      <span>GitHub</span>
                    </a>
                  )}
                  {candidate.links.portfolio && (
                    <a
                      href={candidate.links.portfolio}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-forest-700 hover:text-forest-800 font-medium"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Portfolio</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Primary Screening Match Score Badge */}
          {primaryScreening && (
            <div className="p-4 rounded-xl bg-sage-50 border border-sage-200 text-right min-w-[200px]">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-subtle block mb-1">
                Target Role Match
              </span>
              <span className="text-xs font-semibold text-ink block mb-1 truncate">
                {primaryScreening.jobId?.title}
              </span>
              <div className="flex justify-end">
                <ScoreBadge score={primaryScreening.overallScore} size="lg" showLabel={true} />
              </div>
              {primaryScreening.recruiterOverride?.isOverridden && (
                <span className="text-[10px] text-amber-700 font-medium block mt-1">
                  Overridden by Recruiter
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Profile Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-px overflow-x-auto text-xs font-medium">
        {[
          { id: 'overview', label: 'Match Overview & Evidence' },
          { id: 'timeline', label: 'Experience & Education' },
          { id: 'skills', label: `Skills Taxonomy (${candidate.skills?.length || 0})` },
          { id: 'resume', label: 'Original Resume Document' },
          { id: 'notes', label: 'Recruiter Notes & Audit' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-forest-600 text-forest-800 font-semibold bg-sage-50/50 rounded-t-lg'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Match Overview & Evidence */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {primaryScreening ? (
            <>
              {/* Component breakdown */}
              <div className="surface-card rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-editorial text-lg font-semibold text-ink">
                      Explainable AI Component Breakdown
                    </h3>
                    <p className="text-xs text-ink-muted">
                      Role: <span className="font-semibold text-ink">{primaryScreening.jobId?.title}</span>
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setOverrideScreeningId(primaryScreening._id);
                      setNewScore(primaryScreening.overallScore);
                      setShowOverrideModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sage-50 border border-sage-300 rounded-lg text-xs font-medium text-forest-800 hover:bg-sage-100 transition-colors"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Recruiter Manual Override</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-3.5 rounded-xl bg-[#FBFBF9] border border-border">
                    <span className="text-[11px] text-ink-subtle block mb-1">
                      Skill Alignment (40%)
                    </span>
                    <span className="font-mono text-2xl font-bold text-ink">
                      {primaryScreening.componentScores?.skillAlignment}%
                    </span>
                    <span className="text-[10px] text-ink-muted block mt-1">
                      {primaryScreening.matchedRequiredSkills?.length || 0} mandatory skills matched
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#FBFBF9] border border-border">
                    <span className="text-[11px] text-ink-subtle block mb-1">
                      Semantic Similarity (30%)
                    </span>
                    <span className="font-mono text-2xl font-bold text-ink">
                      {primaryScreening.componentScores?.semanticSimilarity}%
                    </span>
                    <span className="text-[10px] text-ink-muted block mt-1">
                      Vector cosine document match
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#FBFBF9] border border-border">
                    <span className="text-[11px] text-ink-subtle block mb-1">
                      Relevant Experience (20%)
                    </span>
                    <span className="font-mono text-2xl font-bold text-ink">
                      {primaryScreening.componentScores?.experienceScore}%
                    </span>
                    <span className="text-[10px] text-ink-muted block mt-1">
                      {primaryScreening.experienceEvidence?.summary || `${candidate.totalExperienceYears} yrs experience`}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#FBFBF9] border border-border">
                    <span className="text-[11px] text-ink-subtle block mb-1">
                      Qualification Match (10%)
                    </span>
                    <span className="font-mono text-2xl font-bold text-ink">
                      {primaryScreening.componentScores?.qualificationScore}%
                    </span>
                    <span className="text-[10px] text-forest-700 font-medium block mt-1">
                      {primaryScreening.qualificationEvidence?.matchStatus || 'Meets'} standard
                    </span>
                  </div>
                </div>

                {/* Overridden Notice if active */}
                {primaryScreening.recruiterOverride?.isOverridden && (
                  <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                    <span className="font-semibold block mb-0.5">Recruiter Manual Override Applied</span>
                    <p className="text-[11px] text-amber-800">
                      Score adjusted from <span className="font-mono">{primaryScreening.recruiterOverride.originalScore}%</span> to <span className="font-mono font-bold">{primaryScreening.overallScore}%</span>.
                      Reason: "{primaryScreening.recruiterOverride.reason}"
                    </p>
                  </div>
                )}
              </div>

              {/* Supporting Excerpts & Evidence Citations */}
              <div className="surface-card rounded-2xl p-6">
                <h3 className="font-editorial text-lg font-semibold text-ink mb-1">
                  Evidence Excerpts from Resume
                </h3>
                <p className="text-xs text-ink-muted mb-4">
                  Direct citations extracted from candidate documents supporting the algorithm's assessment.
                </p>

                <div className="space-y-3">
                  {(primaryScreening.supportingExcerpts || []).map((exc, i) => (
                    <div key={i} className="p-3.5 rounded-xl bg-[#FBFBF9] border border-border text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-forest-800 text-[11px]">{exc.topic}</span>
                        <span className="text-[10px] text-ink-subtle">Source: {exc.sourceSection}</span>
                      </div>
                      <blockquote className="italic text-ink-muted border-l-2 border-forest-400 pl-2.5 py-0.5 leading-relaxed">
                        "{exc.quote}"
                      </blockquote>
                    </div>
                  ))}
                </div>
              </div>

              {/* Matched vs Missing Skills breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Matched mandatory skills */}
                <div className="surface-card rounded-2xl p-6">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-forest-700 mb-3 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-forest-600" /> Matched Mandatory Skills ({primaryScreening.matchedRequiredSkills?.length || 0})
                  </h4>
                  <div className="space-y-2">
                    {(primaryScreening.matchedRequiredSkills || []).map((m, i) => (
                      <div key={i} className="p-2.5 rounded-lg bg-forest-50/60 border border-forest-200 text-xs">
                        <span className="font-semibold text-forest-900 block">{m.skill}</span>
                        <span className="text-[11px] text-forest-800 italic block mt-0.5">
                          "{m.evidence}"
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Missing or unverified skills */}
                <div className="surface-card rounded-2xl p-6">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-700 mb-3 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" /> Missing / Unverified Skills ({primaryScreening.missingRequiredSkills?.length || 0})
                  </h4>
                  {(primaryScreening.missingRequiredSkills || []).length === 0 ? (
                    <p className="text-xs text-forest-700">All mandatory requirements verified in candidate text!</p>
                  ) : (
                    <div className="space-y-2">
                      {primaryScreening.missingRequiredSkills.map((m, i) => (
                        <div key={i} className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200 text-xs text-amber-900">
                          <span className="font-semibold block">{m}</span>
                          <span className="text-[11px] text-amber-800 block mt-0.5">
                            Not explicitly detected in resume experience. Recommended for interview probe.
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="surface-card rounded-2xl p-8 text-center text-xs text-ink-muted">
              Candidate has not been screened against a specific job opening yet.
              <Link to="/screening/upload" className="text-forest-600 font-medium block mt-2">
                Screen candidate against a job &rarr;
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Experience & Education Timeline */}
      {activeTab === 'timeline' && (
        <div className="space-y-6">
          {/* Work Experience */}
          <div className="surface-card rounded-2xl p-6">
            <h3 className="font-editorial text-lg font-semibold text-ink mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-forest-600" /> Work Experience Timeline
            </h3>

            <div className="space-y-6 relative border-l-2 border-sage-200 ml-3 pl-5">
              {(candidate.experienceTimeline || []).map((exp, index) => (
                <div key={index} className="relative">
                  <div className="w-3 h-3 rounded-full bg-forest-500 absolute -left-[27px] top-1 ring-4 ring-white" />
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-ink">{exp.role}</h4>
                    <span className="font-mono text-xs text-ink-subtle">
                      {exp.startDate} - {exp.endDate}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-forest-700 block mb-1">
                    {exp.company}
                  </span>
                  <p className="text-xs text-ink-muted leading-relaxed mb-2">
                    {exp.description}
                  </p>
                  {exp.technologies && exp.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {exp.technologies.map((t) => (
                        <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-sage-50 text-ink border border-sage-200">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Education */}
          <div className="surface-card rounded-2xl p-6">
            <h3 className="font-editorial text-lg font-semibold text-ink mb-4 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-forest-600" /> Education & Qualifications
            </h3>

            <div className="space-y-4">
              {(candidate.educationTimeline || []).map((edu, index) => (
                <div key={index} className="p-3.5 rounded-xl bg-[#FBFBF9] border border-border text-xs flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-ink block">{edu.degree}</span>
                    <span className="text-ink-muted">{edu.institution} &bull; {edu.field}</span>
                  </div>
                  <span className="font-mono text-xs text-forest-700 bg-sage-100 px-2 py-0.5 rounded font-medium">
                    {edu.graduationYear}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Skills Taxonomy */}
      {activeTab === 'skills' && (
        <div className="surface-card rounded-2xl p-6 space-y-6">
          <h3 className="font-editorial text-lg font-semibold text-ink mb-1">
            Categorized Skills Inventory
          </h3>
          <p className="text-xs text-ink-muted mb-4">
            Technical competencies extracted and categorized by domain.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(skillsByCategory).map(([category, skills]) => (
              <div key={category} className="p-4 rounded-xl bg-[#FBFBF9] border border-border">
                <span className="text-xs font-semibold text-forest-800 uppercase tracking-wider block mb-3">
                  {category} ({skills.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((s) => (
                    <div
                      key={s.name}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-border text-xs"
                    >
                      <span className="font-medium text-ink">{s.name}</span>
                      <span className="font-mono text-[10px] text-ink-subtle">
                        {s.yearsOfExperience}y
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Original Resume Text */}
      {activeTab === 'resume' && (
        <div className="surface-card rounded-2xl p-6">
          <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
            <div>
              <h3 className="font-editorial text-lg font-semibold text-ink">
                Raw Extracted Resume Document
              </h3>
              <span className="text-xs text-ink-muted">
                File: {primaryResume?.fileName || 'resume.pdf'} &bull; Hash: <span className="font-mono text-[11px]">{primaryResume?.fileHash?.slice(0, 16)}...</span>
              </span>
            </div>
          </div>

          <pre className="p-4 rounded-xl bg-[#F8F9F5] border border-border text-xs font-mono text-ink-light whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
            {primaryResume?.rawText || 'No raw text available.'}
          </pre>
        </div>
      )}

      {/* Tab 5: Recruiter Notes & Audit */}
      {activeTab === 'notes' && (
        <div className="surface-card rounded-2xl p-6 space-y-6">
          <h3 className="font-editorial text-lg font-semibold text-ink">
            Recruiter Notes & Interaction Log
          </h3>

          {/* Add note */}
          <form onSubmit={handleAddNote} className="space-y-3">
            <textarea
              rows={3}
              placeholder="Write an internal recruiter observation, interview feedback, or verification detail..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="w-full bg-[#FBFBF9] border border-border rounded-xl p-3 text-xs text-ink focus:outline-none focus:border-forest-500 focus:bg-white transition-all leading-relaxed"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submittingNote || !noteText.trim()}
                className="px-4 py-2 bg-forest-500 hover:bg-forest-600 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Save Note</span>
              </button>
            </div>
          </form>

          {/* Existing notes */}
          <div className="space-y-3 pt-3 border-t border-border">
            {(applications || []).flatMap((app) => app.notes || []).length === 0 ? (
              <p className="text-xs text-ink-subtle text-center py-4">No notes recorded yet.</p>
            ) : (
              (applications || []).flatMap((app) => app.notes || []).map((n, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-[#FBFBF9] border border-border text-xs">
                  <div className="flex items-center justify-between text-ink-subtle text-[10px] mb-1">
                    <span className="font-medium text-ink">Recruiter Note</span>
                    <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-ink leading-relaxed">{n.text}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Correction Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-dropdown border border-border max-w-md w-full p-6 space-y-4">
            <h3 className="font-editorial text-lg font-bold text-ink">
              Correct Extracted Candidate Data
            </h3>
            <p className="text-xs text-ink-muted">
              Manually fix OCR or parser errors. All corrections are logged to the compliance audit trail.
            </p>

            <form onSubmit={handleSaveCorrection} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-ink mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full bg-[#FBFBF9] border border-border rounded-lg px-3 py-1.5 text-xs text-ink"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink mb-1">Email</label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full bg-[#FBFBF9] border border-border rounded-lg px-3 py-1.5 text-xs text-ink"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink mb-1">Total Experience (Years)</label>
                <input
                  type="number"
                  min={0}
                  max={40}
                  value={editFormData.totalExperienceYears}
                  onChange={(e) => setEditFormData({ ...editFormData, totalExperienceYears: Number(e.target.value) })}
                  className="w-full bg-[#FBFBF9] border border-border rounded-lg px-3 py-1.5 text-xs text-ink font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink mb-1">Location</label>
                <input
                  type="text"
                  value={editFormData.location}
                  onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                  className="w-full bg-[#FBFBF9] border border-border rounded-lg px-3 py-1.5 text-xs text-ink"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-3.5 py-1.5 border border-border rounded-lg text-xs font-medium text-ink hover:bg-sage-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-forest-500 hover:bg-forest-600 text-white rounded-lg text-xs font-medium"
                >
                  Save Corrections
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Override Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-dropdown border border-border max-w-md w-full p-6 space-y-4">
            <h3 className="font-editorial text-lg font-bold text-ink">
              Recruiter Score Override
            </h3>
            <p className="text-xs text-ink-muted">
              Recruiters remain final decision-makers. Override the AI calculated score with an explicit justification reason.
            </p>

            <form onSubmit={handleApplyOverride} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-ink mb-1">
                  Adjusted Score: <span className="font-mono font-bold text-forest-700">{newScore}%</span>
                </label>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={newScore}
                  onChange={(e) => setNewScore(Number(e.target.value))}
                  className="w-full accent-forest-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink mb-1">
                  Reason for Override *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Candidate demonstrated verified equivalence in specialized microservices during portfolio review..."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full bg-[#FBFBF9] border border-border rounded-lg p-2.5 text-xs text-ink focus:outline-none focus:border-forest-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowOverrideModal(false)}
                  className="px-3.5 py-1.5 border border-border rounded-lg text-xs font-medium text-ink hover:bg-sage-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-forest-500 hover:bg-forest-600 text-white rounded-lg text-xs font-medium"
                >
                  Confirm Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
