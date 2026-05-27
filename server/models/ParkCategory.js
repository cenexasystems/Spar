const mongoose = require('mongoose');

const parkCategorySchema = new mongoose.Schema({
  parkId: {
    type: String, // String representation of the park name or ID
    required: true,
  },
  categories: [
    {
      id: { type: String, required: true },
      name: { type: String, required: true },
      condition: { type: String, default: '' },
      isFree: { type: Boolean, default: false },
      isActive: { type: Boolean, default: true },
      order: { type: Number, default: 0 }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('ParkCategory', parkCategorySchema);
