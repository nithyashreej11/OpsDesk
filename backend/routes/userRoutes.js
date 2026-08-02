const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getEngineers } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/engineers', authMiddleware, roleMiddleware(['Manager', 'Admin']), getEngineers);

module.exports = router;