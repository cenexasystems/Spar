const mongoose = require('mongoose');

const userSchema = mongoose.Schema(
  {
    sparId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    phone: {
      type: String,
      default: '',
      validate: {
        validator: function (v) {
          if (!v || v.trim() === '') return true;
          const clean = v.replace(/\s+/g, '');
          return /^(?:\+91|91|0)?[6-9]\d{9}$/.test(clean);
        },
        message: 'Please enter a valid 10-digit Indian phone number.'
      }
    },
    avatar: { type: String, default: '' },
    sparCoins: { type: Number, default: 0 },
    isAdmin: { type: Boolean, default: false },
    lastSpunAt: { type: Date },
    dailySpinCount: { type: Number, default: 0 },
    dailyGameAttempts: { type: Number, default: 0 },
    lastGamePlayedAt: { type: Date },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    emailVerificationToken: { type: String },
    isEmailVerified: { type: Boolean, default: false }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);
