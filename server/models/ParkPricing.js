const mongoose = require('mongoose');

const parkPricingSchema = new mongoose.Schema({
  parkId: {
    type: String, // String representation of the park name or ID
    required: true,
  },
  location: {
    type: String, // e.g. "chennai", "bengaluru" (null for single location parks)
    default: null
  },
  ticketType: {
    type: String, // e.g. "normal", "fasttrack", "doublefun"
    required: true,
  },
  prices: {
    type: Map,
    of: Number, // Maps categoryId to price
    default: {}
  },
  fastTrackAvailable: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('ParkPricing', parkPricingSchema);
