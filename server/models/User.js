const mongoose = require('mongoose');

const userSchema = mongoose.Schema(
  {
    sparId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String }, 
    phone: { type: String, default: '' },
    avatar: { type: String, default: '' },
    sparCoins: { type: Number, default: 0 },
    isAdmin: { type: Boolean, default: false },
    lastSpunAt: { type: Date },
    dailyGameAttempts: { type: Number, default: 0 },
    lastGamePlayedAt: { type: Date }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);
