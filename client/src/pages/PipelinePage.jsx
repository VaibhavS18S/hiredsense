import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  KanbanSquare,
  Users,
  Search,
  Filter,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Plus,
  Briefcase,
  User,
  Clock,
  Sparkles,
} from 'lucide-react';
import { api } from '../api/client';
import { ScoreBadge } from '../components/common/ScoreBadge';

export const PipelinePage = () => {
  const [searchParams] = useSearchParams();
  const initialJobId = searchParams.get('jobId') || 'all';

  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(initialJobId);
  const [pipelineData, setPipelineData] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Bulk Selection
  const [selectedApps, setSelectedApps] = useState([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkTargetStage, setBulkTargetStage] = useState('Shortlisted');

  // Last Moved Application for Undo
  const [lastMovedAppId, setLastMovedAppId] = useState(null);

  const STAGES = ['New', 'Screening', 'Shortlisted', 'Interview', 'Offer', 'Hired', 'Rejected'];

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    fetchPipeline();
  }, [selectedJob, search]);

  const fetchJobs = async () => {
    try {
      const res = await api.get('/jobs');
      if (res.success) setJobs(res.data || []);
    } catch (e) {}
  };

  const fetchPipeline = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (selectedJob !== 'all') query.append('jobId', selectedJob);
      if (search) query.append('search', search);

      const res = await api.get(`/pipeline?${query.toString()}`);
      if (res.success) {
        setPipelineData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMoveStage = async (appId, targetStage) => {
    try {
      const res = await api.patch(`/pipeline/${appId}/stage`, { stage: targetStage });
      if (res.success) {
        setLastMovedAppId(appId);
        fetchPipeline();
      }
    } catch (err) {
      alert(err.message || 'Failed to move candidate stage');
    }
  };

  const handleUndo = async () => {
    if (!lastMovedAppId) return;
    try {
      const res = await api.post(`/pipeline/${lastMovedAppId}/undo`, {});
      if (res.success) {
        setLastMovedAppId(null);
        fetchPipeline();
      }
    } catch (err) {
      alert(err.message || 'Undo failed');
    }
  };

  const handleBulkAction = async () => {
    if (selectedApps.length === 0) return;
    try {
      const res = await api.post('/pipeline/bulk-stage', {
        applicationIds: selectedApps,
        targetStage: bulkTargetStage,
      });
      if (res.success) {
        setSelectedApps([]);
        setShowBulkModal(false);
        fetchPipeline();
      }
    } catch (err) {
      alert(err.message || 'Bulk update failed');
    }
  };

  const toggleSelectApp = (appId) => {
    setSelectedApps((prev) =>
      prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId]
    );
  };

  const columns = pipelineData?.columns || {};

  return (
    <div className="space-y-6 max-w-full mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-forest-700">
            Candidate Pipeline Management
          </span>
          <h1 className="font-editorial text-3xl font-bold text-ink mt-0.5">
            Recruitment Kanban Board
          </h1>
          <p className="text-xs text-ink-muted mt-1">
            Track candidates across stages, reassign recruiter ownership, and execute bulk actions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {lastMovedAppId && (
            <button
              onClick={handleUndo}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-xs font-semibold hover:bg-amber-100 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Undo Last Move</span>
            </button>
          )}

          {selectedApps.length > 0 && (
            <button
              onClick={() => setShowBulkModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-forest-500 text-white rounded-lg text-xs font-medium shadow-sm hover:bg-forest-600 transition-colors"
            >
              <span>Bulk Action ({selectedApps.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="surface-card rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-ink shrink-0">Filter by Job Opening:</label>
          <select
            value={selectedJob}
            onChange={(e) => setSelectedJob(e.target.value)}
            className="bg-[#FBFBF9] border border-border rounded-lg text-xs font-medium text-ink px-3 py-1.5 focus:outline-none focus:border-forest-500 min-w-[240px]"
          >
            <option value="all">All Jobs ({jobs.length})</option>
            {jobs.map((j) => (
              <option key={j._id} value={j._id}>
                {j.title}
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-ink-subtle absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search candidate name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#FBFBF9] border border-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-ink focus:outline-none focus:border-forest-500"
          />
        </div>
      </div>

      {/* 7-Stage Horizontal Scrollable Kanban Columns */}
      <div className="flex gap-4 overflow-x-auto pb-6 pt-1 min-h-[550px]">
        {STAGES.map((stageName) => {
          const col = columns[stageName] || { count: 0, candidates: [] };

          return (
            <div
              key={stageName}
              className="w-72 shrink-0 flex flex-col rounded-2xl bg-[#F8F9F6] border border-border overflow-hidden"
            >
              {/* Column Header */}
              <div className="p-3.5 border-b border-border flex items-center justify-between bg-white">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs text-ink">{stageName}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sage-100 text-forest-700 font-bold border border-sage-200">
                    {col.count}
                  </span>
                </div>
              </div>

              {/* Candidates Column Body */}
              <div className="p-2.5 flex-1 space-y-2.5 overflow-y-auto max-h-[600px]">
                {col.candidates.length === 0 ? (
                  <div className="text-center py-10 text-[11px] text-ink-subtle italic">
                    No candidates in {stageName}
                  </div>
                ) : (
                  col.candidates.map((card) => {
                    const isChecked = selectedApps.includes(card._id);

                    return (
                      <div
                        key={card._id}
                        className={`surface-card rounded-xl p-3 border transition-all hover:border-forest-300 hover:shadow-card group relative ${
                          isChecked ? 'ring-2 ring-forest-500 bg-forest-50/20' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleSelectApp(card._id)}
                              className="rounded text-forest-600 focus:ring-forest-500 cursor-pointer shrink-0"
                            />
                            <Link
                              to={`/candidates/${card.candidate?._id}`}
                              className="font-bold text-xs text-ink hover:text-forest-700 truncate"
                            >
                              {card.candidate?.name}
                            </Link>
                          </div>
                          <ScoreBadge score={card.score} size="sm" />
                        </div>

                        <span className="text-[10px] text-ink-muted block truncate mb-2">
                          {card.job?.title} &bull; {card.candidate?.totalExperienceYears}y exp
                        </span>

                        {/* Top 2 skills */}
                        <div className="flex flex-wrap gap-1 mb-2.5">
                          {(card.candidate?.skills || []).slice(0, 2).map((s) => (
                            <span
                              key={s.name}
                              className="text-[9px] px-1.5 py-0.2 rounded bg-sage-50 text-ink border border-sage-200"
                            >
                              {s.name}
                            </span>
                          ))}
                        </div>

                        {/* Stage Progression Selector */}
                        <div className="pt-2 border-t border-border flex items-center justify-between text-[11px]">
                          <span className="text-[10px] text-ink-subtle">Move to:</span>
                          <select
                            value={card.stage}
                            onChange={(e) => handleMoveStage(card._id, e.target.value)}
                            className="bg-[#FBFBF9] border border-border rounded text-[10px] px-1.5 py-0.5 text-ink font-medium focus:outline-none focus:border-forest-500 cursor-pointer"
                          >
                            {STAGES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bulk Action Confirmation Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-dropdown border border-border max-w-sm w-full p-6 space-y-4">
            <h3 className="font-editorial text-lg font-bold text-ink">
              Bulk Move Candidates
            </h3>
            <p className="text-xs text-ink-muted">
              Move {selectedApps.length} selected candidate(s) simultaneously to a target stage.
            </p>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">Target Stage</label>
              <select
                value={bulkTargetStage}
                onChange={(e) => setBulkTargetStage(e.target.value)}
                className="w-full bg-[#FBFBF9] border border-border rounded-lg px-3 py-2 text-xs text-ink font-medium"
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="px-3.5 py-1.5 border border-border rounded-lg text-xs font-medium text-ink hover:bg-sage-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkAction}
                className="px-4 py-1.5 bg-forest-500 hover:bg-forest-600 text-white rounded-lg text-xs font-medium shadow-sm"
              >
                Confirm Move
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
