require('dotenv').config({ silent: true });

const Express = require('express');
const config = require('../config');
const logger = require('./logger');
const authenticate = require('./middleware/authenticate');
const ensureHttps = require('./middleware/ensureHttps');
const { notFound, errorHandler } = require('./middleware/errors');
const { client, doConnection } = require('./db/voltdb');
const queries = require('./queries/api');

const app = new Express();
let server;

function immediateExit() {
  logger.error('Two SIGINTs received. Immediate Exit');
  process.exit(10);
}

function gracefulExit(err) {
  let exitCode = 1;
  if (err) {
    logger.error('Exiting due to unhandled error', err);
  } else {
    logger.info('Gracefully shutting down due to signal');
    exitCode = 0;
  }
  if (!server) {
    process.exit(exitCode);
  }
  server.close(() => {
    logger.debug('Server gracefully closed');
    process.exit(exitCode);
  });

  // Wait max 10 seconds for existing sockets to close
  const exitTimer = setTimeout(() => {
    logger.debug('Server exiting abrubtly. Some sockets did not close');
    process.exit(1);
  }, 10 * 1000);

  // don't keep process alive for exit timer
  exitTimer.unref();

  // Two SIGINT for immediete exit
  process.on('SIGINT', immediateExit);
}

process.on('uncaughtException', gracefulExit);
process.on('unhandledRejection', gracefulExit);
process.once('SIGINT', gracefulExit); // CTRL-C in terminal
process.on('SIGTERM', gracefulExit); // Heroku

if (config.NODE_ENV === 'production') {
  app.use(ensureHttps);
}
app.use(authenticate);
app.use('/api', queries(client));

app.use(notFound);
app.use(errorHandler);

client.on('error', gracefulExit);
client.once('open', async () => {
  server = app.listen(config.port, (serverErr) => {
    if (serverErr) {
      logger.error('Error binding network socket. Exiting');
      process.exit(1);
    }
    logger.info(`Server listening on ${config.port}`);
  });
});

doConnection();
