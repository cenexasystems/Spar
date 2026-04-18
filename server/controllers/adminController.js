const User = require('../models/User');
const Booking = require('../models/Booking');
const Park = require('../models/Park');

const getAdminStats = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort('-createdAt');
    const bookings = await Booking.find({}).populate('user', 'name').sort('-createdAt');
    const parks = await Park.find({});

    res.json({ users, bookings, parks });
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

module.exports = { getAdminStats, createPark, updatePark, deletePark };
