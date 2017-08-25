const express = require('express');
const bodyParser = require('body-parser');
const db = require('./voltdb');

const app = new express();

app.use(bodyParser.json({}));
app.get('/', (req, res, next) => {
  res.send('OK');
});

db.once('open', () => {
  app.listen(3000, () => console.log('listening on 3000'));
});

db.openConnection();
