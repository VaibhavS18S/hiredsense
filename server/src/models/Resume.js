const mongoose = require('mongoose');

const qualityIssueSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['missing_section', 'unclear_skill_description', 'date_inconsistency', 'duplicate_content', 'formatting_warning'],
    default: 'formatting_warning'
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'low'
  },
  description: { type: String, required: true },
  suggestion: { type: String, default: '' },
});

const resumeSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate',
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      default: '',
    },
    fileHash: {
      type: String,
      required: true,
      index: true,
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    mimeType: {
      type: String,
      default: 'application/pdf',
    },
    rawText: {
      type: String,
      default: '',
    },
    confidenceScore: {
      type: Number,
      default: 90,
      min: 0,
      max: 100,
    },
    qualityScore: {
      type: Number,
      default: 85,
      min: 0,
      max: 100,
    },
    qualityIssues: [qualityIssueSchema],
    isDuplicate: {
      type: Boolean,
      default: false,
    },
    duplicateOriginalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      default: null,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

resumeSchema.index({ fileHash: 1, organization: 1 });

module.exports = mongoose.model('Resume', resumeSchema);
