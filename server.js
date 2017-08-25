require('dotenv').config({ silent: true });

const Express = require('express');
const bodyParser = require('body-parser');
const config = require('./config');
const logger = require('./logger');
const voltClient = require('./voltdb');

const app = new Express();

app.use(bodyParser.json({}));
app.post('/query', async (req, res) => {
  const params = req.body.params;
  let data;
  try {
    data = await voltClient.callProcedure(params);
  } catch (err) {
    logger.error(err);
    res.status(400).json({ message: err.message });
  }
  res.json(data.table);
});

app.listen(config.port, () => logger.info(`listening on ${config.port}`));

