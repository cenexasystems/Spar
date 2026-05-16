const Booking = require('../models/Booking');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');

// ─────────────────────────────────────────────────────────────────────────────
// Multer config for payment screenshot uploads
// ─────────────────────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `payment_${Date.now()}_${Math.floor(Math.random() * 10000)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('Only image files (JPG, PNG, WebP) are allowed'));
  }
}).single('paymentScreenshot');

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Send WhatsApp message via Meta Cloud API
// ─────────────────────────────────────────────────────────────────────────────
const sendWhatsApp = async (phone, message) => {
  const token = process.env.META_WHATSAPP_TOKEN;
  const phoneNumberId = process.env.META_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    console.log('[WhatsApp] Meta credentials not configured – skipping.');
    return;
  }

  const to = phone.startsWith('+')
    ? phone.replace('+', '')
    : `91${phone}`;

  try {
    const response = await fetch(
      `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { body: message },
        }),
      }
    );

    const result = await response.json();
    if (!response.ok) {
      console.error('[WhatsApp] Meta API error:', JSON.stringify(result));
    } else {
      console.log(`[WhatsApp] Message sent to ${to}, id: ${result.messages?.[0]?.id}`);
    }
  } catch (err) {
    console.error('[WhatsApp] Fetch failed:', err.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payment/create-order
// Creates a PENDING booking. The frontend shows the real GPay QR image.
// ─────────────────────────────────────────────────────────────────────────────
const createOrder = async (req, res) => {
  const {
    parkName,
    parkId,
    tickets,
    adultTickets,
    childTickets,
    totalAmount,
    paymentMethod,
    parkPrefix,
    wonderlaLocation,
    visitDate,
    userEmail,
    userPhone,
  } = req.body;

  if (!parkName || !totalAmount || totalAmount <= 0) {
    return res
      .status(400)
      .json({ message: 'parkName and a positive totalAmount are required.' });
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const bkPrefix = parkPrefix || 'BK';
    const bkId = bkPrefix + '-' + Math.floor(Math.random() * 9000 + 1000);

    const booking = await Booking.create({
      bookingId: bkId,
      user: req.user._id,
      userName: user.name,
      userEmail: userEmail || user.email || '',
      userPhone: userPhone || user.phone || '',
      parkName,
      parkId,
      wonderlaLocation: wonderlaLocation || '',
      visitDate: visitDate || null,
      tickets: tickets || (adultTickets || 0) + (childTickets || 0),
      adultTickets: adultTickets || 0,
      childTickets: childTickets || 0,
      totalAmount,
      paymentMethod: paymentMethod || 'gpay',
      status: 'pending',
      transactionId: '',
    });

    const upiId = process.env.UPI_ID || 'yourupiid@okaxis';
    const merchantName = process.env.MERCHANT_NAME || 'SPAR Amusements';

    // Build UPI deep link for mobile
    const upiString =
      `upi://pay?pa=${encodeURIComponent(upiId)}` +
      `&pn=${encodeURIComponent(merchantName)}` +
      `&am=${parseFloat(totalAmount).toFixed(2)}` +
      `&cu=INR` +
      `&tn=${encodeURIComponent('Booking ' + bkId)}`;

    return res.status(201).json({
      bookingId: bkId,
      mongoBookingId: booking._id,
      ticketId: booking.ticketId,
      amount: totalAmount,
      upiId,
      merchantName,
      upiString,
    });
  } catch (error) {
    console.error('[createOrder]', error);
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payment/upload-screenshot
// User uploads payment screenshot after paying via GPay
// ─────────────────────────────────────────────────────────────────────────────
const uploadScreenshot = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || 'Upload failed' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { mongoBookingId } = req.body;
    if (!mongoBookingId) {
      return res.status(400).json({ message: 'mongoBookingId is required' });
    }

    try {
      const booking = await Booking.findById(mongoBookingId);
      if (!booking) return res.status(404).json({ message: 'Booking not found' });

      booking.paymentScreenshot = `/uploads/${req.file.filename}`;
      await booking.save();

      return res.json({
        message: 'Screenshot uploaded successfully',
        screenshotPath: booking.paymentScreenshot,
        booking
      });
    } catch (error) {
      console.error('[uploadScreenshot]', error);
      return res.status(500).json({ message: error.message });
    }
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payment/confirm-booking
// User confirms they have paid and uploaded screenshot
// Booking stays in "pending" status until admin verifies
// ─────────────────────────────────────────────────────────────────────────────
const confirmBooking = async (req, res) => {
  const { mongoBookingId, bookingId } = req.body;

  if (!mongoBookingId) {
    return res.status(400).json({ message: 'mongoBookingId is required.' });
  }

  try {
    const booking = await Booking.findById(mongoBookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });

    // Booking stays pending — admin will verify after checking screenshot
    // Just mark that user has completed the payment flow
    if (!booking.paymentScreenshot) {
      return res.status(400).json({ message: 'Please upload your payment screenshot first.' });
    }

    // Send WhatsApp notification
    const user = await User.findById(booking.user);
    if (user?.phone) {
      const msg =
        `🎫 *Booking Submitted!*\n\n` +
        `Hello ${booking.userName},\n\n` +
        `Your booking at *${booking.parkName}* has been submitted for verification.\n\n` +
        `📋 *Booking ID:* ${booking.bookingId}\n` +
        `🎟️ *Ticket ID:* ${booking.ticketId}\n` +
        `🎟️ *Tickets:* ${booking.adultTickets} Adult(s)` +
        (booking.childTickets > 0 ? `, ${booking.childTickets} Kid(s)` : '') +
        `\n💰 *Amount:* ₹${booking.totalAmount}\n` +
        (booking.wonderlaLocation ? `📍 *Location:* ${booking.wonderlaLocation}\n` : '') +
        (booking.visitDate ? `📅 *Visit Date:* ${new Date(booking.visitDate).toLocaleDateString('en-IN')}\n` : '') +
        `\n⏳ Your payment is being verified by our team. You'll receive a confirmation shortly.\n\n` +
        `— SPAR Amusements`;

      await sendWhatsApp(user.phone, msg);
    }

    return res.json({
      message: 'Booking submitted for verification! You will be notified once verified.',
      booking,
    });
  } catch (error) {
    console.error('[confirmBooking]', error);
    return res.status(500).json({ message: error.message });
  }
};

// ── Legacy verify endpoint (kept for backwards compatibility) ──────────────
const verifyPayment = async (req, res) => {
  const { mongoBookingId, utrNumber } = req.body;

  if (!mongoBookingId) {
    return res.status(400).json({ message: 'mongoBookingId is required.' });
  }

  try {
    const existing = await Booking.findById(mongoBookingId);
    if (!existing) return res.status(404).json({ message: 'Booking not found.' });

    if (utrNumber) {
      existing.transactionId = utrNumber.trim().toUpperCase();
    }
    await existing.save();

    return res.json({ message: 'Payment info recorded.', booking: existing });
  } catch (error) {
    console.error('[verifyPayment]', error);
    return res.status(500).json({ message: error.message });
  }
};

// ── Webhook endpoints ─────────────────────────────────────────────────────
const webhookVerify = (req, res) => {
  const verify_token = process.env.META_WEBHOOK_VERIFY_TOKEN;
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === verify_token) {
    console.log('[Meta Webhook] Verified successfully');
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
};

const webhookReceive = async (req, res) => {
  res.sendStatus(200);

  try {
    const body = req.body;
    if (body.object !== 'whatsapp_business_account') return;

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages;

    if (!messages || messages.length === 0) return;

    const incomingMsg = messages[0];
    const fromPhone = incomingMsg.from;
    const text = incomingMsg.text?.body || '';

    console.log(`[Meta Webhook] Message from ${fromPhone}: ${text}`);
  } catch (err) {
    console.error('[Meta Webhook] Processing error:', err.message);
  }
};

module.exports = { createOrder, uploadScreenshot, confirmBooking, verifyPayment, webhookVerify, webhookReceive };
