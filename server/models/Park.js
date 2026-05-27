const mongoose = require('mongoose');

const visitorCategorySchema = mongoose.Schema({
  name: { type: String, required: true },
  condition: { type: String, default: '' },
  isFree: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }
}, { _id: true });

const parkSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    location: { type: String, required: true },
    price: { type: Number, required: true },
    adultPrice: { type: Number, default: 0 },
    childPrice: { type: Number, default: 0 },
    seniorPrice: { type: Number, default: 0 },
    studentPrice: { type: Number, default: 0 },
    image: { type: String, required: true },
    desc: { type: String, default: '' },
    rating: { type: Number, default: 4.5 },
    parkPrefix: { type: String, default: 'BK' },
    isActive: { type: Boolean, default: true },
    operatingHours: { type: String, default: '' },
    status: { type: String, default: 'active' },

    // Visitor categories (admin-configurable)
    visitorCategories: {
      type: [visitorCategorySchema],
      default: [
        { name: 'Adults', condition: '>140cm', isFree: false, isActive: true },
        { name: 'Children', condition: '85–140cm', isFree: false, isActive: true },
        { name: 'Senior Citizens', condition: 'Age 60+', isFree: false, isActive: true },
        { name: 'Students', condition: 'Valid ID', isFree: false, isActive: true },
        { name: 'Below 85cm', condition: '<85cm', isFree: true, isActive: true }
      ]
    },

    // Ticket pricing per ticket type (for non-Wonderla parks)
    ticketPricing: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
      // e.g. { "normal": { adult: 1179, child: 825, senior: 900, student: 780 }, "vip": { ... } }
    },

    // Wonderla multi-location pricing
    wonderlaPricing: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
      // e.g. { "chennai": { normal: { adult: 1803, ... }, fasttrack: { adult: 2019, ... }, fastTrackAvailable: true, parkHours: "11AM–7PM", waterHours: "12PM–6PM" }, ... }
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Park', parkSchema);
