const VoltConstants = require('voltjs/lib/voltconstants');
const VoltConfiguration = require('voltjs/lib/configuration');
const VoltProcedure = require('voltjs/lib/query');
const Client = require('./Client');
const config = require('../../config');
const logger = require('../logger');

const pingProc = new VoltProcedure('@Ping', []);

function getVoltConfig() {
  const conf = new VoltConfiguration();
  conf.host = config.voltHost;
  conf.port = config.voltPort;
  conf.username = config.voltUser;
  conf.password = config.voltPassword;
  conf.service = 'database';
  conf.messageQueueSize = 0;
  conf.queryTimeout = 10000;
  conf.queryTimeoutInterval = 1000;
  conf.flushInterval = 10;
  conf.reconnect = true;
  conf.reconnectInterval = 1000;
  return conf;
}

const pingTime = 2000;
const connections = [...Array(3)].map(getVoltConfig);
const client = new Client(connections);
let pingInterval;

const connectionHandler = (code, event) => {
  const statusCode = VoltConstants.STATUS_CODE_STRINGS[code];
  if (statusCode === 'UNEXPECTED_FAILURE') {
    logger.error(`${statusCode} for event: ${event}`);
  }
};

async function sendPing() {
  const query = pingProc.getQuery();
  const pingRes = await client.execProc(query);
  logger.debug(`Pinged DB and received: ${JSON.stringify(pingRes)}`);
}

function doConnection() {
  client.on(VoltConstants.SESSION_EVENT.CONNECTION, connectionHandler);
  client.on(VoltConstants.SESSION_EVENT.CONNECTION_ERROR, connectionHandler);
  client.on(VoltConstants.SESSION_EVENT.QUERY_RESPONSE_ERROR, connectionHandler);
  client.on(VoltConstants.SESSION_EVENT.QUERY_DISPATCH_ERROR, connectionHandler);
  client.on(VoltConstants.SESSION_EVENT.FATAL_ERROR, connectionHandler);
  client.connect(async (code, event) => {
    const statusCode = code ? VoltConstants.STATUS_CODE_STRINGS[code] : 'SUCCESS';
    if (statusCode === 'SUCCESS') {
      logger.info(`Volt connection event=${event} status=${statusCode}`);
      clearInterval(pingInterval);
      pingInterval = setInterval(sendPing, pingTime);
      try {
        await client.selectAvailableProcs();
        client.emit('open');
      } catch (err) {
        logger.error(`Could not get available procs - ${err}`);
        client.emit('error');
      }
    } else {
      logger.error(`Could not connect ${statusCode}`);
      client.emit('error');
    }
  });
}

module.exports = {
  client,
  doConnection
};
