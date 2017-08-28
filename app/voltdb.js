const VoltClient = require('voltjs/lib/client');
const VoltConstants = require('voltjs/lib/voltconstants');
const VoltConfiguration = require('voltjs/lib/configuration');
const VoltProcedure = require('voltjs/lib/query');
const config = require('../config');
const logger = require('./logger');

const pingProc = new VoltProcedure('@Ping', []);

function getVoltConfig() {
  const conf = new VoltConfiguration();
  conf.host = config.voltHost;
  conf.port = config.voltPort;
  conf.username = config.voltUser;
  conf.password = config.voltPassword;
  conf.service = 'database';
  conf.messageQueueSize = 0;
  conf.queryTimeout = 100;
  conf.queryTimeoutInterval = 1000;
  conf.flushInterval = 10;
  conf.reconnect = true;
  conf.reconnectInterval = 1000;
  return conf;
}

const pingTime = 2000;
const connections = [...Array(3)].map(getVoltConfig);
const client = new VoltClient(connections);
let pingInterval;

const sendPing = () => {
  const query = pingProc.getQuery();
  client.callProcedure(query, (code, event) => {
    logger.debug(`Pinged DB and received code: ${code} with event: ${event}`);
  });
};

const connectionHandler = (code, event) => {
  const statusCode = VoltConstants.STATUS_CODE_STRINGS[code];
  if (statusCode === 'UNEXPECTED_FAILURE') {
    logger.error(`${statusCode} for event: ${event}`);
  }
};

function doConnection() {

  client.on(VoltConstants.SESSION_EVENT.CONNECTION, connectionHandler);
  client.on(VoltConstants.SESSION_EVENT.CONNECTION_ERROR, connectionHandler);
  client.on(VoltConstants.SESSION_EVENT.QUERY_RESPONSE_ERROR, connectionHandler);
  client.on(VoltConstants.SESSION_EVENT.QUERY_DISPATCH_ERROR, connectionHandler);
  client.on(VoltConstants.SESSION_EVENT.FATAL_ERROR, connectionHandler);
  client.connect((code, event) => {
    const statusCode = code ? VoltConstants.STATUS_CODE_STRINGS[code] : 'SUCCESS';
    if (statusCode === 'SUCCESS') {
      logger.info(`Volt connection event=${event} status=${statusCode}`);
      clearInterval(pingInterval);
      pingInterval = setInterval(sendPing, pingTime);
      client.emit('open');
    } else {
      client.emit('error');
    }
  });
}

module.exports = {
  client,
  doConnection
};
