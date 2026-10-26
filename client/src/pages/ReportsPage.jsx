import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Filter,
  Layers,
  Users,
  Briefcase,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { api } from '../api/client';
import { ScoreBadge } from '../components/common/ScoreBadge';

export const ReportsPage = () => {
  const [data, setData] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState('all');
  const [loading, setLoading] = useState(true);
  const [downloadingCSV, setDownloadingCSV] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    fetchReports();
  }, [selectedJob]);

  const fetchJobs = async () => {
    try {
      const res = await api.get('/jobs');
      if (res.success) setJobs(res.data || []);
    } catch (e) {}
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const query = selectedJob !== 'all' ? `?jobId=${selectedJob}` : '';
      const res = await api.get(`/reports/summary${query}`);
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    setDownloadingCSV(true);
    try {
      const query = selectedJob !== 'all' ? `?jobId=${selectedJob}` : '';
      const blob = await api.get(`/reports/export/csv${query}`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hiresense_rankings_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert('Failed to export CSV: ' + err.message);
    } finally {
      setDownloadingCSV(false);
    }
  };

  const funnelData = data?.funnelData || [];
  const skillDist = data?.skillDistribution || [];
  const rankings = data?.candidateRankings || [];
  const summaries = data?.jobSummaries || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-forest-700">
            Talent Acquisition Analytics
          </span>
          <h1 className="font-editorial text-3xl font-bold text-ink mt-0.5">
            Reports & Export Center
          </h1>
          <p className="text-xs text-ink-muted mt-1">
            Funnel drop-off analytics, candidate rankings, and authorized CSV data export.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedJob}
            onChange={(e) => setSelectedJob(e.target.value)}
            className="bg-white border border-border rounded-lg text-xs font-medium text-ink px-3 py-2 focus:outline-none focus:border-forest-500 shadow-subtle"
          >
            <option value="all">All Job Openings</option>
            {jobs.map((j) => (
              <option key={j._id} value={j._id}>
                {j.title}
              </option>
            ))}
          </select>

          <button
            onClick={handleExportCSV}
            disabled={downloadingCSV}
            className="inline-flex items-center gap-2 px-4 py-2 bg-forest-500 hover:bg-forest-600 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{downloadingCSV ? 'Generating...' : 'Export Rankings CSV'}</span>
          </button>
        </div>
      </div>

      {/* Charts Section: Funnel & Skills Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funnel Drop-off Bar Chart */}
        <div className="surface-card rounded-2xl p-6">
          <h3 className="font-editorial text-lg font-semibold text-ink mb-1">
            Recruitment Funnel Velocity
          </h3>
          <p className="text-xs text-ink-muted mb-4">
            Candidate distribution and conversion attrition from New intake to Hired.
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EAECE5" vertical={false} />
                <XAxis dataKey="stage" stroke="#8C92A0" fontSize={11} tickLine={false} />
                <YAxis stroke="#8C92A0" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    border: '1px solid #E2E4DE',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" fill="#176B52" radius={[4, 4, 0, 0]} name="Candidates" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Skills Pool Distribution */}
        <div className="surface-card rounded-2xl p-6">
          <h3 className="font-editorial text-lg font-semibold text-ink mb-1">
            Skills Frequency Distribution
          </h3>
          <p className="text-xs text-ink-muted mb-4">
            Top competencies available in the parsed talent candidate pool.
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={skillDist} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#EAECE5" horizontal={false} />
                <XAxis type="number" stroke="#8C92A0" fontSize={11} tickLine={false} allowDecimals={false} />
                <YAxis dataKey="skill" type="category" stroke="#8C92A0" fontSize={10} width={90} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    border: '1px solid #E2E4DE',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" fill="#90C7B4" radius={[0, 4, 4, 0]} name="Candidates" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Job Screening Summaries Table */}
      <div className="surface-card rounded-2xl p-6">
        <h3 className="font-editorial text-lg font-semibold text-ink mb-1">
          Role-Wise Screening Summaries
        </h3>
        <p className="text-xs text-ink-muted mb-4">
          Aggregate performance and average score benchmarks across open positions.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAFBF9] border-b border-border text-ink-muted uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Role Title</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Total Screened</th>
                <th className="py-3 px-4">Shortlisted</th>
                <th className="py-3 px-4">Hired</th>
                <th className="py-3 px-4">Avg Match Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-medium">
              {summaries.map((s) => (
                <tr key={s.jobId} className="hover:bg-sage-50/40 transition-colors">
                  <td className="py-3 px-4 font-bold text-ink">{s.title}</td>
                  <td className="py-3 px-4 text-ink-muted">{s.department}</td>
                  <td className="py-3 px-4 font-mono">{s.totalCandidates}</td>
                  <td className="py-3 px-4 font-mono text-forest-700">{s.shortlistedCandidates}</td>
                  <td className="py-3 px-4 font-mono font-bold text-forest-800">{s.hiredCandidates}</td>
                  <td className="py-3 px-4 font-mono">
                    <ScoreBadge score={s.avgMatchScore} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ranked Candidate Leaderboard */}
      <div className="surface-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-editorial text-lg font-semibold text-ink">
              Ranked Candidate Roster ({rankings.length})
            </h3>
            <p className="text-xs text-ink-muted">
              Top scoring candidate evaluations sorted strictly by evidence-backed scores.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAFBF9] border-b border-border text-ink-muted uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Candidate</th>
                <th className="py-3 px-4">Target Job</th>
                <th className="py-3 px-4">Overall Score</th>
                <th className="py-3 px-4">Skill Align</th>
                <th className="py-3 px-4">Semantic</th>
                <th className="py-3 px-4">Exp</th>
                <th className="py-3 px-4 text-right">Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rankings.map((r, idx) => (
                <tr key={r._id} className="hover:bg-sage-50/40 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-ink-muted">
                    #{idx + 1}
                  </td>
                  <td className="py-3 px-4">
                    <Link
                      to={`/candidates/${r.candidateId?._id}`}
                      className="font-bold text-ink hover:text-forest-700"
                    >
                      {r.candidateId?.name}
                    </Link>
                    <span className="text-[10px] text-ink-subtle block">
                      {r.candidateId?.email}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-ink-muted">{r.jobId?.title}</td>
                  <td className="py-3 px-4">
                    <ScoreBadge score={r.overallScore} size="sm" />
                  </td>
                  <td className="py-3 px-4 font-mono">{r.componentScores?.skillAlignment}%</td>
                  <td className="py-3 px-4 font-mono">{r.componentScores?.semanticSimilarity}%</td>
                  <td className="py-3 px-4 font-mono">{r.candidateId?.totalExperienceYears}y</td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      to={`/candidates/${r.candidateId?._id}`}
                      className="text-forest-600 hover:text-forest-800 font-semibold"
                    >
                      Review &rarr;
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
