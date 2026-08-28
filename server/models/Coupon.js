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
couponSchema.pre('save', function(next) {
  // 1. Total usage normalization
  const isUnlimTotal = this.unlimitedTotal === true || this.isUnlimitedTotal === true || this.totalUsageLimitEnabled === false;
  if (isUnlimTotal) {
    this.unlimitedTotal = true;
    this.isUnlimitedTotal = true;
    this.totalUsageLimitEnabled = false;
    this.totalUsageLimit = null;
    this.usageLimit = null;
  } else if (this.totalUsageLimit !== null && this.totalUsageLimit !== undefined) {
    this.unlimitedTotal = false;
    this.isUnlimitedTotal = false;
    this.totalUsageLimitEnabled = true;
    this.totalUsageLimit = Number(this.totalUsageLimit);
    this.usageLimit = Number(this.totalUsageLimit);
  } else if (this.usageLimit !== null && this.usageLimit !== undefined) {
    this.unlimitedTotal = false;
    this.isUnlimitedTotal = false;
    this.totalUsageLimitEnabled = true;
    this.totalUsageLimit = Number(this.usageLimit);
  } else {
    this.unlimitedTotal = true;
    this.isUnlimitedTotal = true;
    this.totalUsageLimitEnabled = false;
    this.totalUsageLimit = null;
    this.usageLimit = null;
  }

  // 2. Daily usage normalization
  const isUnlimDaily = this.unlimitedDaily === true || this.isUnlimitedDaily === true || this.dailyUsageLimitEnabled === false;
  if (isUnlimDaily) {
    this.unlimitedDaily = true;
    this.isUnlimitedDaily = true;
    this.dailyUsageLimitEnabled = false;
    this.dailyUsageLimit = null;
  } else if (this.dailyUsageLimit !== null && this.dailyUsageLimit !== undefined) {
    this.unlimitedDaily = false;
    this.isUnlimitedDaily = false;
    this.dailyUsageLimitEnabled = true;
    this.dailyUsageLimit = Number(this.dailyUsageLimit);
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

  next();
});

module.exports = mongoose.model('Coupon', couponSchema);
