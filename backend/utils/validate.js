exports.isNonEmptyString = (value, maxLength) =>
  typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength;