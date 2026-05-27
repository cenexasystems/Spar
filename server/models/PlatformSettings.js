const mongoose = require('mongoose');

const platformSettingsSchema = mongoose.Schema(
  {
    convenienceFee: { type: Number, default: 49 },
    convenienceFeeEnabled: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('PlatformSettings', platformSettingsSchema);
