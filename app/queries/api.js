const router = require('express').Router();
const bodyParser = require('body-parser');
const operationsAPI = require('./operations/api');
const parseJSON = require('../utils/parseJSON');
const logger = require('../logger');

module.exports = (client) => {
  const operations = operationsAPI(client);
  router.use(bodyParser.json({}));

  router.get('/test/:test', (req, res) => {
    console.log(req.path);
    res.json(operations.getAvailableProcs());
  });

  router.get('/queries', (req, res) => {
    res.json(operations.getAvailableProcs());
  });

  router.post('/executions', async (req, res) => {
    const { proc, params, adhoc } = req.body;
    let data;
    try {
      if (adhoc) {
        // don't open this up to random input yet (currently only entityId is
        // received from envoy - hard coded. This is not sanitized.
        data = await operations.callAdhoc(proc, params);
      } else {
        data = await operations.callProcedure(proc, params);
      }
    } catch (err) {
      logger.error(err);
      res.status(400).json({ message: err.message });
      return;
    }
    res.json(data.table.length ? parseJSON(data.table[0]) : {});
  });

  return router;
};
