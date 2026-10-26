import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileCheck2,
  Filter,
  Search,
  UploadCloud,
  ChevronRight,
  GitCompare,
  ArrowUpRight,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { api } from '../api/client';
import { ScoreBadge } from '../components/common/ScoreBadge';

export const ScreeningPage = () => {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState('all');
  const [minScore, setMinScore] = useState(0);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidatesForCompare, setSelectedCandidatesForCompare] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    fetchScreeningResults();
  }, [selectedJob, minScore]);

  const fetchJobs = async () => {
    try {
      const res = await api.get('/jobs');
      if (res.success && res.data.length > 0) {
        setJobs(res.data);
      }
    } catch (e) {}
  };

  const fetchScreeningResults = async () => {
    setLoading(true);
    try {
      let endpoint = '/screening/job/';
      if (selectedJob && selectedJob !== 'all') {
        endpoint += `${selectedJob}?minScore=${minScore}`;
      } else if (jobs.length > 0) {
        endpoint += `${jobs[0]._id}?minScore=${minScore}`;
      } else {
        setResults([]);
        setLoading(false);
        return;
      }

      const res = await api.get(endpoint);
      if (res.success) {
        setResults(res.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectForCompare = (candId) => {
    setSelectedCandidatesForCompare((prev) => {
      if (prev.includes(candId)) {
        return prev.filter((id) => id !== candId);
      } else {
        if (prev.length >= 4) {
          alert('You can compare a maximum of 4 candidates side-by-side.');
          return prev;
        }
        return [...prev, candId];
      }
    });
  };

  const activeJobId = selectedJob !== 'all' ? selectedJob : (jobs[0]?._id || '');

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-forest-700">
            Automated Evaluation Pipeline
          </span>
          <h1 className="font-editorial text-3xl font-bold text-ink mt-0.5">
            Candidate Screening Hub
          </h1>
          <p className="text-xs text-ink-muted mt-1">
            Component-level scoring, evidence verification, and candidate side-by-side evaluation.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {selectedCandidatesForCompare.length >= 2 && (
            <Link
              to={`/compare?jobId=${activeJobId}&candidates=${selectedCandidatesForCompare.join(',')}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-sage-100 hover:bg-sage-200 border border-sage-300 rounded-lg text-xs font-semibold text-forest-800 transition-colors"
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>Compare Selected ({selectedCandidatesForCompare.length})</span>
            </Link>
          )}

          <Link
            to="/screening/upload"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-forest-500 hover:bg-forest-600 text-white rounded-lg text-xs font-medium shadow-sm transition-colors"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload New Resumes</span>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="surface-card rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Job selector */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-ink shrink-0">Select Job Opening:</label>
          <select
            value={selectedJob}
            onChange={(e) => setSelectedJob(e.target.value)}
            className="bg-[#FBFBF9] border border-border rounded-lg text-xs font-medium text-ink px-3 py-1.5 focus:outline-none focus:border-forest-500 min-w-[240px]"
          >
            {jobs.map((j) => (
              <option key={j._id} value={j._id}>
                {j.title} ({j.department})
              </option>
            ))}
          </select>
        </div>

        {/* Min Score Slider */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-ink-muted">Min Match Score:</label>
          <input
            type="range"
            min={0}
            max={90}
            step={5}
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="w-28 accent-forest-500 cursor-pointer"
          />
          <span className="font-mono text-xs font-bold text-forest-700 min-w-[32px]">
            &ge;{minScore}%
          </span>
        </div>
      </div>

      {/* Screening Table */}
      <div className="surface-card rounded-2xl overflow-hidden border border-border shadow-subtle">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAFBF9] border-b border-border text-ink-muted uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4 w-10">Compare</th>
                <th className="py-3.5 px-4">Candidate</th>
                <th className="py-3.5 px-4">Overall Match</th>
                <th className="py-3.5 px-4">Skill Align (40%)</th>
                <th className="py-3.5 px-4">Semantic Sim (30%)</th>
                <th className="py-3.5 px-4">Experience (20%)</th>
                <th className="py-3.5 px-4">Qual (10%)</th>
                <th className="py-3.5 px-4">Missing Mandatory</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-ink-muted text-xs">
                    Loading screening evaluations...
                  </td>
                </tr>
              ) : results.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-ink-muted text-xs">
                    No candidates found matching the score criteria.
                  </td>
                </tr>
              ) : (
                results.map((res) => {
                  const cand = res.candidateId || {};
                  const isChecked = selectedCandidatesForCompare.includes(cand._id);
                  const scores = res.componentScores || {};

                  return (
                    <tr
                      key={res._id}
                      className={`hover:bg-sage-50/50 transition-colors ${
                        isChecked ? 'bg-sage-50/80' : ''
                      }`}
                    >
                      {/* Compare Checkbox */}
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectForCompare(cand._id)}
                          className="rounded text-forest-600 focus:ring-forest-500 cursor-pointer"
                        />
                      </td>

                      {/* Candidate Name & Info */}
                      <td className="py-3 px-4">
                        <Link
                          to={`/candidates/${cand._id}`}
                          className="font-semibold text-ink hover:text-forest-700 block transition-colors"
                        >
                          {cand.name}
                        </Link>
                        <span className="text-[11px] text-ink-subtle block">
                          {cand.email} &bull; {cand.totalExperienceYears}y exp
                        </span>
                      </td>

                      {/* Overall Match */}
                      <td className="py-3 px-4">
                        <ScoreBadge score={res.overallScore} showLabel={false} />
                      </td>

                      {/* Skill Alignment */}
                      <td className="py-3 px-4 font-mono font-medium text-ink">
                        {scores.skillAlignment}%
                      </td>

                      {/* Semantic Similarity */}
                      <td className="py-3 px-4 font-mono font-medium text-ink">
                        {scores.semanticSimilarity}%
                      </td>

                      {/* Experience */}
                      <td className="py-3 px-4 font-mono font-medium text-ink">
                        {scores.experienceScore}%
                      </td>

                      {/* Qualification */}
                      <td className="py-3 px-4 font-mono font-medium text-ink">
                        {scores.qualificationScore}%
                      </td>

                      {/* Missing Mandatory Skills */}
                      <td className="py-3 px-4">
                        {(res.missingRequiredSkills || []).length === 0 ? (
                          <span className="text-[11px] text-forest-700 font-medium">None (100% Match)</span>
                        ) : (
                          <span className="text-[11px] text-amber-700 font-medium line-clamp-1">
                            {res.missingRequiredSkills.join(', ')}
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/candidates/${cand._id}`}
                          className="text-xs text-forest-600 hover:text-forest-800 font-semibold"
                        >
                          Review &rarr;
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
