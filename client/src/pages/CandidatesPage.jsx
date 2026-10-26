import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  Plus,
  Briefcase,
  MapPin,
  Clock,
  Sparkles,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { api } from '../api/client';
import { ScoreBadge } from '../components/common/ScoreBadge';

export const CandidatesPage = () => {
  const [candidates, setCandidates] = useState([]);
  const [search, setSearch] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [minExp, setMinExp] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isAnonymized, setIsAnonymized] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCandidates();
  }, [search, skillFilter, minExp]);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (skillFilter) query.append('skill', skillFilter);
      if (minExp > 0) query.append('minExp', minExp);

      const res = await api.get(`/candidates?${query.toString()}`);
      if (res.success) {
        setCandidates(res.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-forest-700">
            Talent Pool Repository
          </span>
          <h1 className="font-editorial text-3xl font-bold text-ink mt-0.5">
            Candidates Directory
          </h1>
          <p className="text-xs text-ink-muted mt-1">
            Browse parsed candidates, extracted competencies, and verified qualifications.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/screening/upload"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-forest-500 hover:bg-forest-600 text-white rounded-lg text-xs font-medium shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Resumes</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="surface-card rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-ink-subtle absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by candidate name, email, or title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#FBFBF9] border border-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-ink focus:outline-none focus:border-forest-500"
            />
          </div>

          <div className="relative w-48">
            <input
              type="text"
              placeholder="Filter by skill (e.g. React)..."
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              className="w-full bg-[#FBFBF9] border border-border rounded-lg px-3 py-1.5 text-xs text-ink focus:outline-none focus:border-forest-500"
            />
          </div>
        </div>

        {/* Min experience filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-ink-muted">Min Experience:</span>
          <select
            value={minExp}
            onChange={(e) => setMinExp(Number(e.target.value))}
            className="bg-[#FBFBF9] border border-border rounded-lg text-xs font-medium text-ink px-2.5 py-1.5 focus:outline-none focus:border-forest-500"
          >
            <option value={0}>Any Experience</option>
            <option value={2}>&ge; 2 Years</option>
            <option value={5}>&ge; 5 Years</option>
            <option value={8}>&ge; 8 Years</option>
          </select>
        </div>
      </div>

      {/* Candidate Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-ink-muted">Loading candidates...</div>
      ) : candidates.length === 0 ? (
        <div className="surface-card rounded-2xl p-12 text-center">
          <Users className="w-10 h-10 text-ink-subtle mx-auto mb-3" />
          <h3 className="font-editorial text-lg font-semibold text-ink">No Candidates Found</h3>
          <p className="text-xs text-ink-muted max-w-sm mx-auto mt-1 mb-5">
            Upload resumes or adjust your search filters to find matching talent.
          </p>
          <Link
            to="/screening/upload"
            className="inline-flex items-center gap-2 px-4 py-2 bg-forest-500 hover:bg-forest-600 text-white rounded-lg text-xs font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>Upload First Resume</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {candidates.map((cand) => (
            <div
              key={cand._id}
              onClick={() => navigate(`/candidates/${cand._id}`)}
              className="surface-card rounded-2xl p-5 hover:border-forest-300 hover:shadow-card transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <h3 className="font-editorial text-lg font-bold text-ink group-hover:text-forest-700 truncate transition-colors">
                      {cand.name}
                    </h3>
                    <span className="text-[11px] text-ink-muted truncate block">
                      {cand.headline || `${cand.totalExperienceYears} Years Experience`}
                    </span>
                  </div>

                  {cand.latestScore !== null && (
                    <ScoreBadge score={cand.latestScore} size="sm" />
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-ink-subtle my-3">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-ink-subtle" />
                    {cand.location || 'Remote'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-ink-subtle" />
                    {cand.totalExperienceYears}y exp
                  </span>
                </div>

                {/* Top Skills tags */}
                <div className="flex flex-wrap gap-1.5 my-3">
                  {(cand.skills || []).slice(0, 4).map((sk) => (
                    <span
                      key={sk.name}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-sage-50 text-ink font-medium border border-sage-200"
                    >
                      {sk.name}
                    </span>
                  ))}
                  {(cand.skills || []).length > 4 && (
                    <span className="text-[10px] text-ink-subtle self-center">
                      +{(cand.skills || []).length - 4} more
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom Card Footer */}
              <div className="pt-3 border-t border-border flex items-center justify-between text-[11px]">
                <span className="text-ink-muted truncate max-w-[170px]">
                  {cand.latestJobTitle ? `Role: ${cand.latestJobTitle}` : 'Talent Pool'}
                </span>
                <span className="text-forest-600 font-semibold group-hover:text-forest-700 flex items-center gap-1">
                  View Profile &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
