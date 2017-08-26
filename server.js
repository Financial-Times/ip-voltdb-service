require('dotenv').config({ silent: true });

const Express = require('express');
const bodyParser = require('body-parser');
const config = require('./config');
const logger = require('./logger');
const voltClient = require('./voltdb');
const operations = require('./operations')(voltClient);

const app = new Express();

voltClient.on('error', (err) => {
  logger.error(`Error with volt connection: ${err}`);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err}`);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err}`);
  process.exit(1);
});

app.use(bodyParser.json({}));
app.post('/query', async (req, res) => {
  const proc = req.body.proc;
  const params = req.body.params;
  let data;
  try {
    data = await operations.callProcedure(proc, params);
    //data = await operations.callAdhoc();
  } catch (err) {
    logger.error(err);
    return res.status(400).json({ message: err.message });
  }
  res.json(data.table);
});

app.listen(config.port, () => logger.info(`listening on ${config.port}`));
