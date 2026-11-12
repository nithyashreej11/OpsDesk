const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getEngineers } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { loginLimiter, registerLimiter } = require('../middleware/rateLimiters');

router.post('/register', registerLimiter, registerUser);
router.post('/login', loginLimiter, loginUser);

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/engineers', authMiddleware, roleMiddleware(['Manager', 'Admin']), getEngineers);

module.exports = router;