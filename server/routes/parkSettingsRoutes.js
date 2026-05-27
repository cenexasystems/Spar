const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const ParkCategory = require('../models/ParkCategory');
const ParkPricing = require('../models/ParkPricing');

// ── GET: Active Visitor Categories ──────────────────────────────────────────
router.get('/:parkId/categories', async (req, res) => {
  try {
    const pc = await ParkCategory.findOne({ parkId: req.params.parkId });
    if (!pc) return res.json([]);
    const { all } = req.query;
    if (all === 'true') {
      return res.json(pc.categories);
    }
    const activeCategories = pc.categories.filter(c => c.isActive);
    res.json(activeCategories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── GET: Ticket Pricing ───────────────────────────────────────────────────
router.get('/:parkId/pricing', async (req, res) => {
  try {
    const { location, ticketType, all } = req.query;
    
    if (all === 'true') {
      const pricing = await ParkPricing.find({ parkId: req.params.parkId });
      return res.json(pricing);
    }
    
    let query = { parkId: req.params.parkId };
    
    if (location && location !== 'null' && location !== 'undefined') {
      query.location = location.toLowerCase();
    } else {
      query.location = null;
    }
    
    if (ticketType) {
      query.ticketType = ticketType;
    }

    const pricing = await ParkPricing.find(query);
    // If ticketType was not specified, return all ticket types for this location
    if (pricing.length === 0) {
       return res.json({});
    }

    if (ticketType && pricing.length === 1) {
       // Return single document mapping
       return res.json({ prices: pricing[0].prices, fastTrackAvailable: pricing[0].fastTrackAvailable });
    }
    
    res.json(pricing);
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
