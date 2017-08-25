const winston = require('winston');

const config = require('./config');

winston.level = config.logLevel;

if (config.NODE_ENV === 'test') {
  winston.remove(winston.transports.Console);
}

module.exports = winston;

