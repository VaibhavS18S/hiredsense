const mongoose = require('mongoose');

const skillRequirementSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  minYears: { type: Number, default: 1 },
  importance: { type: String, enum: ['critical', 'high', 'medium'], default: 'high' },
  category: { type: String, default: 'General' },
});

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Contract', 'Remote', 'Hybrid'],
      default: 'Full-time',
    },
    experienceLevel: {
      type: String,
      enum: ['Entry Level', 'Mid Level', 'Senior Level', 'Lead / Staff', 'Executive'],
      default: 'Senior Level',
    },
    minYearsExperience: {
      type: Number,
      default: 3,
    },
    salaryRange: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
      currency: { type: String, default: 'USD' },
    },
    qualifications: [{
      type: String,
      trim: true,
    }],
    mandatorySkills: [skillRequirementSchema],
    preferredSkills: [{
      name: { type: String, required: true, trim: true },
      importance: { type: String, enum: ['high', 'medium', 'nice-to-have'], default: 'medium' },
      category: { type: String, default: 'General' },
    }],
    responsibilities: [{
      type: String,
      trim: true,
    }],
    rawDescription: {
      type: String,
      default: '',
    },
    readinessScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    readinessAnalysis: {
      clarityScore: { type: Number, default: 0 },
      missingElements: [{ type: String }],
      vaguePhrases: [{ type: String }],
      suggestions: [{ type: String }],
      isReady: { type: Boolean, default: false },
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'paused', 'archived'],
      default: 'active',
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

jobSchema.index({ title: 'text', department: 'text', rawDescription: 'text' });
jobSchema.index({ organization: 1, status: 1 });

module.exports = mongoose.model('Job', jobSchema);
