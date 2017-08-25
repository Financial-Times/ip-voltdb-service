require('dotenv').config({ silent: true });

const Express = require('express');
const bodyParser = require('body-parser');
const config = require('./config');
const logger = require('./logger');
const db = require('./voltdb');
console.log(db);

const app = new Express();

app.use(bodyParser.json({}));
app.post('/query', (req, res, next) => {
  res.send('OK');
});

db.once('open', () => {
console.log(db);
  app.listen(config.port, () => logger.info('listening on 3000'));
});

db.openConnection();
