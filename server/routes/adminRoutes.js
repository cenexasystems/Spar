const express = require('express');
const router = express.Router();
const { getAdminStats, createPark, updatePark, deletePark } = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

// Admin routes - protected by both 'protect' and 'admin' middleware
router.get('/stats', protect, admin, getAdminStats);
router.post('/parks', protect, admin, createPark);
router.put('/parks/:id', protect, admin, updatePark);
router.delete('/parks/:id', protect, admin, deletePark);

module.exports = router;
