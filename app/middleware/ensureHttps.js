const generateError = require('../utils/generateError');

module.exports = (req, res, next) => {
  const forwarded = req.get('x-forwarded-proto');
  if (forwarded && forwarded !== 'https') {
    next(generateError('Please use HTTPS when submitting data to this server', 403));
    return;
  }
  next();
};
