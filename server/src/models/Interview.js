const mongoose = require('mongoose');

const suggestedQuestionSchema = new mongoose.Schema({
  category: { type: String, enum: ['Technical Core', 'System Architecture', 'Behavioral & Leadership', 'Skill-Gap Investigation'], default: 'Technical Core' },
  question: { type: String, required: true },
  context: { type: String, default: '' },
  sampleRubric: { type: String, default: '' },
  targetSkillOrGap: { type: String, default: '' },
});

const rubricScoreSchema = new mongoose.Schema({
  criteria: { type: String, required: true },
  score: { type: Number, min: 1, max: 5, default: 3 },
  notes: { type: String, default: '' },
});

const interviewSchema = new mongoose.Schema(
  {
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
    },
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
    interviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    stageName: {
      type: String,
      default: 'Technical Assessment',
    },
    scheduledAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['Scheduled', 'Completed', 'Cancelled'],
      default: 'Scheduled',
    },
    suggestedQuestions: [suggestedQuestionSchema],
    rubricScores: [rubricScoreSchema],
    generalNotes: {
      type: String,
      default: '',
    },
    recommendation: {
      type: String,
      enum: ['Strong Yes', 'Yes', 'Neutral', 'No', 'Strong No', 'Pending'],
      default: 'Pending',
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Interview', interviewSchema);
