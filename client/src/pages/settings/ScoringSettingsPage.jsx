import React, { useState, useEffect } from 'react';
import { Sliders, CheckCircle2, AlertTriangle, Save, ShieldCheck } from 'lucide-react';
import { api } from '../../api/client';

export const ScoringSettingsPage = () => {
  const [weights, setWeights] = useState({
    skills: 40,
    semantic: 30,
    experience: 20,
    qualification: 10,
  });
  const [minThreshold, setMinThreshold] = useState(60);
  const [shortlistThreshold, setShortlistThreshold] = useState(75);
  const [penalizeMissingMandatory, setPenalizeMissingMandatory] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetchScoringConfig();
  }, []);

  const fetchScoringConfig = async () => {
    setLoading(true);
    try {
      const res = await api.get('/settings/scoring');
      if (res.success && res.data) {
        setWeights(res.data.weights || { skills: 40, semantic: 30, experience: 20, qualification: 10 });
        setMinThreshold(res.data.minimumReviewThreshold || 60);
        setShortlistThreshold(res.data.shortlistThreshold || 75);
        setPenalizeMissingMandatory(res.data.penalizeMissingMandatory ?? true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleWeightChange = (field, value) => {
    setWeights((prev) => ({
      ...prev,
      [field]: Number(value),
    }));
    setSavedSuccess(false);
  };

  const sumWeights = weights.skills + weights.semantic + weights.experience + weights.qualification;
  const isValidSum = Math.round(sumWeights) === 100;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isValidSum) {
      alert(`Scoring weights must sum to exactly 100%. Current sum: ${sumWeights}%`);
      return;
    }

    setSaving(true);
    try {
      const res = await api.put('/settings/scoring', {
        weights,
        minimumReviewThreshold: minThreshold,
        shortlistThreshold,
        penalizeMissingMandatory,
      });

      if (res.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      alert(err.message || 'Failed to update scoring weights');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setWeights({
      skills: 40,
      semantic: 30,
      experience: 20,
      qualification: 10,
    });
    setMinThreshold(60);
    setShortlistThreshold(75);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-forest-700">
            Explainable AI Calibration
          </span>
          <h1 className="font-editorial text-3xl font-bold text-ink mt-0.5">
            Scoring Model & Weights Configuration
          </h1>
          <p className="text-xs text-ink-muted mt-1">
            Calibrate the mathematical weights powering the match engine. Active weights must strictly sum to 100%.
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetDefaults}
          className="text-xs text-forest-700 hover:text-forest-800 font-medium underline"
        >
          Reset to Factory Defaults
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Sum Indicator Card */}
        <div
          className={`p-4 rounded-2xl border transition-colors flex items-center justify-between ${
            isValidSum
              ? 'bg-forest-50/70 border-forest-300 text-forest-900'
              : 'bg-red-50 border-red-300 text-red-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {isValidSum ? (
              <CheckCircle2 className="w-5 h-5 text-forest-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <div className="text-xs">
              <span className="font-semibold block">
                {isValidSum ? 'Weights Validated (100% Total)' : 'Validation Error: Weights Must Sum to 100%'}
              </span>
              <span className="text-[11px] opacity-80">
                {isValidSum
                  ? 'Normalized matching model meets mathematical integrity standards.'
                  : `Current total is ${sumWeights}%. Adjust the sliders below until the total equals exactly 100%.`}
              </span>
            </div>
          </div>

          <span className="font-mono text-2xl font-bold">
            {sumWeights}%
          </span>
        </div>

        {/* 4 Weight Sliders */}
        <div className="surface-card rounded-2xl p-6 space-y-6">
          <h3 className="font-editorial text-lg font-semibold text-ink">
            Component Weight Distribution
          </h3>

          {/* 1. Skill Alignment */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <div>
                <span className="font-bold text-ink">1. Required & Preferred Skill Alignment</span>
                <span className="text-ink-muted block text-[11px]">
                  Matches exact keyword & alias competencies against mandatory (85%) and preferred (15%) lists.
                </span>
              </div>
              <span className="font-mono font-bold text-sm text-forest-700 w-12 text-right">
                {weights.skills}%
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={70}
              step={5}
              value={weights.skills}
              onChange={(e) => handleWeightChange('skills', e.target.value)}
              className="w-full accent-forest-500 cursor-pointer"
            />
          </div>

          {/* 2. Semantic Similarity */}
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex justify-between items-center text-xs">
              <div>
                <span className="font-bold text-ink">2. Semantic Similarity to Job Description</span>
                <span className="text-ink-muted block text-[11px]">
                  Vector cosine similarity evaluating conceptual context, domain terminology, and narrative depth.
                </span>
              </div>
              <span className="font-mono font-bold text-sm text-forest-700 w-12 text-right">
                {weights.semantic}%
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={60}
              step={5}
              value={weights.semantic}
              onChange={(e) => handleWeightChange('semantic', e.target.value)}
              className="w-full accent-forest-500 cursor-pointer"
            />
          </div>

          {/* 3. Relevant Work Experience */}
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex justify-between items-center text-xs">
              <div>
                <span className="font-bold text-ink">3. Relevant Work Experience</span>
                <span className="text-ink-muted block text-[11px]">
                  Years of verified professional experience mapped against the role's minimum duration requirement.
                </span>
              </div>
              <span className="font-mono font-bold text-sm text-forest-700 w-12 text-right">
                {weights.experience}%
              </span>
            </div>
            <input
              type="range"
              min={5}
              max={40}
              step={5}
              value={weights.experience}
              onChange={(e) => handleWeightChange('experience', e.target.value)}
              className="w-full accent-forest-500 cursor-pointer"
            />
          </div>

          {/* 4. Qualification Alignment */}
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex justify-between items-center text-xs">
              <div>
                <span className="font-bold text-ink">4. Qualification & Degree Alignment</span>
                <span className="text-ink-muted block text-[11px]">
                  Degree hierarchy alignment (PhD &ge; Master's &ge; Bachelor's &ge; Equivalent practical background).
                </span>
              </div>
              <span className="font-mono font-bold text-sm text-forest-700 w-12 text-right">
                {weights.qualification}%
              </span>
            </div>
            <input
              type="range"
              min={5}
              max={30}
              step={5}
              value={weights.qualification}
              onChange={(e) => handleWeightChange('qualification', e.target.value)}
              className="w-full accent-forest-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Screening Thresholds */}
        <div className="surface-card rounded-2xl p-6 space-y-4">
          <h3 className="font-editorial text-lg font-semibold text-ink">
            Decision Organization Thresholds
          </h3>
          <p className="text-xs text-ink-muted">
            Configure advisory benchmarks. HireSense AI never automatically rejects candidates based on numerical cutoffs.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            <div>
              <label className="block text-xs font-medium text-ink mb-1">
                Shortlist Recommendation Threshold (&ge; {shortlistThreshold}%)
              </label>
              <input
                type="range"
                min={60}
                max={90}
                step={5}
                value={shortlistThreshold}
                onChange={(e) => setShortlistThreshold(Number(e.target.value))}
                className="w-full accent-forest-500 cursor-pointer"
              />
              <span className="text-[11px] text-ink-subtle">
                Candidates reaching this score are flagged as high matches for recruiter priority review.
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink mb-1">
                Minimum Review Threshold (&ge; {minThreshold}%)
              </label>
              <input
                type="range"
                min={40}
                max={75}
                step={5}
                value={minThreshold}
                onChange={(e) => setMinThreshold(Number(e.target.value))}
                className="w-full accent-forest-500 cursor-pointer"
              />
              <span className="text-[11px] text-ink-subtle">
                Baseline quality filter below which candidates are marked for manual gap probe.
              </span>
            </div>
          </div>
        </div>

        {/* Save Actions */}
        <div className="flex items-center justify-between">
          {savedSuccess && (
            <span className="text-xs font-semibold text-forest-700 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Scoring configuration saved and active!
            </span>
          )}
          <div className="ml-auto flex items-center gap-3">
            <button
              type="submit"
              disabled={!isValidSum || saving}
              className="px-5 py-2.5 bg-forest-500 hover:bg-forest-600 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Updating Model...' : 'Save Configuration'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
