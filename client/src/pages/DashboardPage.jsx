import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Users,
  Clock,
  CheckCircle,
  TrendingUp,
  Filter,
  ArrowUpRight,
  Sparkles,
  Layers,
  ChevronRight,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { api } from '../api/client';
import { StatCard } from '../components/common/StatCard';
import { ScoreBadge } from '../components/common/ScoreBadge';

export const DashboardPage = () => {
  const [data, setData] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState('all');
  const [dateRange, setDateRange] = useState('30d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [selectedJob, dateRange]);

  const fetchJobs = async () => {
    try {
      const res = await api.get('/jobs');
      if (res.success) setJobs(res.data || []);
    } catch (e) {}
  };

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (selectedJob !== 'all') query.append('jobId', selectedJob);
      if (dateRange !== 'all') query.append('dateRange', dateRange);

      const res = await api.get(`/dashboard?${query.toString()}`);
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const summary = data?.summary || {};

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-border">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-forest-700">
            Talent Acquisition Intelligence
          </span>
          <h1 className="font-editorial text-3xl font-bold text-ink mt-0.5">
            Recruitment Executive Dashboard
          </h1>
          <p className="text-xs text-ink-muted mt-1">
            Real-time candidate metrics, screening velocity, and match quality.
          </p>
        </div>

        {/* Global Filters */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Job Filter */}
          <div className="relative">
            <select
              value={selectedJob}
              onChange={(e) => setSelectedJob(e.target.value)}
              className="bg-white border border-border rounded-lg text-xs font-medium text-ink px-3 py-1.5 focus:outline-none focus:border-forest-500 shadow-subtle"
            >
              <option value="all">All Job Openings ({jobs.length})</option>
              {jobs.map((j) => (
                <option key={j._id} value={j._id}>
                  {j.title}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Selector */}
          <div className="flex items-center bg-white border border-border rounded-lg p-0.5 shadow-subtle text-xs">
            {['7d', '30d', '90d', 'all'].map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-2.5 py-1 rounded-md capitalize font-medium transition-colors ${
                  dateRange === range
                    ? 'bg-sage-100 text-forest-800'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                {range === 'all' ? 'All Time' : range}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 5 Core Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Active Openings"
          value={summary.activeJobsCount || 0}
          subtext={`Across ${summary.totalJobsCount || 0} total jobs`}
          icon={Briefcase}
        />
        <StatCard
          title="Candidates Screened"
          value={summary.totalCandidatesProcessed || 0}
          subtext="Processed in pipeline"
          icon={Users}
        />
        <StatCard
          title="Awaiting Review"
          value={summary.awaitingReviewCount || 0}
          subtext="Action needed"
          badge={summary.awaitingReviewCount > 0 ? 'Pending' : 'Cleared'}
          icon={Clock}
        />
        <StatCard
          title="Shortlist Rate"
          value={`${summary.shortlistConversionRate || 0}%`}
          trend="+4.2%"
          trendPositive={true}
          subtext="Conversion to review"
          icon={CheckCircle}
        />
        <StatCard
          title="Avg Time to Shortlist"
          value={`${summary.avgTimeToShortlistDays || 0}d`}
          subtext="From resume ingestion"
          trend="-0.8d"
          trendPositive={true}
          icon={TrendingUp}
        />
      </div>

      {/* Charts Section: Screening Activity & Pipeline Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Screening Activity Over Time (2 cols) */}
        <div className="lg:col-span-2 surface-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-editorial text-lg font-semibold text-ink">
                Screening Velocity & High Matches
              </h3>
              <p className="text-xs text-ink-muted">
                Daily candidate evaluations and scores reaching shortlist threshold (&ge;75%)
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-forest-700">
                <span className="w-2.5 h-2.5 rounded-full bg-forest-500" /> Total Screened
              </span>
              <span className="flex items-center gap-1.5 text-ink-muted">
                <span className="w-2.5 h-2.5 rounded-full bg-sage-300" /> High Matches
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.screeningActivity || []}>
                <defs>
                  <linearGradient id="forestGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#176B52" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#176B52" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#EAECE5" vertical={false} />
                <XAxis dataKey="date" stroke="#8C92A0" fontSize={11} tickLine={false} />
                <YAxis stroke="#8C92A0" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    border: '1px solid #E2E4DE',
                    fontSize: '12px',
                    boxShadow: '0 4px 12px rgba(23,26,33,0.06)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="screened"
                  stroke="#176B52"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#forestGrad)"
                  name="Screened"
                />
                <Area
                  type="monotone"
                  dataKey="highMatches"
                  stroke="#9EBDB5"
                  strokeWidth={2}
                  fillOpacity={0.5}
                  fill="#E8F0EA"
                  name="High Matches"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pipeline Stage Distribution (1 col) */}
        <div className="surface-card rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-editorial text-lg font-semibold text-ink">
                Pipeline Stages
              </h3>
              <Link to="/pipeline" className="text-xs text-forest-600 hover:text-forest-700 font-medium">
                View Kanban &rarr;
              </Link>
            </div>
            <p className="text-xs text-ink-muted mb-4">
              Active talent distribution across recruitment phases
            </p>

            <div className="space-y-2.5">
              {(data?.pipelineData || []).map((p) => {
                const total = summary.totalCandidatesProcessed || 1;
                const pct = Math.round((p.count / total) * 100);
                return (
                  <div key={p.stage} className="text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-ink">{p.stage}</span>
                      <span className="font-mono text-ink-muted">
                        {p.count} <span className="text-[10px] text-ink-subtle">({pct}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-[#EFEFEA] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-forest-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(4, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-border flex items-center justify-between text-xs text-ink-muted">
            <span>Offers & Hires to Date</span>
            <span className="font-semibold text-forest-700 font-mono">
              {summary.hiredCount || 0} Hired
            </span>
          </div>
        </div>
      </div>

      {/* Lower Row: Top Matches, Skill Distribution & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Matching Candidates Across Jobs */}
        <div className="surface-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-editorial text-lg font-semibold text-ink">
              Top Match Candidates
            </h3>
            <Link to="/candidates" className="text-xs text-forest-600 hover:text-forest-700 font-medium">
              All Candidates &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {(data?.topMatches || []).length === 0 ? (
              <p className="text-xs text-ink-subtle py-8 text-center">No screened candidates yet.</p>
            ) : (
              (data?.topMatches || []).map((match) => (
                <Link
                  key={match._id}
                  to={`/candidates/${match.candidateId?._id}`}
                  className="flex items-center justify-between p-3 rounded-xl border border-border hover:border-forest-300 hover:bg-sage-50/50 transition-all group"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-ink truncate group-hover:text-forest-700">
                        {match.candidateId?.name}
                      </span>
                    </div>
                    <span className="text-[11px] text-ink-muted truncate block">
                      {match.jobId?.title} &bull; {match.candidateId?.totalExperienceYears}y exp
                    </span>
                  </div>
                  <ScoreBadge score={match.overallScore} size="sm" />
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Skill Availability & Gap Insights */}
        <div className="surface-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-editorial text-lg font-semibold text-ink">
              Skill Pool Insights
            </h3>
            <Link to="/reports" className="text-xs text-forest-600 hover:text-forest-700 font-medium">
              Skill Distribution &rarr;
            </Link>
          </div>

          <p className="text-xs text-ink-muted mb-3">
            Most frequent technical competencies detected across screened talent.
          </p>

          <div className="flex flex-wrap gap-2">
            {(data?.topSkillsInPool || []).map((sk) => (
              <div
                key={sk.name}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sage-50 border border-sage-200 text-xs text-ink"
              >
                <span className="font-medium text-forest-800">{sk.name}</span>
                <span className="text-[10px] bg-white text-ink-muted px-1.5 py-0.2 rounded font-mono border border-sage-200">
                  {sk.candidateCount}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-border">
            <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl text-xs text-amber-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Skill Gap Observation</span>
                <span className="text-[11px] text-amber-800/90 leading-relaxed">
                  Kubernetes and PostgreSQL show higher candidate deficiency across open engineering roles. Consider adjusting preferred vs mandatory weighting.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Audit & Recruitment Activity */}
        <div className="surface-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-editorial text-lg font-semibold text-ink">
              Activity Audit Trail
            </h3>
            <Link to="/settings/profile" className="text-xs text-forest-600 hover:text-forest-700 font-medium">
              Audit Logs &rarr;
            </Link>
          </div>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {(data?.recentActivities || []).map((act) => (
              <div key={act._id} className="text-xs border-b border-border/60 pb-2.5 last:border-0">
                <div className="flex items-center justify-between text-ink-subtle text-[10px] mb-0.5">
                  <span className="font-medium text-ink">{act.user?.name || 'System'}</span>
                  <span>{new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="font-medium text-ink text-[11px]">
                  {act.action.replace(/_/g, ' ')}
                </div>
                {act.details && (
                  <span className="text-[10px] text-ink-muted truncate block">
                    {JSON.stringify(act.details).replace(/[{}"]/g, ' ')}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
