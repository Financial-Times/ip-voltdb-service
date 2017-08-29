const Express = require('express');
const compression = require('compression');
const config = require('../config');
const authenticate = require('./middleware/authenticate');
const ensureHttps = require('./middleware/ensureHttps');
const { notFound, errorHandler } = require('./middleware/errors');
const queries = require('./queries/api');
const { client } = require('./db/voltdb');

const app = new Express();

if (config.NODE_ENV === 'production') {
  app.use(ensureHttps);
}
app.use(authenticate);
app.use(compression());
app.use('/api', queries(client));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
