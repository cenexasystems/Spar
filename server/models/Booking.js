const mongoose = require('mongoose');

const bookingSchema = mongoose.Schema(
  {
    bookingId: { 
      type: String, 
      unique: true,
      default: () => 'BK-' + Math.floor(Math.random() * 9000000 + 1000000)
    },
    ticketId: {
      type: String,
      unique: true,
      default: () => 'TKT-' + Date.now().toString(36).toUpperCase() + Math.floor(Math.random() * 900 + 100)
    },
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    userName: { type: String, default: '' },
    userEmail: { type: String, default: '' },
    userPhone: { type: String, default: '' },
    parkName: { type: String, required: true },
    parkId: { type: mongoose.Schema.Types.Mixed },
    wonderlaLocation: { type: String, default: '' },  // Only for Wonderla bookings
    visitDate: { type: Date },
    adultTickets: { type: Number, default: 0 },
    childTickets: { type: Number, default: 0 },
    tickets: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    paymentMethod: { type: String, required: true },
    status: { 
      type: String, 
      default: 'pending', 
      enum: ['pending', 'verified', 'completed', 'cancelled'] 
    },
    transactionId: { type: String, default: '' },
    paymentScreenshot: { type: String, default: '' },  // Path to uploaded screenshot
    adminNotes: { type: String, default: '' },
    verifiedAt: { type: Date },
    completedAt: { type: Date }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Booking', bookingSchema);
