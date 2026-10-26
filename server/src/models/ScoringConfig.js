const mongoose = require('mongoose');

const scoringConfigSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      unique: true,
    },
    weights: {
      skills: {
        type: Number,
        default: 40,
        min: 0,
        max: 100,
      },
      semantic: {
        type: Number,
        default: 30,
        min: 0,
        max: 100,
      },
      experience: {
        type: Number,
        default: 20,
        min: 0,
        max: 100,
      },
      qualification: {
        type: Number,
        default: 10,
        min: 0,
        max: 100,
      },
    },
    minimumReviewThreshold: {
      type: Number,
      default: 60,
      min: 0,
      max: 100,
    },
    shortlistThreshold: {
      type: Number,
      default: 75,
      min: 0,
      max: 100,
    },
    penalizeMissingMandatory: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

scoringConfigSchema.pre('save', function (next) {
  const sum = this.weights.skills + this.weights.semantic + this.weights.experience + this.weights.qualification;
  if (Math.round(sum) !== 100) {
    return next(new Error(`Scoring weights must sum to exactly 100%. Current sum: ${sum}%`));
  }
  next();
});

module.exports = mongoose.model('ScoringConfig', scoringConfigSchema);
