const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { isNonEmptyString } = require('../utils/validate');

function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function generateToken(user) {
  return jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '2h',
  });
}

exports.registerUser = async (req, res) => {
  try {
    const { name, password } = req.body;
    const email = normalizeEmail(req.body.email);
   // console.log('REGISTER REQUEST RECEIVED:', { name, email, password, role });

    if (!isNonEmptyString(name, 100) || !email || !isNonEmptyString(password, 72)) {
  return res.status(400).json({ success: false, message: 'Valid name, email and password (max 72 characters) are required' });
}

    const existingUser = await User.findOne({ email });
   // console.log('EXISTING USER CHECK RESULT:', existingUser);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }
    if (typeof password !== 'string' || password.length < 8) {
  return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
}

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'Reporter',
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Something went wrong', error: error.message });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { password } = req.body;
    const email = normalizeEmail(req.body.email);

    if (!email || typeof password !== 'string' || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Something went wrong', error: error.message });
  }
};

exports.getEngineers = async (req, res) => {
  try {
    const engineers = await User.find({ role: 'Engineer' }, 'name email');
    res.status(200).json({ success: true, engineers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Something went wrong', error: error.message });
  }
};