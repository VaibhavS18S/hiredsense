import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  GitCompare,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Briefcase,
  GraduationCap,
  Sparkles,
  ArrowLeft,
  ChevronDown,
  Layers,
} from 'lucide-react';
import { api } from '../api/client';
import { ScoreBadge } from '../components/common/ScoreBadge';

export const ComparisonPage = () => {
  const [searchParams] = useSearchParams();
  const initialJobId = searchParams.get('jobId') || '';
  const initialCandIds = (searchParams.get('candidates') || '').split(',').filter(Boolean);

  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(initialJobId);
  const [availableCandidates, setAvailableCandidates] = useState([]);
  const [selectedCandidates, setSelectedCandidates] = useState(initialCandIds);
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    if (selectedJob) {
      fetchJobCandidates(selectedJob);
    }
  }, [selectedJob]);

  useEffect(() => {
    if (selectedJob && selectedCandidates.length >= 2) {
      runComparison();
    }
  }, [selectedJob, selectedCandidates]);

  const fetchJobs = async () => {
    try {
      const res = await api.get('/jobs');
      if (res.success && res.data.length > 0) {
        setJobs(res.data);
        if (!selectedJob) setSelectedJob(res.data[0]._id);
      }
    } catch (e) {}
  };

  const fetchJobCandidates = async (jId) => {
    try {
      const res = await api.get(`/screening/job/${jId}`);
      if (res.success) {
        const cands = (res.data || []).map((r) => r.candidateId).filter(Boolean);
        setAvailableCandidates(cands);

        // If none selected, default select top 2
        if (selectedCandidates.length < 2 && cands.length >= 2) {
          setSelectedCandidates([cands[0]._id, cands[1]._id]);
        }
      }
    } catch (e) {}
  };

  const runComparison = async () => {
    setLoading(true);
    try {
      const res = await api.post('/screening/compare', {
        jobId: selectedJob,
        candidateIds: selectedCandidates.slice(0, 4),
      });
      if (res.success) {
        setComparisonData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleCandidate = (id) => {
    setSelectedCandidates((prev) => {
      if (prev.includes(id)) {
        if (prev.length <= 2) {
          alert('Comparison requires at least 2 candidates.');
          return prev;
        }
        return prev.filter((c) => c !== id);
      } else {
        if (prev.length >= 4) {
          alert('Maximum of 4 candidates can be compared simultaneously.');
          return prev;
        }
        return [...prev, id];
      }
    });
  };

  const job = comparisonData?.job;
  const cards = comparisonData?.candidates || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-forest-700">
            Side-by-Side Candidate Intelligence
          </span>
          <h1 className="font-editorial text-3xl font-bold text-ink mt-0.5">
            Candidate Comparison Studio
          </h1>
          <p className="text-xs text-ink-muted mt-1">
            Evaluate skill coverage matrices, experience depth, and verified evidence across 2 to 4 candidates.
          </p>
        </div>

        {/* Job selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-ink">Role Context:</label>
          <select
            value={selectedJob}
            onChange={(e) => {
              setSelectedJob(e.target.value);
              setSelectedCandidates([]);
            }}
            className="bg-white border border-border rounded-lg text-xs font-medium text-ink px-3 py-1.5 focus:outline-none focus:border-forest-500 shadow-subtle min-w-[220px]"
          >
            {jobs.map((j) => (
              <option key={j._id} value={j._id}>
                {j.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Candidate Picker Bar */}
      <div className="surface-card rounded-2xl p-4">
        <span className="text-xs font-semibold text-ink block mb-2">
          Select candidates to compare (2 to 4):
        </span>
        <div className="flex flex-wrap gap-2">
          {availableCandidates.map((cand) => {
            const isSelected = selectedCandidates.includes(cand._id);
            return (
              <button
                key={cand._id}
                onClick={() => toggleCandidate(cand._id)}
                className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                  isSelected
                    ? 'bg-forest-50 border-forest-500 text-forest-800 ring-1 ring-forest-500 shadow-sm'
                    : 'bg-white border-border text-ink-muted hover:border-forest-300'
                }`}
              >
                {isSelected ? '✓ ' : '+ '}
                {cand.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Comparison Matrix Table */}
      {loading ? (
        <div className="py-16 text-center text-xs text-ink-muted">Running comparative analysis...</div>
      ) : !comparisonData || cards.length < 2 ? (
        <div className="surface-card rounded-2xl p-12 text-center text-xs text-ink-muted">
          Please select at least 2 candidates to generate the comparison matrix.
        </div>
      ) : (
        <div className="surface-card rounded-2xl overflow-hidden border border-border shadow-subtle">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FAFBF9] border-b border-border">
                  <th className="py-4 px-5 w-48 text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
                    Criteria Matrix
                  </th>
                  {cards.map((c, i) => (
                    <th key={i} className="py-4 px-5 min-w-[240px] border-l border-border align-top">
                      <div className="flex items-center justify-between mb-1">
                        <Link
                          to={`/candidates/${c.candidate?._id}`}
                          className="font-editorial text-base font-bold text-ink hover:text-forest-700"
                        >
                          {c.candidate?.name}
                        </Link>
                        <ScoreBadge score={c.screening?.overallScore} size="sm" />
                      </div>
                      <span className="text-[11px] text-ink-subtle block">
                        {c.candidate?.location || 'Remote'}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {/* 1. Overall Match Score */}
                <tr className="bg-sage-50/40">
                  <td className="py-3 px-5 font-semibold text-ink text-[11px]">
                    Overall AI Match
                  </td>
                  {cards.map((c, i) => (
                    <td key={i} className="py-3 px-5 border-l border-border">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-bold text-ink">
                          {c.screening?.overallScore}%
                        </span>
                        <span className="text-[10px] text-ink-muted">weighted score</span>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* 2. Component breakdown */}
                <tr>
                  <td className="py-3 px-5 font-semibold text-ink text-[11px]">
                    Component Scores
                  </td>
                  {cards.map((c, i) => {
                    const sc = c.screening?.componentScores || {};
                    return (
                      <td key={i} className="py-3 px-5 border-l border-border">
                        <div className="space-y-1 text-[11px] font-mono">
                          <div className="flex justify-between">
                            <span className="text-ink-subtle">Skills (40%):</span>
                            <span className="font-semibold text-ink">{sc.skillAlignment || 0}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-ink-subtle">Semantic (30%):</span>
                            <span className="font-semibold text-ink">{sc.semanticSimilarity || 0}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-ink-subtle">Exp (20%):</span>
                            <span className="font-semibold text-ink">{sc.experienceScore || 0}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-ink-subtle">Qual (10%):</span>
                            <span className="font-semibold text-ink">{sc.qualificationScore || 0}%</span>
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>

                {/* 3. Mandatory Skills Matrix */}
                <tr className="bg-[#FAFBF9]">
                  <td colSpan={cards.length + 1} className="py-2.5 px-5 font-semibold uppercase tracking-wider text-[10px] text-forest-800">
                    Mandatory Skill Coverage Checklist
                  </td>
                </tr>

                {(job?.mandatorySkills || []).map((mSkill) => (
                  <tr key={mSkill.name}>
                    <td className="py-2.5 px-5 font-medium text-ink text-[11px]">
                      {mSkill.name}
                      <span className="text-[10px] text-ink-subtle block">
                        Min {mSkill.minYears} yrs
                      </span>
                    </td>
                    {cards.map((c, i) => {
                      const matched = (c.screening?.matchedRequiredSkills || []).find(
                        (s) => s.skill.toLowerCase() === mSkill.name.toLowerCase()
                      );

                      return (
                        <td key={i} className="py-2.5 px-5 border-l border-border">
                          {matched ? (
                            <div className="flex items-start gap-1.5 text-forest-800">
                              <CheckCircle2 className="w-4 h-4 text-forest-600 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-semibold text-[11px]">Matched</span>
                                <span className="text-[10px] text-ink-muted italic block line-clamp-1">
                                  "{matched.evidence}"
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-amber-800">
                              <XCircle className="w-4 h-4 text-amber-600 shrink-0" />
                              <span className="font-semibold text-[11px]">Missing</span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {/* 4. Total Experience */}
                <tr>
                  <td className="py-3 px-5 font-semibold text-ink text-[11px]">
                    Total Relevant Experience
                  </td>
                  {cards.map((c, i) => (
                    <td key={i} className="py-3 px-5 border-l border-border font-mono">
                      <span className="font-bold text-ink">
                        {c.candidate?.totalExperienceYears || 0} Years
                      </span>
                      <span className="text-[10px] text-ink-muted block font-sans">
                        (Job requires {job?.minYearsExperience}y)
                      </span>
                    </td>
                  ))}
                </tr>

                {/* 5. Highest Education */}
                <tr>
                  <td className="py-3 px-5 font-semibold text-ink text-[11px]">
                    Education & Credentials
                  </td>
                  {cards.map((c, i) => {
                    const highestEdu = (c.candidate?.education || [])[0];
                    return (
                      <td key={i} className="py-3 px-5 border-l border-border">
                        <span className="font-semibold text-ink block text-[11px]">
                          {highestEdu?.degree || "Bachelor's Degree"}
                        </span>
                        <span className="text-[10px] text-ink-muted">
                          {highestEdu?.institution || 'Accredited University'}
                        </span>
                      </td>
                    );
                  })}
                </tr>

                {/* 6. Missing Requirements Overview */}
                <tr className="bg-amber-50/20">
                  <td className="py-3 px-5 font-semibold text-amber-900 text-[11px]">
                    Identified Gaps
                  </td>
                  {cards.map((c, i) => {
                    const missing = c.screening?.missingRequiredSkills || [];
                    return (
                      <td key={i} className="py-3 px-5 border-l border-border text-xs">
                        {missing.length === 0 ? (
                          <span className="text-[11px] text-forest-700 font-medium">None detected</span>
                        ) : (
                          <span className="text-[11px] text-amber-800 font-medium">
                            Lacks {missing.join(', ')}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
