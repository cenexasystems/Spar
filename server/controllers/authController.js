const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Brevo = require('@getbrevo/brevo');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const generateSparId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'SPAR';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const registerUser = async (req, res) => {
  const { name, email, phone, password, avatar } = req.body;

  try {
    // Phone validation: must be a valid 10-digit Indian phone number
    if (phone) {
      const clean = phone.replace(/\s+/g, '');
      const indianPhoneRegex = /^(?:\+91|91|0)?[6-9]\d{9}$/;
      if (!indianPhoneRegex.test(clean)) {
        return res.status(400).json({ message: 'Please enter a valid 10-digit Indian phone number (starting with 6-9, optional +91 prefix).' });
      }
    }

    // Password strength: minimum 6 characters
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Account exists! Switch to LOGIN to enter.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    const user = await User.create({
      sparId: generateSparId(),
      name,
      email,
      phone: phone || '',
      password: hashedPassword,
      avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
      emailVerificationToken: hashedToken,
      isEmailVerified: false
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verifyUrl = `${frontendUrl}?verifyToken=${rawToken}`;

    if (!process.env.BREVO_API_KEY) {
      console.error('BREVO_API_KEY not set in environment variables.');
      return res.status(500).json({ message: 'Email service not configured. Contact support.' });
    }

    const emailResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: 'SPAR Amusements', email: process.env.BREVO_SENDER_EMAIL || 'cenexasystems@gmail.com' },
        to: [{ email: user.email, name: user.name }],
        subject: '🎡 SPAR — Verify Your Email',
        htmlContent: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0f172a;color:#fff;border-radius:16px;padding:32px;">
            <h2 style="font-size:2rem;background:linear-gradient(90deg,#BF00FF,#00D1FF);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">SPAR AMUSEMENTS</h2>
            <h3 style="color:#C7FF00;margin-bottom:8px;">Welcome to the Crew!</h3>
            <p style="color:#94A3B8;">Hi <strong style="color:#fff">${user.name}</strong>, please verify your email address to secure your account.</p>
            <a href="${verifyUrl}" style="display:inline-block;margin:24px 0;padding:14px 32px;background:linear-gradient(135deg,#BF00FF,#00D1FF);color:#fff;font-weight:800;text-decoration:none;border-radius:12px;font-size:1rem;">VERIFY EMAIL</a>
          </div>
        `
      })
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error('Brevo email API error:', errorData);
      return res.status(500).json({ message: 'Failed to send verification email. Please try again.' });
    }

    console.log('Brevo verification email sent successfully via API.');

    res.status(201).json({
      message: 'Registration successful. Please verify your email to continue.',
      isNewUser: true
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && user.password && (await bcrypt.compare(password, user.password))) {
      if (!user.isEmailVerified) {
        return res.status(403).json({ message: 'Please verify your email address before logging in.' });
      }
      res.json({
        _id: user._id,
        sparId: user.sparId,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        sparCoins: user.sparCoins,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const googleLogin = async (req, res) => {
  const { access_token } = req.body;

  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    
    if (!response.ok) throw new Error("Google verification failed");
    
    const payload = await response.json();
    const { email, name, picture } = payload;

    let user = await User.findOne({ email });
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      user = await User.create({
        sparId: generateSparId(),
        name,
        email,
        avatar: picture,
      });
    }

    res.json({
      _id: user._id,
      sparId: user.sparId,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      sparCoins: user.sparCoins,
      token: generateToken(user._id),
      isNewUser
    });
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: 'Google Authentication Failed' });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        _id: user._id,
        sparId: user.sparId,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        sparCoins: user.sparCoins,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const updateUserAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.avatar = req.body.avatar || user.avatar;
      if (req.body.phone) {
        const clean = req.body.phone.replace(/\s+/g, '');
        const indianPhoneRegex = /^(?:\+91|91|0)?[6-9]\d{9}$/;
        if (!indianPhoneRegex.test(clean)) {
          return res.status(400).json({ message: 'Please enter a valid 10-digit Indian phone number (starting with 6-9, optional +91 prefix).' });
        }
        user.phone = req.body.phone;
      }
      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        sparId: updatedUser.sparId,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        avatar: updatedUser.avatar,
        sparCoins: updatedUser.sparCoins,
        token: req.headers.authorization.split(' ')[1],
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const spinWheel = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const MAX_SPINS_PER_DAY = 3;

  const todayStr = new Date().toDateString();
  const lastSpinDayStr = user.lastSpunAt ? new Date(user.lastSpunAt).toDateString() : null;

  console.log(`[SPIN] user=${user.email} | dailySpinCount=${user.dailySpinCount} | lastSpunAt=${user.lastSpunAt} | todayStr=${todayStr} | lastSpinDayStr=${lastSpinDayStr}`);

  // Reset daily count if it's a new calendar day
  if (lastSpinDayStr !== todayStr) {
    user.dailySpinCount = 0;
    console.log(`[SPIN] New day detected — resetting dailySpinCount to 0`);
  }

  if (user.dailySpinCount >= MAX_SPINS_PER_DAY) {
    console.log(`[SPIN] Blocked — already used ${user.dailySpinCount} spins today`);
    return res.status(400).json({ message: `You've used all 3 spins for today! Come back tomorrow! 🌅` });
  }

  // Rigged probabilities favoring the house
  const rand = Math.random() * 100;
  let winningValue = 0;
  if (rand < 90) winningValue = 0;
  else if (rand < 94) winningValue = 10;
  else if (rand < 96) winningValue = 20;
  else if (rand < 98) winningValue = 30;
  else if (rand < 99) winningValue = 40;
  else winningValue = 50;

  user.sparCoins += winningValue;
  const newSpinCount = (user.dailySpinCount || 0) + 1;

  console.log(`[SPIN] winningValue=${winningValue} | newSpinCount=${newSpinCount}`);

  const updatedUser = await User.findByIdAndUpdate(
    user._id,
    { sparCoins: user.sparCoins, lastSpunAt: new Date(), dailySpinCount: newSpinCount },
    { new: true, runValidators: false }
  );

  const spinsLeft = MAX_SPINS_PER_DAY - updatedUser.dailySpinCount;

  console.log(`[SPIN] updatedUser.dailySpinCount=${updatedUser.dailySpinCount} | spinsLeft=${spinsLeft}`);

  res.json({
    prizeCoins: winningValue,
    spinsLeft,
    updatedUser: {
      _id: updatedUser._id,
      sparId: updatedUser.sparId,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      avatar: updatedUser.avatar,
      sparCoins: updatedUser.sparCoins,
      lastSpunAt: updatedUser.lastSpunAt,
      dailySpinCount: updatedUser.dailySpinCount,
      token: req.headers.authorization.split(' ')[1]
    }
  });
};

const recordGameScore = async (req, res) => {
  const { score } = req.body;
  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  let reward = null;
  if (score >= 100) {
    reward = 'FREE_TICKET';
  }

  const updatedUser = await User.findByIdAndUpdate(
    user._id,
    { lastGamePlayedAt: new Date() },
    { new: true, runValidators: false }
  );

  res.json({
    reward,
    updatedUser: {
      _id: updatedUser._id,
      sparId: updatedUser.sparId,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      avatar: updatedUser.avatar,
      sparCoins: updatedUser.sparCoins,
      dailyGameAttempts: updatedUser.dailyGameAttempts,
      lastGamePlayedAt: updatedUser.lastGamePlayedAt,
      token: req.headers.authorization.split(' ')[1]
    }
  });
};

const deductCoins = async (req, res) => {
  const { amount } = req.body;
  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (user.sparCoins < amount) {
    return res.status(400).json({ message: 'Insufficient SPAR Coins' });
  }

  const updatedUser = await User.findByIdAndUpdate(
    user._id,
    { sparCoins: user.sparCoins - amount },
    { new: true, runValidators: false }
  );

  res.json({
    updatedUser: {
      _id: updatedUser._id,
      sparId: updatedUser.sparId,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      avatar: updatedUser.avatar,
      sparCoins: updatedUser.sparCoins,
      token: req.headers.authorization.split(' ')[1]
    }
  });
};

const promoteToAdmin = async (req, res) => {
  const { code } = req.body;
  const adminCode = "admin123";

  if (code !== adminCode) {
    return res.status(401).json({ message: 'Invalid admin code' });
  }

  try {
    const user = await User.findByIdAndUpdate(req.user._id, { isAdmin: true }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'Promoted to admin successfully', isAdmin: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Forgot Password ────────────────────────────────────────────────────────────
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      // Generic response to prevent email enumeration
      return res.json({ message: 'If that email exists, a reset link has been sent.' });
    }

    // Google-only accounts have no password
    if (!user.password) {
      return res.status(400).json({ message: 'This account uses Google Sign-In. No password to reset.' });
    }

    // Generate secure random token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}?resetToken=${rawToken}`;

    // Fail fast if Brevo API key is not configured
    if (!process.env.BREVO_API_KEY) {
      console.error('BREVO_API_KEY not set in environment variables.');
      return res.status(500).json({ message: 'Email service not configured. Contact support.' });
    }

    const emailResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: 'SPAR Amusements', email: process.env.BREVO_SENDER_EMAIL || 'cenexasystems@gmail.com' },
        to: [{ email: user.email, name: user.name }],
        subject: '🎡 SPAR — Reset Your Password',
        htmlContent: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0f172a;color:#fff;border-radius:16px;padding:32px;">
            <h2 style="font-size:2rem;background:linear-gradient(90deg,#BF00FF,#00D1FF);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">SPAR AMUSEMENTS</h2>
            <h3 style="color:#C7FF00;margin-bottom:8px;">Password Reset Request</h3>
            <p style="color:#94A3B8;">Hi <strong style="color:#fff">${user.name}</strong>, we received a request to reset your password.</p>
            <a href="${resetUrl}" style="display:inline-block;margin:24px 0;padding:14px 32px;background:linear-gradient(135deg,#BF00FF,#00D1FF);color:#fff;font-weight:800;text-decoration:none;border-radius:12px;font-size:1rem;">RESET PASSWORD</a>
            <p style="color:#64748B;font-size:0.85rem;">This link expires in <strong style="color:#fff">1 hour</strong>. If you did not request this, ignore this email.</p>
            <hr style="border-color:rgba(255,255,255,0.1);margin:24px 0;" />
            <p style="color:#334155;font-size:0.75rem;">© 2025 SPAR Amusements. Sent to ${user.email}</p>
          </div>
        `
      })
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error('Brevo email API error:', errorData);
      return res.status(500).json({ message: 'Failed to send reset email. Please try again.' });
    }

    console.log('Brevo email sent successfully via API.');

    res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Failed to send reset email. Please try again.' });
  }
};

// ── Reset Password ─────────────────────────────────────────────────────────────
const resetPassword = async (req, res) => {
  const { token, password } = req.body;
  try {
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Reset link is invalid or has expired.' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully! You can now log in.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Verify Email ─────────────────────────────────────────────────────────────
const verifyEmail = async (req, res) => {
  const { token } = req.body;
  try {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({ emailVerificationToken: hashedToken });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification link.' });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    
    // Also return updated user so the frontend can update session if logged in
    const updatedUser = await user.save();
    res.json({ 
      message: 'Email verified successfully!',
      updatedUser: {
        _id: updatedUser._id,
        sparId: updatedUser.sparId,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        avatar: updatedUser.avatar,
        sparCoins: updatedUser.sparCoins,
        isEmailVerified: updatedUser.isEmailVerified,
        token: generateToken(updatedUser._id)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, loginUser, googleLogin, getUserProfile, updateUserAvatar, spinWheel, recordGameScore, deductCoins, promoteToAdmin, forgotPassword, resetPassword, verifyEmail };
