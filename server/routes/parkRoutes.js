const express = require('express');
const router = express.Router();
const Park = require('../models/Park');
const PlatformSettings = require('../models/PlatformSettings');

// Get all active parks - Public
router.get('/', async (req, res) => {
  try {
    const parks = await Park.find({ isActive: true });
    res.json(parks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get platform settings (convenience fee) - Public
router.get('/platform-settings', async (req, res) => {
  try {
    let settings = await PlatformSettings.findOne({});
    if (!settings) {
      settings = await PlatformSettings.create({ convenienceFee: 49, convenienceFeeEnabled: true });
    }
    res.json({ convenienceFee: { amount: settings.convenienceFee, enabled: settings.convenienceFeeEnabled } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single park - Public
router.get('/:id', async (req, res) => {
  try {
    const park = await Park.findById(req.params.id);
    if (park) {
      res.json(park);
    } else {
      res.status(404).json({ message: 'Park not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
