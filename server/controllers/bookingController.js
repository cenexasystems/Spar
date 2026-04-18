const Booking = require('../models/Booking');
const User = require('../models/User');

const addBooking = async (req, res) => {
  const { parkName, parkId, tickets, adultTickets, childTickets, totalAmount, paymentMethod, parkPrefix } = req.body;

  // Input validation
  if (!parkName || !totalAmount || !paymentMethod) {
    return res.status(400).json({ message: 'parkName, totalAmount, and paymentMethod are required.' });
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const bkPrefix = parkPrefix || 'BK';
    const bkId = bkPrefix + '-' + Math.floor(Math.random() * 9000 + 1000);

    const booking = new Booking({
      bookingId: bkId,
      user: req.user._id,
      userName: user.name,
      parkName,
      parkId,
      tickets: tickets || ((adultTickets || 0) + (childTickets || 0)),
      adultTickets: adultTickets || 0,
      childTickets: childTickets || 0,
      totalAmount,
      paymentMethod,
      status: 'pending',   // always starts pending; payment flow confirms it
      transactionId: '',
    });

    const createdBooking = await booking.save();
    res.status(201).json(createdBooking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { addBooking, getMyBookings };
