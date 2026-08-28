const express = require('express');
const router = express.Router();
const {
  createOrder,
  uploadScreenshot,
  getPaymentProof,
  confirmBooking,
  verifyPayment,
  webhookVerify,
  webhookReceive,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

// POST /api/payment/create-order
router.post('/create-order', protect, createOrder);

// POST /api/payment/upload-screenshot
router.post('/upload-screenshot', protect, uploadScreenshot);

// POST /api/payment/confirm-booking
router.post('/confirm-booking', protect, confirmBooking);

// GET /api/payment/proof/:bookingId (Persistent streaming endpoint)
router.get('/proof/:bookingId', getPaymentProof);

// POST /api/payment/verify (legacy)
router.post('/verify', protect, verifyPayment);

// Webhook endpoints
router.get('/webhook', webhookVerify);
router.post('/webhook', webhookReceive);

module.exports = router;
