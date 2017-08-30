const router = require('express').Router();
const bodyParser = require('body-parser');
const operationsAPI = require('./operations/api');
const parseJSON = require('../utils/parseJSON');
const validateType = require('../middleware/validateType');

module.exports = (client) => {
  const operations = operationsAPI(client);
  router.use(bodyParser.json({}));

  router.get('/queries', (req, res) => {
    res.json(operations.getAvailableProcs());
  });

  router.use(validateType);
  router.post('/executions', async (req, res) => {
    const type = req.body.type;
    const proc = req.body.proc;
    const params = req.body.params;
    let data;
    try {
      if (type === 'adhoc') {
        data = await operations.callAdhoc(proc, params);
      } else {
        data = await operations.callProcedure(proc, params);
      }
    } catch (err) {
      res.status(400).json({ message: err.message });
      return;
    }
    if (data.status !== 1) {
      res.status(500).json({ message: 'Something went wrong' });
      return;
    }
    res.json(parseJSON(data.table[0]));
  });

  return router;
};
