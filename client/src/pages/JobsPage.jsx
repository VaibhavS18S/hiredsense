import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Plus,
  Search,
  Users,
  Copy,
  Archive,
  Trash2,
  Edit,
  ArrowUpRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
} from 'lucide-react';
import { api } from '../api/client';

export const JobsPage = () => {
  const [jobs, setJobs] = useState([]);
  const [statusFilter, setStatusFilter] = useState('active');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchJobs();
  }, [statusFilter, search]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (statusFilter !== 'all') query.append('status', statusFilter);
      if (search) query.append('search', search);

      const res = await api.get(`/jobs?${query.toString()}`);
      if (res.success) {
        setJobs(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async (e, id) => {
    e.stopPropagation();
    try {
      const res = await api.post(`/jobs/${id}/duplicate`, {});
      if (res.success) {
        fetchJobs();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleArchive = async (e, id, currentStatus) => {
    e.stopPropagation();
    try {
      const newStatus = currentStatus === 'archived' ? 'active' : 'archived';
      await api.patch(`/jobs/${id}/status`, { status: newStatus });
      fetchJobs();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this job opening?')) {
      try {
        await api.delete(`/jobs/${id}`);
        fetchJobs();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-forest-700">
            Open Positions & Hiring Needs
          </span>
          <h1 className="font-editorial text-3xl font-bold text-ink mt-0.5">
            Job Description Intelligence
          </h1>
          <p className="text-xs text-ink-muted mt-1">
            Manage requirements, verify screening readiness, and track candidate volume.
          </p>
        </div>

        <Link
          to="/jobs/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-forest-500 hover:bg-forest-600 text-white rounded-lg text-xs font-medium shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Job</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-white border border-border p-1 rounded-lg text-xs shadow-subtle w-full sm:w-auto">
          {['active', 'draft', 'archived', 'all'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-md capitalize font-medium transition-colors ${
                statusFilter === st
                  ? 'bg-sage-100 text-forest-800'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-ink-subtle absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-ink focus:outline-none focus:border-forest-500 shadow-subtle"
          />
        </div>
      </div>

      {/* Jobs Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-ink-muted">Loading job openings...</div>
      ) : jobs.length === 0 ? (
        <div className="surface-card rounded-2xl p-12 text-center">
          <Briefcase className="w-10 h-10 text-ink-subtle mx-auto mb-3" />
          <h3 className="font-editorial text-lg font-semibold text-ink">No Job Openings Found</h3>
          <p className="text-xs text-ink-muted max-w-sm mx-auto mt-1 mb-5">
            Create a new structured job description with mandatory and preferred skills to start screening.
          </p>
          <Link
            to="/jobs/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-forest-500 hover:bg-forest-600 text-white rounded-lg text-xs font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Job</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {jobs.map((job) => {
            const readiness = job.readinessScore || 85;
            const isReady = readiness >= 70;

            return (
              <div
                key={job._id}
                onClick={() => navigate(`/jobs/${job._id}`)}
                className="surface-card rounded-2xl p-5 hover:border-forest-300 hover:shadow-card transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <span className="text-[11px] font-medium text-forest-700 uppercase tracking-wider">
                        {job.department}
                      </span>
                      <h3 className="font-editorial text-xl font-bold text-ink group-hover:text-forest-700 transition-colors">
                        {job.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[11px] font-mono px-2 py-0.5 rounded-full border ${
                          isReady
                            ? 'bg-forest-50 text-forest-700 border-forest-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                        title="Job Screening Readiness Score"
                      >
                        {readiness}% readiness
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-ink-muted line-clamp-2 mb-4 leading-relaxed">
                    {job.rawDescription || 'No description provided.'}
                  </p>

                  {/* Skills badges */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {(job.mandatorySkills || []).slice(0, 4).map((m) => (
                      <span
                        key={m.name}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-sage-50 text-ink border border-sage-200 font-medium"
                      >
                        {m.name}
                      </span>
                    ))}
                    {(job.mandatorySkills || []).length > 4 && (
                      <span className="text-[10px] text-ink-subtle self-center">
                        +{(job.mandatorySkills || []).length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-border flex items-center justify-between text-xs text-ink-muted">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1 font-medium text-ink">
                      <Users className="w-3.5 h-3.5 text-forest-600" />
                      {job.totalCandidates || 0} candidates
                    </span>
                    <span>
                      {job.shortlistedCandidates || 0} shortlisted
                    </span>
                  </div>

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => handleDuplicate(e, job._id)}
                      className="p-1.5 text-ink-subtle hover:text-ink hover:bg-sage-50 rounded-md transition-colors"
                      title="Duplicate Job"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => navigate(`/jobs/${job._id}/edit`)}
                      className="p-1.5 text-ink-subtle hover:text-ink hover:bg-sage-50 rounded-md transition-colors"
                      title="Edit Job"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleArchive(e, job._id, job.status)}
                      className="p-1.5 text-ink-subtle hover:text-ink hover:bg-sage-50 rounded-md transition-colors"
                      title={job.status === 'archived' ? 'Unarchive' : 'Archive'}
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, job._id)}
                      className="p-1.5 text-ink-subtle hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                      title="Delete Job"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
