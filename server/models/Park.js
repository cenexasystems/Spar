const mongoose = require('mongoose');

const parkSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    location: { type: String, required: true },
    price: { type: Number, required: true },
    adultPrice: { type: Number, default: 0 },
    childPrice: { type: Number, default: 0 },
    image: { type: String, required: true },
    desc: { type: String, default: '' },
    rating: { type: Number, default: 4.5 },
    tickets_available: { type: Number, default: 100 },
    parkPrefix: { type: String, default: 'BK' },
    isActive: { type: Boolean, default: true }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Park', parkSchema);
