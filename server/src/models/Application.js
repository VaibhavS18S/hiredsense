const mongoose = require('mongoose');

const stageHistorySchema = new mongoose.Schema({
  stage: {
    type: String,
    enum: ['New', 'Screening', 'Shortlisted', 'Interview', 'Offer', 'Hired', 'Rejected'],
    required: true,
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  changedAt: {
    type: Date,
    default: Date.now,
  },
  note: {
    type: String,
    default: '',
  },
  previousStage: {
    type: String,
    default: '',
  },
});

const applicationSchema = new mongoose.Schema(
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
    stage: {
      type: String,
      enum: ['New', 'Screening', 'Shortlisted', 'Interview', 'Offer', 'Hired', 'Rejected'],
      default: 'New',
    },
    assignedRecruiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    stageHistory: [stageHistorySchema],
    notes: [{
      author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      text: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
    }],
    tags: [{ type: String }],
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
  },
  { timestamps: true }
);

applicationSchema.index({ jobId: 1, stage: 1 });
applicationSchema.index({ candidateId: 1, jobId: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
