const generateError = require('../utils/generateError');

module.exports = (req, res, next) => {
  const forwarded = req.get('x-forwarded-proto');
  console.log(forwarded);
  if (forwarded && forwarded !== 'https') {
    console.log(forwarded);
    next(generateError('Please use HTTPS when submitting data to this server', 403));
    return;
  }
  next();
};
