const rateLimit = require('express-rate-limit');

const tooMany = { success: false, message: 'Too many attempts, please try again later' };

exports.loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: tooMany,
});

exports.registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: tooMany,
});