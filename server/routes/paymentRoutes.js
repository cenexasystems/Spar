const express = require('express');
const router = express.Router();
const {
  createOrder,
  verifyPayment,
  webhookVerify,
  webhookReceive,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

// POST /api/payment/create-order
// Requires auth — creates a pending booking + UPI QR code (GPay compatible)
router.post('/create-order', protect, createOrder);

// POST /api/payment/verify
// Requires auth — user submits their GPay UTR/Transaction Ref to confirm booking
// Backend updates status to 'confirmed' and sends WhatsApp via Meta Cloud API
router.post('/verify', protect, verifyPayment);

// GET /api/payment/webhook
// Meta webhook verification — called once during Meta App setup
router.get('/webhook', webhookVerify);

// POST /api/payment/webhook
// Meta WhatsApp Cloud API incoming messages (optional auto-reply handler)
router.post('/webhook', webhookReceive);

module.exports = router;
