const mongoose = require('mongoose');

const couponSchema = mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
  discountValue: { type: Number, required: true },
  expiryDate: { type: Date, required: true },
  
  // Total Usage limits
  unlimitedTotal: { type: Boolean, default: false },
  totalUsageLimit: { type: Number, default: null },
  totalUsageCount: { type: Number, default: 0 },
  
  // Daily usage limits
  unlimitedDaily: { type: Boolean, default: true },
  dailyUsageLimit: { type: Number, default: null },
  dailyUsageCount: { type: Number, default: 0 },
  dailyUsageDate: { type: String, default: '' }, // format: YYYY-MM-DD
  
  // Compatibility aliases
  usageLimit: { type: Number, default: null },
  usedCount: { type: Number, default: 0 },
  isUnlimitedTotal: { type: Boolean, default: false },
  isUnlimitedDaily: { type: Boolean, default: true },
  totalUsageLimitEnabled: { type: Boolean, default: true },
  dailyUsageLimitEnabled: { type: Boolean, default: false },

  // Park & Branch isolation
  applicablePark: { type: String, required: true },
  parkId: { type: String, required: true },
  applicableBranches: { type: [String], default: ['all'] },

  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Pre-save hook to keep data contract consistent and clean without fake numbers
couponSchema.pre('save', function() {
  // 1. Total usage normalization
  const hasTotalLimitNumber = (this.totalUsageLimit !== null && this.totalUsageLimit !== undefined && Number(this.totalUsageLimit) > 0) ||
                             (this.usageLimit !== null && this.usageLimit !== undefined && Number(this.usageLimit) > 0);
  
  const explicitlyLimitedTotal = this.unlimitedTotal === false || this.isUnlimitedTotal === false || this.totalUsageLimitEnabled === true;
  const explicitlyUnlimitedTotal = this.unlimitedTotal === true || this.isUnlimitedTotal === true || this.totalUsageLimitEnabled === false;

  if (explicitlyUnlimitedTotal && !explicitlyLimitedTotal) {
    this.unlimitedTotal = true;
    this.isUnlimitedTotal = true;
    this.totalUsageLimitEnabled = false;
    this.totalUsageLimit = null;
    this.usageLimit = null;
  } else if ((explicitlyLimitedTotal || hasTotalLimitNumber) && !explicitlyUnlimitedTotal) {
    const val = Number(this.totalUsageLimit ?? this.usageLimit);
    this.unlimitedTotal = false;
    this.isUnlimitedTotal = false;
    this.totalUsageLimitEnabled = true;
    this.totalUsageLimit = isNaN(val) ? null : val;
    this.usageLimit = this.totalUsageLimit;
  } else if (hasTotalLimitNumber && !this.unlimitedTotal && !this.isUnlimitedTotal) {
    const val = Number(this.totalUsageLimit ?? this.usageLimit);
    this.unlimitedTotal = false;
    this.isUnlimitedTotal = false;
    this.totalUsageLimitEnabled = true;
    this.totalUsageLimit = isNaN(val) ? null : val;
    this.usageLimit = this.totalUsageLimit;
  } else {
    this.unlimitedTotal = true;
    this.isUnlimitedTotal = true;
    this.totalUsageLimitEnabled = false;
    this.totalUsageLimit = null;
    this.usageLimit = null;
  }

  // 2. Daily usage normalization
  const hasDailyLimitNumber = this.dailyUsageLimit !== null && this.dailyUsageLimit !== undefined && Number(this.dailyUsageLimit) > 0;
  const explicitlyLimitedDaily = this.unlimitedDaily === false || this.isUnlimitedDaily === false || this.dailyUsageLimitEnabled === true;
  const explicitlyUnlimitedDaily = this.unlimitedDaily === true || this.isUnlimitedDaily === true || (this.dailyUsageLimitEnabled === false && this.unlimitedDaily === undefined && this.isUnlimitedDaily === undefined);

  if (explicitlyLimitedDaily && (hasDailyLimitNumber || this.dailyUsageLimit !== undefined)) {
    const val = Number(this.dailyUsageLimit);
    this.unlimitedDaily = false;
    this.isUnlimitedDaily = false;
    this.dailyUsageLimitEnabled = true;
    this.dailyUsageLimit = isNaN(val) ? null : val;
  } else if (explicitlyUnlimitedDaily && !explicitlyLimitedDaily) {
    this.unlimitedDaily = true;
    this.isUnlimitedDaily = true;
    this.dailyUsageLimitEnabled = false;
    this.dailyUsageLimit = null;
  } else if (hasDailyLimitNumber && this.unlimitedDaily !== true && this.isUnlimitedDaily !== true) {
    const val = Number(this.dailyUsageLimit);
    this.unlimitedDaily = false;
    this.isUnlimitedDaily = false;
    this.dailyUsageLimitEnabled = true;
    this.dailyUsageLimit = isNaN(val) ? null : val;
  } else {
    this.unlimitedDaily = true;
    this.isUnlimitedDaily = true;
    this.dailyUsageLimitEnabled = false;
    this.dailyUsageLimit = null;
  }

  // 3. Counter synchronization
  if (this.totalUsageCount !== undefined && this.totalUsageCount !== null) {
    this.usedCount = this.totalUsageCount;
  } else if (this.usedCount !== undefined && this.usedCount !== null) {
    this.totalUsageCount = this.usedCount;
  }
});

module.exports = mongoose.model('Coupon', couponSchema);
