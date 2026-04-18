const mongoose = require('mongoose');

const bookingSchema = mongoose.Schema(
  {
    bookingId: { 
      type: String, 
      unique: true,
      default: () => 'BK-' + Math.floor(Math.random() * 9000000 + 1000000)
    },
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    userName: { type: String, default: '' },
    parkName: { type: String, required: true },
    parkId: { type: mongoose.Schema.Types.Mixed },
    adultTickets: { type: Number, default: 0 },
    childTickets: { type: Number, default: 0 },
    tickets: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    paymentMethod: { type: String, required: true },
    status: { type: String, default: 'pending', enum: ['pending', 'confirmed', 'cancelled', 'completed'] },
    transactionId: { type: String, default: '' },
    razorpayOrderId: { type: String, default: '' }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Booking', bookingSchema);
