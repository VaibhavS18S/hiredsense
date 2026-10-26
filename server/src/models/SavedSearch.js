const mongoose = require('mongoose');

const savedSearchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    filters: {
      keyword: { type: String, default: '' },
      skills: [{ type: String }],
      minScore: { type: Number, default: 0 },
      maxScore: { type: Number, default: 100 },
      minExperience: { type: Number, default: 0 },
      location: { type: String, default: '' },
      stage: { type: String, default: '' },
      jobId: { type: String, default: '' },
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

module.exports = mongoose.model('SavedSearch', savedSearchSchema);
