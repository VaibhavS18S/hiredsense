import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Sparkles,
  Search,
  Filter,
  Bookmark,
  BookmarkCheck,
  Trash2,
  Users,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Tag,
} from 'lucide-react';
import { api } from '../api/client';
import { ScoreBadge } from '../components/common/ScoreBadge';

export const TalentPoolPage = () => {
  const [searchParams] = useSearchParams();
  const initialKeyword = searchParams.get('search') || '';

  const [keyword, setKeyword] = useState(initialKeyword);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [minExp, setMinExp] = useState(0);
  const [maxExp, setMaxExp] = useState(25);
  const [minScore, setMinScore] = useState(0);
  const [location, setLocation] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);

  // Saved searches
  const [savedSearches, setSavedSearches] = useState([]);
  const [newSearchName, setNewSearchName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);

  const POPULAR_SKILLS = [
    'React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Docker',
    'Kubernetes', 'AWS', 'Terraform', 'Python', 'PyTorch',
    'Figma', 'Design Systems', 'GraphQL', 'Redis',
  ];

  useEffect(() => {
    fetchSavedSearches();
    executeSearch();
  }, []);

  const fetchSavedSearches = async () => {
    try {
      const res = await api.get('/search/saved');
      if (res.success) setSavedSearches(res.data || []);
    } catch (e) {}
  };

  const executeSearch = async () => {
    setLoading(true);
    try {
      const payload = {
        keyword: keyword.trim(),
        skills: selectedSkills,
        minExp: Number(minExp),
        maxExp: Number(maxExp),
        minScore: Number(minScore),
        location: location.trim(),
      };

      const res = await api.post('/search/talent-pool', payload);
      if (res.success) {
        setCandidates(res.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSkill = (skill) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleApplySavedSearch = (saved) => {
    const f = saved.filters || {};
    setKeyword(f.keyword || '');
    setSelectedSkills(f.skills || []);
    setMinExp(f.minExperience || 0);
    setMinScore(f.minScore || 0);
    setLocation(f.location || '');
  };

  const handleSaveSearchPreset = async (e) => {
    e.preventDefault();
    if (!newSearchName.trim()) return;

    try {
      const res = await api.post('/search/saved', {
        name: newSearchName.trim(),
        filters: {
          keyword,
          skills: selectedSkills,
          minExperience: minExp,
          minScore,
          location,
        },
      });

      if (res.success) {
        setNewSearchName('');
        setShowSaveModal(false);
        fetchSavedSearches();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteSavedSearch = async (e, id) => {
    e.stopPropagation();
    try {
      await api.delete(`/search/saved/${id}`);
      fetchSavedSearches();
    } catch (e) {}
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-forest-700">
            Multi-Facet Talent Sourcing
          </span>
          <h1 className="font-editorial text-3xl font-bold text-ink mt-0.5">
            Advanced Search & Talent Pool
          </h1>
          <p className="text-xs text-ink-muted mt-1">
            Query across candidate resumes, extracted skill models, past companies, and matching ranges.
          </p>
        </div>

        <button
          onClick={() => setShowSaveModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-sage-50 hover:bg-sage-100 border border-sage-300 text-forest-800 rounded-lg text-xs font-semibold transition-colors self-start sm:self-auto"
        >
          <Bookmark className="w-4 h-4" />
          <span>Save Filter Preset</span>
        </button>
      </div>

      {/* Saved Searches Pill Bar */}
      {savedSearches.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-ink-subtle font-medium text-[11px] shrink-0">Saved Presets:</span>
          {savedSearches.map((s) => (
            <div
              key={s._id}
              onClick={() => handleApplySavedSearch(s)}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-border hover:border-forest-400 cursor-pointer text-xs font-medium text-ink shrink-0 transition-colors shadow-subtle group"
            >
              <BookmarkCheck className="w-3.5 h-3.5 text-forest-600" />
              <span>{s.name}</span>
              <button
                onClick={(e) => handleDeleteSavedSearch(e, s._id)}
                className="text-ink-subtle hover:text-red-700 ml-1"
                title="Delete preset"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search & Multi-filter Controls Box */}
      <div className="surface-card rounded-2xl p-6 space-y-4">
        {/* Keyword & Location row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-ink-subtle absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Full-text query: e.g. React microservices, AWS architect, NLP researcher..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') executeSearch(); }}
              className="w-full bg-[#FBFBF9] border border-border rounded-xl pl-9 pr-3 py-2 text-xs text-ink focus:outline-none focus:border-forest-500 focus:bg-white transition-all font-medium"
            />
          </div>

          <div className="relative">
            <MapPin className="w-4 h-4 text-ink-subtle absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Location (e.g. San Francisco, Remote)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-[#FBFBF9] border border-border rounded-xl pl-9 pr-3 py-2 text-xs text-ink focus:outline-none focus:border-forest-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Skill tag filters */}
        <div>
          <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block mb-2">
            Skill Taxonomy Filters:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {POPULAR_SKILLS.map((sk) => {
              const active = selectedSkills.includes(sk);
              return (
                <button
                  key={sk}
                  type="button"
                  onClick={() => toggleSkill(sk)}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all ${
                    active
                      ? 'bg-forest-500 text-white border-forest-500 shadow-sm'
                      : 'bg-[#FBFBF9] text-ink border-border hover:border-forest-300'
                  }`}
                >
                  {sk}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sliders: Experience Range & Min Score */}
        <div className="pt-2 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="font-medium text-ink">Minimum Experience:</span>
              <span className="font-mono font-bold text-forest-700">{minExp} Years</span>
            </div>
            <input
              type="range"
              min={0}
              max={15}
              value={minExp}
              onChange={(e) => setMinExp(Number(e.target.value))}
              className="w-full accent-forest-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="font-medium text-ink">Match Score Threshold:</span>
              <span className="font-mono font-bold text-forest-700">&ge; {minScore}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={90}
              step={5}
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="w-full accent-forest-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Submit action */}
        <div className="flex justify-end pt-1">
          <button
            onClick={executeSearch}
            disabled={loading}
            className="px-5 py-2 bg-forest-500 hover:bg-forest-600 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Apply Sourcing Filters</span>
          </button>
        </div>
      </div>

      {/* Results Count & Cards */}
      <div>
        <div className="flex items-center justify-between mb-3 text-xs text-ink-muted">
          <span>Found {candidates.length} matching talent profiles</span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-ink-muted">Filtering talent pool...</div>
        ) : candidates.length === 0 ? (
          <div className="surface-card rounded-2xl p-12 text-center text-xs text-ink-muted">
            No candidates matched your search parameters. Try loosening filters or clearing keyword.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {candidates.map((cand) => (
              <div
                key={cand._id}
                className="surface-card rounded-2xl p-5 hover:border-forest-300 hover:shadow-card transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <div>
                      <Link
                        to={`/candidates/${cand._id}`}
                        className="font-editorial text-lg font-bold text-ink hover:text-forest-700 block transition-colors"
                      >
                        {cand.name}
                      </Link>
                      <span className="text-[11px] text-ink-muted block truncate">
                        {cand.headline || `${cand.totalExperienceYears}y Experience`}
                      </span>
                    </div>

                    {cand.bestMatchScore !== null && (
                      <ScoreBadge score={cand.bestMatchScore} size="sm" />
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-ink-subtle my-2.5">
                    <span className="flex items-center gap-1 text-ink">
                      <MapPin className="w-3 h-3 text-ink-subtle" />
                      {cand.location || 'Remote'}
                    </span>
                    <span className="flex items-center gap-1 text-ink">
                      <Clock className="w-3 h-3 text-ink-subtle" />
                      {cand.totalExperienceYears}y exp
                    </span>
                    {cand.isDuplicate && (
                      <span className="text-[10px] text-amber-700 font-medium bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                        Duplicate
                      </span>
                    )}
                  </div>

                  {/* Skills tags */}
                  <div className="flex flex-wrap gap-1 my-3">
                    {(cand.skills || []).slice(0, 5).map((sk) => (
                      <span
                        key={sk.name}
                        className="text-[10px] px-2 py-0.5 rounded bg-sage-50 text-ink border border-sage-200 font-medium"
                      >
                        {sk.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
                  <span className="text-[11px] text-ink-subtle truncate max-w-[170px]">
                    {cand.bestMatchJob ? `Evaluated: ${cand.bestMatchJob}` : 'In Talent Pool'}
                  </span>
                  <Link
                    to={`/candidates/${cand._id}`}
                    className="text-forest-600 hover:text-forest-800 font-semibold"
                  >
                    View &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save Preset Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-dropdown border border-border max-w-sm w-full p-6 space-y-4">
            <h3 className="font-editorial text-lg font-bold text-ink">
              Save Search Preset
            </h3>
            <p className="text-xs text-ink-muted">
              Save your current search query and filters as a reusable preset.
            </p>

            <form onSubmit={handleSaveSearchPreset} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Preset Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Full-Stack React Leads"
                  value={newSearchName}
                  onChange={(e) => setNewSearchName(e.target.value)}
                  className="w-full bg-[#FBFBF9] border border-border rounded-lg px-3 py-1.5 text-xs text-ink focus:outline-none focus:border-forest-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  className="px-3 py-1.5 border border-border rounded-lg text-xs font-medium text-ink hover:bg-sage-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-forest-500 hover:bg-forest-600 text-white rounded-lg text-xs font-medium"
                >
                  Save Preset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
