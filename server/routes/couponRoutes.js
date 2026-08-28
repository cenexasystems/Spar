const express = require('express');
const router = express.Router();
const Coupon = require('../models/Coupon');
const { parseEndOfDayExpiry, formatCouponDate, getTodayDateString } = require('../utils/couponUtils');

// Validation route for customers
router.post('/validate', async (req, res) => {
  try {
    const { code, parkId, parkName, branchId, location, wonderlaLocation } = req.body;
    if (!code || !code.trim()) {
      return res.status(400).json({ message: "Coupon code is required" });
    }

    const coupon = await Coupon.findOne({ code: code.trim().toUpperCase() });
    if (!coupon) {
      return res.status(404).json({ message: "Invalid coupon code" });
    }
    
    // Priority 1: Manually disabled
    if (coupon.isActive === false) {
      return res.status(400).json({ message: "Coupon is currently inactive" });
    }
    
    // Priority 2: Expiry check (evaluated fairly until 23:59:59.999 of expiry date)
    const expiry = parseEndOfDayExpiry(coupon.expiryDate);
    const now = new Date();
    if (now.getTime() > expiry.getTime()) {
      return res.status(400).json({ 
        message: `This coupon has expired on ${formatCouponDate(coupon.expiryDate)}.` 
      });
    }
    
    // Priority 3: Total usage limit check (unless unlimited)
    const isUnlimitedTotal = coupon.isUnlimitedTotal === true;
    const totalLimit = coupon.totalUsageLimit !== null && coupon.totalUsageLimit !== undefined 
      ? Number(coupon.totalUsageLimit) 
      : (coupon.usageLimit !== undefined ? Number(coupon.usageLimit) : null);
    const totalCount = Number(coupon.totalUsageCount ?? coupon.usedCount ?? 0);
    
    if (!isUnlimitedTotal && totalLimit !== null && totalLimit > 0 && totalCount >= totalLimit) {
      return res.status(400).json({ message: "This coupon has reached its total usage limit." });
    }

    // Priority 4: Daily usage limit check (unless unlimited)
    const isUnlimitedDaily = coupon.isUnlimitedDaily !== false;
    if (!isUnlimitedDaily && coupon.dailyUsageLimit !== null && coupon.dailyUsageLimit !== undefined) {
      const dailyLimit = Number(coupon.dailyUsageLimit);
      const todayStr = getTodayDateString();
      const currentDailyCount = coupon.dailyUsageDate === todayStr ? Number(coupon.dailyUsageCount || 0) : 0;
      if (dailyLimit > 0 && currentDailyCount >= dailyLimit) {
        return res.status(400).json({ message: "This coupon has reached its daily usage limit for today." });
      }
    }
    
    // ── Priority 5: Park-level isolation check (backend enforcement) ──────────────────
    const couponPark = (coupon.parkId || coupon.applicablePark || '').trim().toLowerCase();
    const requestedPark = (parkName || parkId || '').trim().toLowerCase();
    
    if (couponPark && couponPark !== 'all') {
      if (!requestedPark || (couponPark !== requestedPark && !requestedPark.includes(couponPark) && !couponPark.includes(requestedPark))) {
        return res.status(400).json({ 
          message: `This coupon is not valid for ${parkName || 'the selected park'}. It is only valid for ${coupon.applicablePark || coupon.parkId}.` 
        });
      }
    }

    // ── Priority 6: Branch-level applicability check ──────────────────
    const requestedBranch = (branchId || location || wonderlaLocation || '').trim().toLowerCase();
    const applicableBranches = Array.isArray(coupon.applicableBranches) && coupon.applicableBranches.length > 0 
      ? coupon.applicableBranches 
      : ['all'];

    const appliesToAllBranches = applicableBranches.some(b => (b || '').toLowerCase() === 'all');

    if (!appliesToAllBranches && requestedBranch) {
      const isBranchAllowed = applicableBranches.some(b => {
        const bLower = (b || '').toLowerCase();
        return bLower === requestedBranch || requestedBranch.includes(bLower) || bLower.includes(requestedBranch);
      });

      if (!isBranchAllowed) {
        return res.status(400).json({ 
          message: "This coupon is not valid for the selected branch." 
        });
      }
    }
    
    res.json({
      valid: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      expiryDateFormatted: formatCouponDate(coupon.expiryDate),
      applicablePark: coupon.applicablePark,
      applicableBranches: coupon.applicableBranches
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

