const mongoose = require('mongoose');

const skillEvidenceSchema = new mongoose.Schema({
  skill: { type: String, required: true },
  evidence: { type: String, default: '' },
  confidence: { type: Number, default: 0.9 },
  category: { type: String, default: 'General' },
});

const screeningResultSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate',
      required: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      required: true,
    },
    overallScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    componentScores: {
      skillAlignment: { type: Number, default: 0, min: 0, max: 100 },
      semanticSimilarity: { type: Number, default: 0, min: 0, max: 100 },
      experienceScore: { type: Number, default: 0, min: 0, max: 100 },
      qualificationScore: { type: Number, default: 0, min: 0, max: 100 },
    },
    weightsUsed: {
      skills: { type: Number, default: 40 },
      semantic: { type: Number, default: 30 },
      experience: { type: Number, default: 20 },
      qualification: { type: Number, default: 10 },
    },
    matchedRequiredSkills: [skillEvidenceSchema],
    matchedPreferredSkills: [skillEvidenceSchema],
    missingRequiredSkills: [{ type: String }],
    missingPreferredSkills: [{ type: String }],
    experienceEvidence: {
      candidateYears: { type: Number, default: 0 },
      requiredYears: { type: Number, default: 0 },
      evidenceExcerpt: { type: String, default: '' },
      summary: { type: String, default: '' },
    },
    qualificationEvidence: {
      candidateDegree: { type: String, default: '' },
      requiredDegree: { type: String, default: '' },
      matchStatus: { type: String, enum: ['Exceeds', 'Meets', 'Equivalent', 'Below', 'Unverified'], default: 'Meets' },
      evidenceExcerpt: { type: String, default: '' },
    },
    supportingExcerpts: [{
      topic: { type: String },
      quote: { type: String },
      sourceSection: { type: String, default: 'Experience' },
    }],
    dataQualityWarnings: [{ type: String }],
    recruiterOverride: {
      isOverridden: { type: Boolean, default: false },
      originalScore: { type: Number },
      adjustedScore: { type: Number },
      reason: { type: String },
      overriddenBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      overriddenAt: { type: Date },
    },
    notes: [{
      author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      text: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
    }],
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
  },
  { timestamps: true }
);

screeningResultSchema.index({ jobId: 1, overallScore: -1 });
screeningResultSchema.index({ candidateId: 1, jobId: 1 }, { unique: true });

module.exports = mongoose.model('ScreeningResult', screeningResultSchema);
