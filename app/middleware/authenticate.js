const generateError = require('../utils/generateError');
const config = require('../../config');

module.exports = (req, res, next) => {
  const auth = req.get('x-api-key');
  if (!auth) {
    next(generateError('Authorization key must be supplied', 401));
    return;
  } else if (auth !== config.apiKey) {
    next(generateError('Invalid authorization key', 401));
    return;
  }
  next();
};
