const express = require('express');
const router = express.Router();
const Coupon = require('../models/Coupon');

// Validation route for customers
router.post('/validate', async (req, res) => {
  try {
    const { code, parkId } = req.body;
    if (!code) return res.status(400).json({ message: "Coupon code is required" });

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon) return res.status(404).json({ message: "Invalid coupon code" });
    
    if (!coupon.isActive) return res.status(400).json({ message: "Coupon is currently inactive" });
    
    if (new Date(coupon.expiryDate) < new Date()) {
      return res.status(400).json({ message: "This coupon has expired" });
    }
    
    if (coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ message: "Coupon usage limit reached" });
    }
    
    if (coupon.applicablePark !== 'all' && coupon.applicablePark.toLowerCase() !== (parkId || '').toLowerCase()) {
      return res.status(400).json({ message: `This coupon is not valid for ${parkId}` });
    }
    
    res.json({
      valid: true,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
