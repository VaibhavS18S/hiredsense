const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    domain: {
      type: String,
      trim: true,
    },
    retentionDays: {
      type: Number,
      default: 365,
    },
    anonymizedScreening: {
      type: Boolean,
      default: false,
    },
    branding: {
      accentColor: { type: String, default: '#176B52' },
      logoUrl: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Organization', organizationSchema);
