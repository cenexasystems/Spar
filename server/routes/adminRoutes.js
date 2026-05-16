const express = require('express');
const router = express.Router();
const { 
  getAdminStats, 
  searchBookings,
  updateBookingStatus,
  getBookingDetails,
  addRevenueEntry,
  getRevenueEntries,
  createPark, 
  updatePark, 
  deletePark 
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

// Admin routes - protected by both 'protect' and 'admin' middleware
router.get('/stats', protect, admin, getAdminStats);
router.get('/bookings/search', protect, admin, searchBookings);
router.get('/bookings/:id', protect, admin, getBookingDetails);
router.put('/bookings/:id/status', protect, admin, updateBookingStatus);

// Revenue
router.get('/revenue', protect, admin, getRevenueEntries);
router.post('/revenue', protect, admin, addRevenueEntry);

// Parks
router.post('/parks', protect, admin, createPark);
router.put('/parks/:id', protect, admin, updatePark);
router.delete('/parks/:id', protect, admin, deletePark);

module.exports = router;
