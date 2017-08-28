require('dotenv').config({ silent: true });

const Express = require('express');
const bodyParser = require('body-parser');
const config = require('../config');
const logger = require('./logger');
const authenticate = require('./middleware/authenticate');
const { notFound, errorHandler } = require('./middleware/errors');
const voltClient = require('./voltdb');
const operations = require('./operations/api')(voltClient);

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

voltClient.on('error', gracefulExit);

process.on('uncaughtException', gracefulExit);
process.on('unhandledRejection', gracefulExit);
process.once('SIGINT', gracefulExit); // CTRL-C in terminal
process.on('SIGTERM', gracefulExit); // Heroku

app.use(authenticate);
app.use(bodyParser.json({}));

app.get('/queries', (req, res) => {
  res.json(operations.getAvailableProcs());
});

app.post('/executions', async (req, res) => {
  const proc = req.body.proc;
  const params = req.body.params;
  let data;
  try {
    data = await operations.callProcedure(proc, params);
    // data = await operations.callAdhoc();
  } catch (err) {
    logger.error(err);
    res.status(400).json({ message: err.message });
    return;
  }
  res.json(data.table);
});

app.use(notFound);
app.use(errorHandler);

server = app.listen(config.port, () => logger.info(`listening on ${config.port}`));
