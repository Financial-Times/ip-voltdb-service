const router = require('express').Router();
const bodyParser = require('body-parser');
const operationsAPI = require('./operations/api');
const parseJSON = require('../utils/parseJSON');

module.exports = (client) => {
  const operations = operationsAPI(client);
  router.use(bodyParser.json({}));

  router.get('/queries', (req, res) => {
    res.json(operations.getAvailableProcs());
  });

  router.post('/executions', async (req, res) => {
    const proc = req.body.proc;
    const params = req.body.params;
    let data;
    try {
      data = await operations.callProcedure(proc, params);
      // data = await operations.callAdhoc();
    } catch (err) {
      res.status(400).json({ message: err.message });
      return;
    }
    res.json(parseJSON(data.table[0]));
  });

  return router;
};
