const router = require('express').Router();
const bodyParser = require('body-parser');
const metrics = require('next-metrics');
const operationsAPI = require('./operations/api');
const parseJSON = require('../utils/parseJSON');
const logger = require('../logger');

module.exports = (client) => {
  const operations = operationsAPI(client);
  router.use(bodyParser.json({}));

  router.get('/queries', (req, res) => {
    res.json(operations.getAvailableProcs());
  });

  router.post('/executions', async (req, res) => {
    const { proc, params } = req.body;
    let data;
    console.log('Request', proc, params);
    try {
      metrics.count('fetch.voltdbservice.called');
      data = await operations.callProcedure(proc, params);
    } catch (err) {
      logger.error(err);
      res.status(400).json({ message: err.message });
      return;
    }
    res.json((data.table && data.table.length) ? parseJSON(data.table) : {});
  });

  return router;
};
