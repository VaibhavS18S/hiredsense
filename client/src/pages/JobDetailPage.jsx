import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  MapPin,
  Clock,
  DollarSign,
  GraduationCap,
  Users,
  UploadCloud,
  Edit,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  ChevronRight,
  GitCompare,
} from 'lucide-react';
import { api } from '../api/client';
import { ScoreBadge } from '../components/common/ScoreBadge';

export const JobDetailPage = () => {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [screenedCandidates, setScreenedCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchJobDetail();
  }, [jobId]);

  const fetchJobDetail = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/jobs/${jobId}`);
      if (res.success) {
        setJob(res.data);
      }

      // Fetch candidates screened for this job
      const screenRes = await api.get(`/screening/job/${jobId}`);
      if (screenRes.success) {
        setScreenedCandidates(screenRes.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="py-16 text-center text-xs text-ink-muted">Loading job details...</div>;
  }

  if (!job) {
    return (
      <div className="surface-card rounded-2xl p-8 text-center">
        <p className="text-xs text-ink-muted">Job opening not found.</p>
        <Link to="/jobs" className="text-xs text-forest-600 font-medium mt-2 inline-block">
          &larr; Back to jobs
        </Link>
      </div>
    );
  }

  const analysis = job.readinessAnalysis || {};
  const isReady = (job.readinessScore || 0) >= 70;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Link to="/jobs" className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to all jobs</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/jobs/${jobId}/edit`)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border bg-white rounded-lg text-xs font-medium text-ink hover:bg-sage-50 transition-colors shadow-subtle"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit Role</span>
          </button>
          <Link
            to={`/screening/upload?jobId=${jobId}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-forest-500 hover:bg-forest-600 text-white rounded-lg text-xs font-medium shadow-sm transition-colors"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Screen Resumes for this Job</span>
          </Link>
        </div>
      </div>

      {/* Role Header */}
      <div className="surface-card rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-forest-700 bg-forest-50 px-2.5 py-0.5 rounded-full border border-forest-200">
                {job.department}
              </span>
              <span className="text-xs text-ink-subtle">&bull;</span>
              <span className="text-xs text-ink-muted capitalize font-medium">{job.type}</span>
            </div>

            <h1 className="font-editorial text-3xl font-bold text-ink">
              {job.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-ink-muted">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-ink-subtle" />
                {job.location}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-ink-subtle" />
                {job.minYearsExperience}+ years min experience
              </span>
              {job.salaryRange && (job.salaryRange.min > 0 || job.salaryRange.max > 0) && (
                <span className="flex items-center gap-1 font-mono text-ink">
                  <DollarSign className="w-3.5 h-3.5 text-forest-600" />
                  ${job.salaryRange.min?.toLocaleString()} - ${job.salaryRange.max?.toLocaleString()} {job.salaryRange.currency}
                </span>
              )}
            </div>
          </div>

          {/* Readiness Score Card */}
          <div className="p-4 rounded-xl bg-sage-50 border border-sage-200 min-w-[220px]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-ink">Job Readiness</span>
              <span className={`text-xs font-bold font-mono ${isReady ? 'text-forest-700' : 'text-amber-700'}`}>
                {job.readinessScore || 0}%
              </span>
            </div>
            <div className="w-full bg-[#D5E2D8] h-1.5 rounded-full overflow-hidden mb-2">
              <div
                className={`h-full rounded-full ${isReady ? 'bg-forest-500' : 'bg-amber-500'}`}
                style={{ width: `${job.readinessScore || 0}%` }}
              />
            </div>
            <span className="text-[11px] text-ink-muted block leading-tight">
              {isReady
                ? 'High clarity: Ready for accurate candidate screening.'
                : 'Attention needed: Missing key screening requirements.'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Details Left, Readiness Audit & Matched Candidates Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Requirements & Responsibilities */}
        <div className="lg:col-span-2 space-y-6">
          {/* Mandatory Skills */}
          <div className="surface-card rounded-2xl p-6">
            <h3 className="font-editorial text-lg font-semibold text-ink mb-1">
              Mandatory Skills & Experience
            </h3>
            <p className="text-xs text-ink-muted mb-4">
              Core competencies weighted 85% of candidate skill alignment score.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(job.mandatorySkills || []).map((skill) => (
                <div
                  key={skill.name}
                  className="p-3 rounded-xl bg-[#FBFBF9] border border-border flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-semibold text-ink block">{skill.name}</span>
                    <span className="text-[10px] text-ink-subtle">{skill.category || 'Core Skill'}</span>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-sage-100 text-forest-700 font-medium">
                    {skill.minYears}+ yrs req
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Preferred Skills */}
          <div className="surface-card rounded-2xl p-6">
            <h3 className="font-editorial text-lg font-semibold text-ink mb-1">
              Preferred Skills (Nice-to-Have)
            </h3>
            <p className="text-xs text-ink-muted mb-3">
              Bonus competencies that distinguish high-matching candidates.
            </p>

            <div className="flex flex-wrap gap-2">
              {(job.preferredSkills || []).map((skill) => (
                <span
                  key={skill.name}
                  className="text-xs px-3 py-1 rounded-lg bg-sage-50 text-ink border border-sage-200 font-medium"
                >
                  {skill.name}
                </span>
              ))}
            </div>
          </div>

          {/* Responsibilities */}
          <div className="surface-card rounded-2xl p-6">
            <h3 className="font-editorial text-lg font-semibold text-ink mb-3">
              Key Responsibilities
            </h3>
            <ul className="space-y-2 text-xs text-ink-muted leading-relaxed">
              {(job.responsibilities || []).map((resp, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-forest-600 shrink-0 mt-0.5" />
                  <span>{resp}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Column: Readiness Diagnostics & Candidate Pipeline */}
        <div className="space-y-6">
          {/* Readiness Analysis & Suggestions */}
          <div className="surface-card rounded-2xl p-6">
            <h3 className="font-editorial text-base font-semibold text-ink mb-3">
              AI Job Quality Diagnostics
            </h3>

            {analysis.vaguePhrases && analysis.vaguePhrases.length > 0 && (
              <div className="mb-4 p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-xs">
                <span className="font-semibold text-amber-900 block mb-1 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-700" /> Vague Terminology Detected
                </span>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Phrases like <span className="font-mono font-medium">{analysis.vaguePhrases.join(', ')}</span> can distort screening accuracy. Consider replacing them with explicit deliverables.
                </p>
              </div>
            )}

            {analysis.suggestions && analysis.suggestions.length > 0 && (
              <div className="space-y-2 text-xs text-ink-muted">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-ink block">
                  Recommendations:
                </span>
                {analysis.suggestions.map((s, idx) => (
                  <p key={idx} className="text-[11px] leading-relaxed text-ink-muted">
                    &bull; {s}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Screened Candidates for this role */}
          <div className="surface-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-editorial text-base font-semibold text-ink">
                Screened Candidates ({screenedCandidates.length})
              </h3>
              {screenedCandidates.length >= 2 && (
                <Link
                  to={`/compare?jobId=${jobId}`}
                  className="text-xs text-forest-600 hover:text-forest-700 font-medium flex items-center gap-1"
                >
                  <GitCompare className="w-3 h-3" /> Compare
                </Link>
              )}
            </div>

            {screenedCandidates.length === 0 ? (
              <div className="text-center py-6 text-xs text-ink-subtle">
                No candidates screened yet.
                <Link
                  to={`/screening/upload?jobId=${jobId}`}
                  className="block text-forest-600 font-medium mt-2"
                >
                  Upload resumes now &rarr;
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {screenedCandidates.map((res) => (
                  <Link
                    key={res._id}
                    to={`/candidates/${res.candidateId?._id}`}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-border hover:bg-sage-50/50 transition-colors group"
                  >
                    <div className="min-w-0 pr-2">
                      <span className="text-xs font-semibold text-ink group-hover:text-forest-700 truncate block">
                        {res.candidateId?.name}
                      </span>
                      <span className="text-[10px] text-ink-subtle truncate block">
                        {res.candidateId?.totalExperienceYears}y exp &bull; {res.matchedRequiredSkills?.length || 0} mandatory matched
                      </span>
                    </div>
                    <ScoreBadge score={res.overallScore} size="sm" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
