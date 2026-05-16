const User = require('../models/User');
const Booking = require('../models/Booking');
const Park = require('../models/Park');
const Revenue = require('../models/Revenue');

const getAdminStats = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort('-createdAt');
    const bookings = await Booking.find({}).populate('user', 'name email phone').sort('-createdAt');
    const parks = await Park.find({});
    const revenueEntries = await Revenue.find({}).sort('-createdAt');

    // Calculate total revenue from verified/completed bookings + manual entries
    const totalRevenue = revenueEntries.reduce((sum, r) => sum + (r.amount || 0), 0);

    res.json({ users, bookings, parks, revenueEntries, totalRevenue });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Search bookings with advanced filters ──────────────────────────────────
const searchBookings = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.trim().length === 0) {
      const bookings = await Booking.find({}).populate('user', 'name email phone sparId').sort('-createdAt');
      return res.json(bookings);
    }

    const searchTerm = query.trim();
    const regex = new RegExp(searchTerm, 'i');

    // Search by multiple fields
    const bookings = await Booking.find({
      $or: [
        { bookingId: regex },
        { ticketId: regex },
        { userName: regex },
        { userPhone: regex },
        { parkName: regex },
        { transactionId: regex },
      ]
    }).populate('user', 'name email phone sparId').sort('-createdAt');

    // Also search by SPAR ID in users
    const matchingUsers = await User.find({
      $or: [
        { sparId: regex },
        { name: regex },
        { phone: regex },
      ]
    }).select('_id');

    const userIds = matchingUsers.map(u => u._id);
    const userBookings = await Booking.find({
      user: { $in: userIds }
    }).populate('user', 'name email phone sparId').sort('-createdAt');

    // Merge and dedupe
    const allBookings = [...bookings];
    const existingIds = new Set(bookings.map(b => b._id.toString()));
    for (const ub of userBookings) {
      if (!existingIds.has(ub._id.toString())) {
        allBookings.push(ub);
      }
    }

    res.json(allBookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Update booking status (admin verification flow) ───────────────────────
const updateBookingStatus = async (req, res) => {
  const { status, adminNotes } = req.body;
  const validStatuses = ['pending', 'verified', 'completed', 'cancelled'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status. Use: pending, verified, completed, cancelled' });
  }

  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const previousStatus = booking.status;
    booking.status = status;
    if (adminNotes) booking.adminNotes = adminNotes;

    if (status === 'verified' && previousStatus !== 'verified') {
      booking.verifiedAt = new Date();
      
      // Auto-add revenue entry when verifying
      await Revenue.create({
        source: 'booking',
        bookingId: booking.bookingId,
        description: `Booking ${booking.bookingId} verified — ${booking.parkName}`,
        amount: booking.totalAmount,
        parkName: booking.parkName,
        addedBy: req.user.name || 'Admin'
      });
    }

    if (status === 'completed') {
      booking.completedAt = new Date();
    }

    await booking.save();
    
    const updated = await Booking.findById(req.params.id).populate('user', 'name email phone sparId');
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Get single booking with details ───────────────────────────────────────
const getBookingDetails = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('user', 'name email phone sparId avatar');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Revenue: Add manual entry ─────────────────────────────────────────────
const addRevenueEntry = async (req, res) => {
  const { amount, description, parkName } = req.body;
  if (!amount || amount <= 0) {
    return res.status(400).json({ message: 'A positive amount is required.' });
  }

  try {
    const entry = await Revenue.create({
      source: 'manual',
      description: description || 'Manual revenue entry',
      amount,
      parkName: parkName || '',
      addedBy: req.user.name || 'Admin'
    });
    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Revenue: Get all entries ──────────────────────────────────────────────
const getRevenueEntries = async (req, res) => {
  try {
    const entries = await Revenue.find({}).sort('-createdAt');
    const total = entries.reduce((sum, r) => sum + (r.amount || 0), 0);
    res.json({ entries, total });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createPark = async (req, res) => {
  try {
    const park = await Park.create(req.body);
    res.status(201).json(park);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updatePark = async (req, res) => {
  try {
    const park = await Park.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!park) return res.status(404).json({ message: 'Park not found' });
    res.json(park);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deletePark = async (req, res) => {
  try {
    const park = await Park.findByIdAndDelete(req.params.id);
    if (!park) return res.status(404).json({ message: 'Park not found' });
    res.json({ message: 'Park removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
  getAdminStats, 
  searchBookings,
  updateBookingStatus,
  getBookingDetails,
  addRevenueEntry,
  getRevenueEntries,
  createPark, 
  updatePark, 
  deletePark 
};
