function validateObjectId(req, res, next) {
  if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid ticket id' });
  }
  next();
}

module.exports = validateObjectId;