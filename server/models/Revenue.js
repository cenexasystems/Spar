const mongoose = require('mongoose');

const revenueSchema = mongoose.Schema(
  {
    entryId: {
      type: String,
      unique: true,
      default: () => 'REV-' + Date.now().toString(36).toUpperCase()
    },
    source: { 
      type: String, 
      enum: ['booking', 'manual'], 
      required: true 
    },
    bookingId: { type: String, default: '' },
    description: { type: String, default: '' },
    amount: { type: Number, required: true },
    parkName: { type: String, default: '' },
    addedBy: { type: String, default: 'system' }  // 'system' or admin name
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Revenue', revenueSchema);
