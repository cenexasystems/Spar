const crypto = require('crypto');
const QRCode = require('qrcode');
const Booking = require('../models/Booking');
const User = require('../models/User');

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Send WhatsApp message via Meta Cloud API
// Docs: https://developers.facebook.com/docs/whatsapp/cloud-api/messages
// ─────────────────────────────────────────────────────────────────────────────
const sendWhatsApp = async (phone, message) => {
  const token = process.env.META_WHATSAPP_TOKEN;
  const phoneNumberId = process.env.META_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    console.log('[WhatsApp] Meta credentials not configured – skipping.');
    return;
  }

  // Phone in E.164 format without the '+', e.g. 919876543210
  const to = phone.startsWith('+')
    ? phone.replace('+', '')
    : `91${phone}`;   // default to India +91 if no country code

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
    // Never fail the booking if WhatsApp fails
    console.error('[WhatsApp] Fetch failed:', err.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payment/create-order
//
// 1. Creates a PENDING booking in MongoDB
// 2. Generates a UPI deep-link QR that opens Google Pay / PhonePe / Paytm
//    when scanned. The user pays directly to your UPI ID.
// 3. Returns the QR (base64 PNG) + booking info to the frontend.
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
  } = req.body;

  if (!parkName || !totalAmount || totalAmount <= 0) {
    return res
      .status(400)
      .json({ message: 'parkName and a positive totalAmount are required.' });
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // ── 1. Create PENDING booking ──────────────────────────────────────────
    const bkPrefix = parkPrefix || 'BK';
    const bkId = bkPrefix + '-' + Math.floor(Math.random() * 9000 + 1000);

    const booking = await Booking.create({
      bookingId: bkId,
      user: req.user._id,
      userName: user.name,
      parkName,
      parkId,
      tickets: tickets || (adultTickets || 0) + (childTickets || 0),
      adultTickets: adultTickets || 0,
      childTickets: childTickets || 0,
      totalAmount,
      paymentMethod: paymentMethod || 'gpay',
      status: 'pending',
      transactionId: '',
    });

    // ── 2. Build UPI deep-link QR ──────────────────────────────────────────
    // This format is accepted by Google Pay, PhonePe, Paytm, BHIM, Paytm etc.
    const upiId = process.env.UPI_ID;
    if (!upiId) {
      return res.status(500).json({ message: 'UPI_ID is not configured on the server.' });
    }

    const merchantName = process.env.MERCHANT_NAME || 'SPAR Amusements';
    const upiString =
      `upi://pay?pa=${encodeURIComponent(upiId)}` +
      `&pn=${encodeURIComponent(merchantName)}` +
      `&am=${parseFloat(totalAmount).toFixed(2)}` +
      `&cu=INR` +
      `&tn=${encodeURIComponent('Booking ' + bkId)}`;

    const qrCodeDataUrl = await QRCode.toDataURL(upiString, {
      errorCorrectionLevel: 'H',
      width: 320,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    return res.status(201).json({
      bookingId: bkId,
      mongoBookingId: booking._id,
      amount: totalAmount,
      upiId,
      merchantName,
      qrCodeDataUrl,   // <img src={qrCodeDataUrl} /> — ready to display
      upiString,       // for intent-based launch on mobile: window.location.href = upiString
    });
  } catch (error) {
    console.error('[createOrder]', error);
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payment/verify
//
// Called by the frontend AFTER the user has paid via GPay and enters their
// UPI Transaction Reference Number (UTR / Transaction ID shown in GPay receipt).
//
// Since GPay has no server-to-server callback, we:
//   1. Accept the UTR the user submits
//   2. Mark the booking confirmed
//   3. Send WhatsApp confirmation via Meta Cloud API
//
// IMPORTANT: For production, you (the admin) should cross-check the UTR in
// your bank/UPI statement. The admin panel shows all bookings + their UTR.
// ─────────────────────────────────────────────────────────────────────────────
const verifyPayment = async (req, res) => {
  const {
    mongoBookingId,   // MongoDB _id of the booking
    bookingId,        // human-readable booking ID e.g. "SPR-1234"
    utrNumber,        // UPI Transaction Reference entered by user
  } = req.body;

  if (!mongoBookingId || !utrNumber) {
    return res
      .status(400)
      .json({ message: 'mongoBookingId and utrNumber are required.' });
  }

  // Basic UTR format check: 12-digit numeric (standard UPI UTR)
  const utrRegex = /^\d{12}$|^[A-Za-z0-9]{10,22}$/;
  if (!utrRegex.test(utrNumber.trim())) {
    return res
      .status(400)
      .json({ message: 'Invalid UTR format. Check your GPay receipt for the 12-digit reference number.' });
  }

  try {
    // Prevent duplicate confirmation
    const existing = await Booking.findById(mongoBookingId);
    if (!existing) return res.status(404).json({ message: 'Booking not found.' });
    if (existing.status === 'confirmed') {
      return res.json({ message: 'Booking already confirmed.', booking: existing });
    }

    // ── Update booking ─────────────────────────────────────────────────────
    const booking = await Booking.findByIdAndUpdate(
      mongoBookingId,
      {
        status: 'confirmed',
        transactionId: utrNumber.trim().toUpperCase(),
      },
      { new: true }
    );

    // ── Send WhatsApp via Meta Cloud API ───────────────────────────────────
    const user = await User.findById(booking.user);
    if (user?.phone) {
      const msg =
        `🎉 *Booking Confirmed!*\n\n` +
        `Hello ${booking.userName},\n\n` +
        `Your booking at *${booking.parkName}* is confirmed.\n\n` +
        `📋 *Booking ID:* ${booking.bookingId}\n` +
        `💳 *UPI Ref (UTR):* ${utrNumber.trim().toUpperCase()}\n` +
        `🎟️ *Tickets:* ${booking.adultTickets} Adult(s)` +
        (booking.childTickets > 0 ? `, ${booking.childTickets} Kid(s)` : '') +
        `\n💰 *Amount Paid:* ₹${booking.totalAmount}\n\n` +
        `📲 Show this message at the entrance. Enjoy your visit! 🚀\n\n` +
        `— SPAR Amusements`;

      await sendWhatsApp(user.phone, msg);
    }

    return res.json({
      message: 'Payment confirmed! Booking is now active.',
      booking,
    });
  } catch (error) {
    console.error('[verifyPayment]', error);
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payment/webhook
// Meta WhatsApp Cloud API webhook — receives incoming messages from users
// Also used as the verification endpoint (GET) during Meta app setup
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/payment/webhook  — Meta webhook verification (one-time setup)
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

// POST /api/payment/webhook — receives WhatsApp messages (optional: for auto-replies)
const webhookReceive = async (req, res) => {
  // Always respond 200 immediately to Meta
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
    const fromPhone = incomingMsg.from;   // sender's phone number
    const text = incomingMsg.text?.body || '';

    console.log(`[Meta Webhook] Message from ${fromPhone}: ${text}`);
    // You can add auto-reply logic here if needed
  } catch (err) {
    console.error('[Meta Webhook] Processing error:', err.message);
  }
};

module.exports = { createOrder, verifyPayment, webhookVerify, webhookReceive };
