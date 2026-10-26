import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarCheck2,
  Clock,
  User,
  Briefcase,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Star,
  FileEdit,
  Save,
  Plus,
} from 'lucide-react';
import { api } from '../api/client';

export const InterviewsPage = () => {
  const [interviews, setInterviews] = useState([]);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingFeedback, setSavingFeedback] = useState(false);

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    setLoading(true);
    try {
      const res = await api.get('/interviews');
      if (res.success) {
        setInterviews(res.data || []);
        if (res.data.length > 0) {
          setSelectedInterview(res.data[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRubricChange = (index, newScore) => {
    if (!selectedInterview) return;
    const updated = { ...selectedInterview };
    updated.rubricScores[index].score = newScore;
    setSelectedInterview(updated);
  };

  const handleRubricNoteChange = (index, notes) => {
    if (!selectedInterview) return;
    const updated = { ...selectedInterview };
    updated.rubricScores[index].notes = notes;
    setSelectedInterview(updated);
  };

  const handleSaveFeedback = async () => {
    if (!selectedInterview) return;
    setSavingFeedback(true);
    try {
      const res = await api.put(`/interviews/${selectedInterview._id}`, {
        rubricScores: selectedInterview.rubricScores,
        generalNotes: selectedInterview.generalNotes,
        recommendation: selectedInterview.recommendation,
        status: selectedInterview.status,
      });

      if (res.success) {
        alert('Interview evaluation and rubric scores saved successfully.');
        fetchInterviews();
      }
    } catch (err) {
      alert(err.message || 'Failed to save feedback');
    } finally {
      setSavingFeedback(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-forest-700">
            Structured Hiring Evaluation
          </span>
          <h1 className="font-editorial text-3xl font-bold text-ink mt-0.5">
            Interview Intelligence Studio
          </h1>
          <p className="text-xs text-ink-muted mt-1">
            Role-tailored technical & behavioral rubrics, skill-gap inquiry guides, and objective scoring.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Scheduled Interviews List */}
        <div className="surface-card rounded-2xl p-5 space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted block mb-2">
            Interviews ({interviews.length})
          </span>

          {loading ? (
            <div className="py-8 text-center text-xs text-ink-muted">Loading interviews...</div>
          ) : interviews.length === 0 ? (
            <div className="text-center py-8 text-xs text-ink-muted">
              No interviews scheduled yet.
            </div>
          ) : (
            interviews.map((item) => {
              const isSelected = selectedInterview?._id === item._id;

              return (
                <div
                  key={item._id}
                  onClick={() => setSelectedInterview(item)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-sage-50/80 border-forest-500 shadow-sm'
                      : 'bg-[#FBFBF9] border-border hover:border-forest-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-semibold text-xs text-ink truncate">
                      {item.candidateId?.name}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.2 rounded-full font-medium ${
                        item.status === 'Completed'
                          ? 'bg-forest-100 text-forest-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <span className="text-[11px] text-ink-muted block truncate mb-2">
                    {item.jobId?.title}
                  </span>

                  <div className="flex items-center justify-between text-[10px] text-ink-subtle pt-2 border-t border-border/60">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(item.scheduledAt).toLocaleDateString()}
                    </span>
                    <span className="font-medium text-forest-700">
                      {item.recommendation || 'Pending'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Detailed Rubric & Suggested Questions (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {selectedInterview ? (
            <>
              {/* Interview Meta Bar */}
              <div className="surface-card rounded-2xl p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-forest-700">
                      {selectedInterview.stageName}
                    </span>
                    <h2 className="font-editorial text-2xl font-bold text-ink">
                      {selectedInterview.candidateId?.name}
                    </h2>
                    <span className="text-xs text-ink-muted">
                      Role: <span className="font-semibold text-ink">{selectedInterview.jobId?.title}</span> &bull; Interviewer: {selectedInterview.interviewer?.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={selectedInterview.recommendation}
                      onChange={(e) =>
                        setSelectedInterview({ ...selectedInterview, recommendation: e.target.value })
                      }
                      className="bg-white border border-border rounded-lg text-xs font-semibold px-3 py-1.5 focus:outline-none focus:border-forest-500 shadow-subtle text-ink"
                    >
                      <option value="Pending">Pending Outcome</option>
                      <option value="Strong Yes">Strong Yes (Advance)</option>
                      <option value="Yes">Yes (Meets Standard)</option>
                      <option value="Neutral">Neutral (Need 2nd Opinion)</option>
                      <option value="No">No (Does Not Meet Standard)</option>
                    </select>

                    <button
                      onClick={handleSaveFeedback}
                      disabled={savingFeedback}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-forest-500 hover:bg-forest-600 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{savingFeedback ? 'Saving...' : 'Save Evaluation'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* AI-Suggested Role-Specific & Gap Questions */}
              <div className="surface-card rounded-2xl p-6">
                <h3 className="font-editorial text-lg font-semibold text-ink mb-1 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-forest-600" />
                  AI Suggested Interview Questions & Rubrics
                </h3>
                <p className="text-xs text-ink-muted mb-4">
                  Tailored inquiry prompts targeting claimed competencies and resume skill gaps.
                </p>

                <div className="space-y-4">
                  {(selectedInterview.suggestedQuestions || []).map((q, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-[#FBFBF9] border border-border text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-forest-700 bg-sage-100 px-2 py-0.5 rounded">
                          {q.category}
                        </span>
                        <span className="text-[10px] text-ink-subtle font-medium">
                          {q.targetSkillOrGap}
                        </span>
                      </div>

                      <p className="font-semibold text-ink text-xs leading-relaxed">
                        "{q.question}"
                      </p>

                      <p className="text-[11px] text-ink-muted leading-relaxed">
                        <strong className="text-ink">Context:</strong> {q.context}
                      </p>

                      {q.sampleRubric && (
                        <div className="p-2.5 rounded-lg bg-white border border-border/80 text-[10px] text-ink-light">
                          <strong className="text-forest-800">Scoring Rubric:</strong> {q.sampleRubric}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Structured Rubric Evaluation (1 to 5) */}
              <div className="surface-card rounded-2xl p-6">
                <h3 className="font-editorial text-lg font-semibold text-ink mb-1">
                  Structured Candidate Rubric (1 - 5 Scale)
                </h3>
                <p className="text-xs text-ink-muted mb-4">
                  Rate candidate competencies objectively to prevent halo effect and bias.
                </p>

                <div className="space-y-4">
                  {(selectedInterview.rubricScores || []).map((rubric, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-[#FBFBF9] border border-border text-xs">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-ink">{rubric.criteria}</span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => handleRubricChange(idx, star)}
                              className={`w-6 h-6 rounded flex items-center justify-center font-mono text-xs font-bold transition-colors ${
                                rubric.score >= star
                                  ? 'bg-forest-500 text-white'
                                  : 'bg-white border border-border text-ink-muted hover:bg-sage-100'
                              }`}
                            >
                              {star}
                            </button>
                          ))}
                        </div>
                      </div>

                      <input
                        type="text"
                        placeholder="Interviewer observations on this criteria..."
                        value={rubric.notes || ''}
                        onChange={(e) => handleRubricNoteChange(idx, e.target.value)}
                        className="w-full bg-white border border-border rounded-lg px-3 py-1.5 text-xs text-ink focus:outline-none focus:border-forest-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* General Interview Notes */}
              <div className="surface-card rounded-2xl p-6">
                <h3 className="font-editorial text-lg font-semibold text-ink mb-2">
                  Overall Interview Synthesis & Notes
                </h3>
                <textarea
                  rows={4}
                  placeholder="Summarize key architectural discussion, leadership signal, and compensation/level expectations..."
                  value={selectedInterview.generalNotes || ''}
                  onChange={(e) =>
                    setSelectedInterview({ ...selectedInterview, generalNotes: e.target.value })
                  }
                  className="w-full bg-[#FBFBF9] border border-border rounded-xl p-3 text-xs text-ink focus:outline-none focus:border-forest-500 focus:bg-white transition-all leading-relaxed"
                />
              </div>
            </>
          ) : (
            <div className="surface-card rounded-2xl p-12 text-center text-xs text-ink-muted">
              Select an interview on the left to review suggested questions and record rubric scores.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
