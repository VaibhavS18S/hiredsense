const mongoose = require('mongoose');

const experienceEntrySchema = new mongoose.Schema({
  company: { type: String, default: '' },
  role: { type: String, default: '' },
  startDate: { type: String, default: '' },
  endDate: { type: String, default: 'Present' },
  isCurrent: { type: Boolean, default: false },
  durationMonths: { type: Number, default: 0 },
  description: { type: String, default: '' },
  technologies: [{ type: String }],
});

const educationEntrySchema = new mongoose.Schema({
  institution: { type: String, default: '' },
  degree: { type: String, default: '' },
  field: { type: String, default: '' },
  graduationYear: { type: String, default: '' },
  grade: { type: String, default: '' },
});

const candidateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    location: {
      type: String,
      trim: true,
      default: '',
    },
    links: {
      linkedin: { type: String, default: '' },
      github: { type: String, default: '' },
      portfolio: { type: String, default: '' },
    },
    headline: {
      type: String,
      default: '',
    },
    totalExperienceYears: {
      type: Number,
      default: 0,
    },
    skills: [{
      name: { type: String, required: true },
      category: { type: String, default: 'General' },
      yearsOfExperience: { type: Number, default: 1 },
      confidence: { type: Number, default: 0.9 },
    }],
    experienceTimeline: [experienceEntrySchema],
    educationTimeline: [educationEntrySchema],
    certifications: [{ type: String }],
    projects: [{
      name: { type: String },
      description: { type: String },
      technologies: [{ type: String }],
      link: { type: String },
    }],
    detectedStrengths: [{ type: String }],
    unverifiedRequirements: [{ type: String }],
    dataCorrections: [{
      field: { type: String },
      oldValue: { type: mongoose.Schema.Types.Mixed },
      newValue: { type: mongoose.Schema.Types.Mixed },
      correctedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      correctedAt: { type: Date, default: Date.now },
    }],
    consentGiven: {
      type: Boolean,
      default: true,
    },
    consentDate: {
      type: Date,
      default: Date.now,
    },
    isAnonymized: {
      type: Boolean,
      default: false,
    },
    source: {
      type: String,
      default: 'Direct Upload',
    },
    tags: [{ type: String }],
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
  },
  { timestamps: true }
);

candidateSchema.index({ name: 'text', email: 'text', location: 'text', 'skills.name': 'text' });
candidateSchema.index({ organization: 1, totalExperienceYears: 1 });

module.exports = mongoose.model('Candidate', candidateSchema);
