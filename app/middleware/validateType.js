const generateError = require('../utils/generateError');

const types = ['adhoc', 'stored'];

module.exports = (req, res, next) => {
  if (!types.includes(req.body.type)) {
    next(generateError(`Type must be either ${types.join(' or ')}`));
    return;
  }
  next();
};
