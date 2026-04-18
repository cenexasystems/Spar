const express = require('express');
const router = express.Router();
const { registerUser, loginUser, googleLogin, getUserProfile, updateUserAvatar, spinWheel, recordGameScore, deductCoins, promoteToAdmin } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleLogin);
router.get('/profile', protect, getUserProfile);
router.put('/avatar', protect, updateUserAvatar);
router.post('/spin', protect, spinWheel);
router.post('/game-score', protect, recordGameScore);
router.post('/deduct-coins', protect, deductCoins);
router.post('/promote-admin', protect, promoteToAdmin);

module.exports = router;
