const express = require('express');
const router = express.Router();
const { addBooking, getMyBookings } = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').post(protect, addBooking).get(protect, getMyBookings);

module.exports = router;
