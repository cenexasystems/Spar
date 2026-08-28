const User = require('../models/User');
const Booking = require('../models/Booking');
const Park = require('../models/Park');
const Revenue = require('../models/Revenue');
const Coupon = require('../models/Coupon');
const PlatformSettings = require('../models/PlatformSettings');
const { parseEndOfDayExpiry, formatCouponDate, formatCouponDateNumeric, computeCouponStatus } = require('../utils/couponUtils');

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
  const validStatuses = ['pending', 'verified', 'completed', 'cancelled', 'rejected', 'ticketsent'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status. Use: pending, verified, completed, cancelled, rejected, ticketsent' });
  }

  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const previousStatus = booking.status;
    booking.status = status;
    if (adminNotes) booking.adminNotes = adminNotes;

    if (status === 'verified' && previousStatus !== 'verified') {
      booking.verifiedAt = new Date();

      // Auto-add revenue entry when verifying — wrapped so booking save never fails if this errors
      try {
        // Guard: skip if a revenue entry already exists for this booking
        const existing = await Revenue.findOne({ bookingId: booking.bookingId, source: 'booking' });
        if (!existing) {
          await Revenue.create({
            source: 'booking',
            bookingId: booking.bookingId,
            description: `Booking ${booking.bookingId} verified — ${booking.parkName}`,
            amount: booking.totalAmount,
            parkName: booking.parkName,
            addedBy: req.user?.name || 'Admin'
          });
        }
      } catch (revErr) {
        console.error('[Revenue] Failed to create revenue entry for booking', booking.bookingId, revErr.message);
        // Do NOT re-throw — booking status must still be saved
      }
    }

    if (status === 'rejected' && previousStatus !== 'rejected') {
      if (booking.couponApplied && booking.couponProcessed) {
        const coupon = await Coupon.findOne({ code: booking.couponApplied.toUpperCase() });
        if (coupon) {
          // Decrement both the new and legacy usage counters
          coupon.totalUsageCount = Math.max(0, (coupon.totalUsageCount || 0) - 1);
          coupon.usedCount = coupon.totalUsageCount;
          // Reactivate if it was exhausted and total limit allows it
          const totalLimit = coupon.isUnlimitedTotal ? Infinity : (coupon.totalUsageLimit || Infinity);
          if (coupon.totalUsageCount < totalLimit) {
            coupon.isActive = true;
          }
          await coupon.save();
        }
        booking.couponProcessed = false;
      }
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
    // Ensure required fields have defaults so fallback parks can be persisted cleanly
    const parkData = {
      image: '/wonderla_final.jpg', // safe default
      ...req.body,
    };
    const park = await Park.create(parkData);
    res.status(201).json(park);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updatePark = async (req, res) => {
  try {
    const park = await Park.findById(req.params.id);
    if (!park) return res.status(404).json({ message: 'Park not found' });

    // Apply all fields from the request body
    const { ticketPricing, wonderlaPricing, ...otherFields } = req.body;

    // Assign scalar/array fields
    Object.assign(park, otherFields);

    // Handle Mixed-type fields explicitly — Mongoose requires markModified()
    // for these types to detect changes and persist them.
    if (ticketPricing !== undefined) {
      park.ticketPricing = ticketPricing;
      park.markModified('ticketPricing');
    }
    if (wonderlaPricing !== undefined) {
      park.wonderlaPricing = wonderlaPricing;
      park.markModified('wonderlaPricing');
    }

    await park.save();
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

const createCoupon = async (req, res) => {
  try {
    const { 
      code, 
      discountType, 
      discountValue, 
      expiryDate, 
      applicablePark, 
      parkId, 
      applicableBranches,
      unlimitedTotal,
      isUnlimitedTotal,
      totalUsageLimitEnabled,
      totalUsageLimit,
      unlimitedDaily,
      isUnlimitedDaily,
      dailyUsageLimitEnabled,
      dailyUsageLimit,
      isActive 
    } = req.body;

    if (!code || !code.trim()) return res.status(400).json({ message: 'Coupon code is required' });
    if (!expiryDate) return res.status(400).json({ message: 'Expiry date is required' });

    // Validate coupon value
    const numericValue = Number(discountValue);
    if (isNaN(numericValue) || numericValue <= 0) {
      return res.status(400).json({ message: 'Discount value must be greater than 0' });
    }
    if (discountType === 'percentage' && (numericValue < 1 || numericValue > 100)) {
      return res.status(400).json({ message: 'Discount percentage must be between 1% and 100%' });
    }

    // Validate total usage limit
    const isUnlimTotal = unlimitedTotal === true || unlimitedTotal === 'true' || isUnlimitedTotal === true || isUnlimitedTotal === 'true' || totalUsageLimitEnabled === false || totalUsageLimitEnabled === 'false';
    let validatedTotalLimit = null;
    if (!isUnlimTotal) {
      const parsedTotal = parseInt(totalUsageLimit, 10);
      if (isNaN(parsedTotal) || parsedTotal <= 0) {
        return res.status(400).json({ message: 'Total usage limit must be a positive integer greater than 0' });
      }
      validatedTotalLimit = parsedTotal;
    }

    // Validate daily usage limit
    const isUnlimDaily = unlimitedDaily === true || unlimitedDaily === 'true' || isUnlimitedDaily === true || isUnlimitedDaily === 'true' || dailyUsageLimitEnabled === false || dailyUsageLimitEnabled === 'false' || (unlimitedDaily === undefined && isUnlimitedDaily === undefined && dailyUsageLimitEnabled === undefined);
    let validatedDailyLimit = null;
    if (!isUnlimDaily) {
      const parsedDaily = parseInt(dailyUsageLimit, 10);
      if (isNaN(parsedDaily) || parsedDaily <= 0) {
        return res.status(400).json({ message: 'Daily usage limit must be a positive integer greater than 0' });
      }
      validatedDailyLimit = parsedDaily;
    }

    // Daily limit cannot exceed total limit when both are limited
    if (!isUnlimTotal && !isUnlimDaily && validatedTotalLimit && validatedDailyLimit) {
      if (validatedDailyLimit > validatedTotalLimit) {
        return res.status(400).json({ message: 'Daily usage limit cannot exceed total usage limit' });
      }
    }

    const existing = await Coupon.findOne({ code: code.trim().toUpperCase() });
    if (existing) return res.status(400).json({ message: 'Coupon code already exists' });

    // Enforce park-level isolation:
    const parkName = (applicablePark || parkId || '').trim();
    if (!parkName || parkName.toLowerCase() === 'all') {
      return res.status(400).json({ message: 'A specific park must be specified for this coupon. Global coupons are not supported.' });
    }

    // Standardize expiry date: convert YYYY-MM-DD to end-of-day UTC Date object
    const normalizedExpiry = parseEndOfDayExpiry(expiryDate);
    if (normalizedExpiry.getTime() <= Date.now()) {
      return res.status(400).json({ message: 'Expiry date must be in the future' });
    }

    // Parse applicable branches
    let branchList = ['all'];
    if (Array.isArray(applicableBranches) && applicableBranches.length > 0) {
      branchList = applicableBranches;
    } else if (typeof applicableBranches === 'string' && applicableBranches.trim() && applicableBranches !== 'all') {
      branchList = [applicableBranches.trim()];
    }

    const couponData = {
      code: code.trim().toUpperCase(),
      discountType: discountType || 'percentage',
      discountValue: numericValue,
      expiryDate: normalizedExpiry,
      applicablePark: parkName,
      parkId: parkName,
      applicableBranches: branchList,
      unlimitedTotal: isUnlimTotal,
      isUnlimitedTotal: isUnlimTotal,
      totalUsageLimitEnabled: !isUnlimTotal,
      totalUsageLimit: validatedTotalLimit,
      usageLimit: validatedTotalLimit,
      unlimitedDaily: isUnlimDaily,
      isUnlimitedDaily: isUnlimDaily,
      dailyUsageLimitEnabled: !isUnlimDaily,
      dailyUsageLimit: validatedDailyLimit,
      totalUsageCount: 0,
      usedCount: 0,
      dailyUsageCount: 0,
      dailyUsageDate: '',
      isActive: isActive !== false
    };

    const coupon = await Coupon.create(couponData);
    
    // Return with formatted dates and computed status
    const computed = computeCouponStatus(coupon);
    res.status(201).json({
      ...coupon.toObject(),
      computedStatus: computed.status,
      statusLabel: computed.label,
      expiryDateFormatted: formatCouponDate(coupon.expiryDate)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCoupons = async (req, res) => {
  try {
    const { parkId } = req.params;
    let query = {};
    if (parkId && parkId !== 'all') {
      // Strict park isolation: only return coupons explicitly for this park.
      query.$or = [
        { parkId: new RegExp(`^${parkId.trim()}$`, 'i') },
        { applicablePark: new RegExp(`^${parkId.trim()}$`, 'i') }
      ];
    }
    const coupons = await Coupon.find(query).sort('-createdAt');
    
    // Dynamically calculate status for each coupon so frontend and API always see real-time state
    const enrichedCoupons = coupons.map(c => {
      const computed = computeCouponStatus(c);
      return {
        ...c.toObject(),
        computedStatus: computed.status,
        statusLabel: computed.label,
        expiryDateFormatted: formatCouponDate(c.expiryDate),
        applicableBranches: (c.applicableBranches && c.applicableBranches.length > 0) ? c.applicableBranches : ['all']
      };
    });

    res.json(enrichedCoupons);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const toggleCouponStatus = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
    
    coupon.isActive = !coupon.isActive;
    await coupon.save();
    
    const computed = computeCouponStatus(coupon);
    res.json({
      ...coupon.toObject(),
      computedStatus: computed.status,
      statusLabel: computed.label,
      expiryDateFormatted: formatCouponDate(coupon.expiryDate)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
    res.json({ message: 'Coupon removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCouponUsage = async (req, res) => {
  try {
    const { code } = req.params;
    const bookings = await Booking.find({ couponApplied: code.toUpperCase() }).populate('user', 'name');
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// NEW: Visitor Categories per park
// ═══════════════════════════════════════════════════════════════════════════
const updateVisitorCategories = async (req, res) => {
  try {
    const { categories } = req.body;
    const park = await Park.findById(req.params.id);
    if (!park) return res.status(404).json({ message: 'Park not found' });
    park.visitorCategories = categories;
    await park.save();
    res.json({ message: 'Visitor categories updated', park });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// NEW: Ticket Pricing per park
// ═══════════════════════════════════════════════════════════════════════════
const updateTicketPricing = async (req, res) => {
  try {
    const { ticketPricing, wonderlaPricing } = req.body;
    const park = await Park.findById(req.params.id);
    if (!park) return res.status(404).json({ message: 'Park not found' });

    if (ticketPricing !== undefined) {
      park.ticketPricing = ticketPricing;
      // IMPORTANT: Mongoose does not auto-detect mutations in Mixed type fields.
      // markModified() is required to ensure the change is persisted to MongoDB.
      park.markModified('ticketPricing');

      // Also sync flat price fields from the normal tier so the booking system
      // and park card UI always reflect current pricing without needing ticketPricing lookup.
      const normal = ticketPricing?.normal || {};
      if (normal.adult  !== undefined) park.price       = Number(normal.adult)  || park.price;
      if (normal.adult  !== undefined) park.adultPrice  = Number(normal.adult)  || 0;
      if (normal.child  !== undefined) park.childPrice  = Number(normal.child)  || 0;
      if (normal.senior !== undefined) park.seniorPrice = Number(normal.senior) || 0;
      if (normal.student !== undefined) park.studentPrice = Number(normal.student) || 0;
    }

    if (wonderlaPricing !== undefined) {
      park.wonderlaPricing = wonderlaPricing;
      // IMPORTANT: markModified() required for Mixed type
      park.markModified('wonderlaPricing');
    }

    await park.save();
    res.json({ message: 'Pricing updated', park });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// NEW: Platform Settings (convenience fee, etc.)
// ═══════════════════════════════════════════════════════════════════════════
const getPlatformSettings = async (req, res) => {
  try {
    let settings = await PlatformSettings.findOne({});
    if (!settings) {
      settings = await PlatformSettings.create({ convenienceFee: 49, convenienceFeeEnabled: true });
    }
    res.json({ convenienceFee: { amount: settings.convenienceFee, enabled: settings.convenienceFeeEnabled } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updatePlatformSettings = async (req, res) => {
  try {
    const { convenienceFee } = req.body; // Expecting { amount, enabled }
    if (convenienceFee !== undefined) {
      let settings = await PlatformSettings.findOne({});
      if (!settings) {
        settings = new PlatformSettings();
      }
      if (convenienceFee.amount !== undefined) settings.convenienceFee = Number(convenienceFee.amount);
      if (convenienceFee.enabled !== undefined) settings.convenienceFeeEnabled = Boolean(convenienceFee.enabled);
      await settings.save();
    }
    res.json({ message: 'Platform settings saved' });
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
  deletePark,
  createCoupon,
  getCoupons,
  toggleCouponStatus,
  deleteCoupon,
  getCouponUsage,
  updateVisitorCategories,
  updateTicketPricing,
  getPlatformSettings,
  updatePlatformSettings
};
