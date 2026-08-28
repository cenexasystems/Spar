require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const adminRoutes = require('./routes/adminRoutes');
const parkRoutes = require('./routes/parkRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const couponRoutes = require('./routes/couponRoutes');
const parkSettingsRoutes = require('./routes/parkSettingsRoutes');
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5174',
  'https://spar-sepia.vercel.app',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow no-origin requests (Postman, curl, server-to-server)
    if (!origin) return callback(null, true);
    // Allow all Vercel preview + production URLs
    if (/^https:\/\/.*\.vercel\.app$/.test(origin)) return callback(null, true);
    // Allow explicitly listed origins
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true
}));

app.use(express.json());

const Booking = require('./models/Booking');

// Serve uploaded files statically with MongoDB fallback for ephemeral cloud environments
const fs = require('fs');
const uploadsDir = path.resolve(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir, {
  maxAge: '1d',
  fallthrough: true
}));

// Fallback for /uploads/:filename if the file was deleted due to cloud restart (e.g. Render)
app.get('/uploads/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const booking = await Booking.findOne({
      $or: [
        { paymentScreenshot: new RegExp(filename, 'i') },
        { paymentScreenshot: `/uploads/${filename}` },
        { paymentScreenshot: `uploads/${filename}` },
        { paymentScreenshot: filename }
      ]
    });
    if (booking) {
      if (booking.paymentScreenshotData && booking.paymentScreenshotData.startsWith('data:')) {
        const parts = booking.paymentScreenshotData.split(',');
        const mimeMatch = parts[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : (booking.paymentScreenshotMime || 'image/jpeg');
        const imgBuffer = Buffer.from(parts[1], 'base64');
        res.set('Content-Type', mime);
        res.set('Cache-Control', 'public, max-age=86400');
        return res.send(imgBuffer);
      }
      if (booking.paymentScreenshot && booking.paymentScreenshot.startsWith('data:')) {
        const parts = booking.paymentScreenshot.split(',');
        const mimeMatch = parts[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : (booking.paymentScreenshotMime || 'image/jpeg');
        const imgBuffer = Buffer.from(parts[1], 'base64');
        res.set('Content-Type', mime);
        res.set('Cache-Control', 'public, max-age=86400');
        return res.send(imgBuffer);
      }
    }
    return res.status(404).send('Payment proof image not found');
  } catch (err) {
    return res.status(404).send('Payment proof image not found');
  }
});


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/parks', parkRoutes);
app.use('/api/parks', parkSettingsRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/coupons', couponRoutes);

app.get('/', (req, res) => {
  res.send('SPAR Amusements API is running...');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
