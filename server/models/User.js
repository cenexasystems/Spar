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
          // Allow empty string (optional field), but if provided must be >= 10 digits
          if (!v || v.trim() === '') return true;
          return /^\+?[\d\s\-().]{10,}$/.test(v);
        },
        message: 'Phone number must be at least 10 digits.'
      }
    },
    avatar: { type: String, default: '' },
    sparCoins: { type: Number, default: 0 },
    isAdmin: { type: Boolean, default: false },
    lastSpunAt: { type: Date },
    dailyGameAttempts: { type: Number, default: 0 },
    lastGamePlayedAt: { type: Date },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);
