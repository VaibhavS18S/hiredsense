const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true, // e.g. 'JOB_CREATED', 'STAGE_CHANGED', 'CANDIDATE_OVERRIDDEN', 'RESUME_UPLOADED', 'DATA_EXPORTED'
    },
    entityType: {
      type: String,
      enum: ['Job', 'Candidate', 'Resume', 'Application', 'ScreeningResult', 'Interview', 'Settings'],
      required: true,
    },
    entityId: {
      type: String,
      default: '',
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1',
    },
  },
  { timestamps: true }
);

auditLogSchema.index({ organization: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
