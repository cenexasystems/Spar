const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { protect, admin } = require('../middleware/authMiddleware');
const Park = require('../models/Park');
const ParkCategory = require('../models/ParkCategory');
const ParkPricing = require('../models/ParkPricing');

// Helper to find park by ID or Name
const findPark = async (identifier) => {
  if (!identifier) return null;
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    const p = await Park.findById(identifier);
    if (p) return p;
  }
  return await Park.findOne({ name: new RegExp(`^${identifier.trim()}$`, 'i') });
};

// ── GET: Active Visitor Categories ──────────────────────────────────────────
router.get('/:parkId/categories', async (req, res) => {
  try {
    const park = await findPark(req.params.parkId);
    if (park && park.visitorCategories && park.visitorCategories.length > 0) {
      const { all } = req.query;
      if (all === 'true') {
        return res.json(park.visitorCategories);
      }
      return res.json(park.visitorCategories.filter(c => c.isActive !== false));
    }

    // Fallback to separate ParkCategory collection
    const pc = await ParkCategory.findOne({ parkId: req.params.parkId });
    if (pc) {
      const { all } = req.query;
      if (all === 'true') return res.json(pc.categories);
      return res.json(pc.categories.filter(c => c.isActive));
    }

    // Default categories fallback
    return res.json([
      { id: 'adult', name: 'Adults', condition: '>140cm', isFree: false, isActive: true },
      { id: 'child', name: 'Children', condition: '85–140cm', isFree: false, isActive: true },
      { id: 'senior', name: 'Sr. Citizen', condition: 'Age 60+', isFree: false, isActive: true },
      { id: 'student', name: 'Student', condition: 'Valid ID', isFree: false, isActive: true },
      { id: 'below85cm', name: 'Below 85cm', condition: '<85cm', isFree: true, isActive: true }
    ]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── GET: Ticket Pricing ───────────────────────────────────────────────────
router.get('/:parkId/pricing', async (req, res) => {
  try {
    const { location, ticketType = 'normal' } = req.query;
    const park = await findPark(req.params.parkId);

    if (park) {
      // 1. Check Wonderla-style location pricing if location requested
      if (location && park.wonderlaPricing && typeof park.wonderlaPricing === 'object') {
        const locKey = location.toLowerCase();
        const locData = park.wonderlaPricing[locKey] || park.wonderlaPricing.chennai;
        if (locData) {
          const typePrices = locData[ticketType] || locData.normal || {};
          return res.json({
            prices: typePrices,
            fastTrackAvailable: locData.fastTrackAvailable !== false,
            parkHours: locData.parkHours || '',
            waterHours: locData.waterHours || ''
          });
        }
      }

      // 2. Check general ticketPricing (e.g. { normal: { adult: 1000, child: 800, ... } })
      if (park.ticketPricing && typeof park.ticketPricing === 'object') {
        const prices = park.ticketPricing[ticketType] || park.ticketPricing.normal;
        if (prices && Object.keys(prices).length > 0) {
          return res.json({
            prices,
            fastTrackAvailable: false
          });
        }
      }

      // 3. Fallback to scalar price fields on park document
      const fallbackPrices = {
        adult: park.adultPrice || park.price || 0,
        child: park.childPrice || Math.round((park.price || 0) * 0.75),
        senior: park.seniorPrice || Math.round((park.price || 0) * 0.8),
        student: park.studentPrice || Math.round((park.price || 0) * 0.85),
        infant: 0,
        below85cm: 0
      };

      return res.json({
        prices: fallbackPrices,
        fastTrackAvailable: false
      });
    }

    // Secondary fallback to ParkPricing collection
    const query = { parkId: req.params.parkId };
    if (location && location !== 'null' && location !== 'undefined') {
      query.location = location.toLowerCase();
    }
    if (ticketType) query.ticketType = ticketType;

    const pricing = await ParkPricing.find(query);
    if (pricing.length > 0) {
      return res.json({ prices: pricing[0].prices, fastTrackAvailable: pricing[0].fastTrackAvailable });
    }

    res.json({ prices: {}, fastTrackAvailable: false });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── POST: Update Visitor Categories (ADMIN) ───────────────────────────────
router.post('/:parkId/categories', protect, admin, async (req, res) => {
  try {
    const { categories } = req.body;
    const updated = await ParkCategory.findOneAndUpdate(
      { parkId: req.params.parkId },
      { parkId: req.params.parkId, categories },
      { upsert: true, new: true }
    );
    res.json({ message: 'Visitor categories updated', parkCategory: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── POST: Update Ticket Pricing (ADMIN) ───────────────────────────────────
router.post('/:parkId/pricing', protect, admin, async (req, res) => {
  try {
    const { pricingData } = req.body; 
    // Expecting array of { location, ticketType, prices, fastTrackAvailable }
    
    // Clear existing for this park and re-insert
    await ParkPricing.deleteMany({ parkId: req.params.parkId });
    
    if (pricingData && pricingData.length > 0) {
      const toInsert = pricingData.map(p => ({
        parkId: req.params.parkId,
        location: p.location ? p.location.toLowerCase() : null,
        ticketType: p.ticketType,
        prices: p.prices,
        fastTrackAvailable: p.fastTrackAvailable !== undefined ? p.fastTrackAvailable : true
      }));
      await ParkPricing.insertMany(toInsert);
    }
    
    res.json({ message: 'Pricing updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
