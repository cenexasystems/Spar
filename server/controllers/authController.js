const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'Account exists! Switch to LOGIN to enter.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      sparId: generateSparId(),
      name,
      email,
      phone,
      password: hashedPassword,
      avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
    });

    res.status(201).json({
      _id: user._id,
      sparId: user.sparId,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      sparCoins: user.sparCoins,
      token: generateToken(user._id),
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
  const user = await User.findById(req.user._id);

  if (user) {
    user.avatar = req.body.avatar || user.avatar;
    if (req.body.phone) user.phone = req.body.phone;
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
};

const spinWheel = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Check 24 hour limit
  if (user.lastSpunAt) {
    const timeSinceLastSpin = Date.now() - user.lastSpunAt.getTime();
    if (timeSinceLastSpin < 24 * 60 * 60 * 1000) {
      const remainingMs = (24 * 60 * 60 * 1000) - timeSinceLastSpin;
      const remainingHrs = Math.ceil(remainingMs / (1000 * 60 * 60));
      return res.status(400).json({ message: `You can spin again in ${remainingHrs} hours!` });
    }
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
  user.lastSpunAt = Date.now();
  const updatedUser = await user.save();

  res.json({
    prizeCoins: winningValue,
    updatedUser: {
      _id: updatedUser._id,
      sparId: updatedUser.sparId,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      avatar: updatedUser.avatar,
      sparCoins: updatedUser.sparCoins,
      lastSpunAt: updatedUser.lastSpunAt,
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

  const now = new Date();
  
  // Update last played time but ignore attempt counts for infinity play
  user.lastGamePlayedAt = now;

  // No coins earned from this game anymore as per new spec
  let coinsEarned = 0;
  let reward = null;

  if (score >= 100) {
    reward = 'FREE_TICKET';
  }
  
  const updatedUser = await user.save();

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

  user.sparCoins -= amount;
  const updatedUser = await user.save();

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
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isAdmin = true;
    await user.save();

    res.json({ message: 'Promoted to admin successfully', isAdmin: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, loginUser, googleLogin, getUserProfile, updateUserAvatar, spinWheel, recordGameScore, deductCoins, promoteToAdmin };
