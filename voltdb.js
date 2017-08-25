const VoltClient = require('voltjs/lib/client');
const VoltConstants = require('voltjs/lib/voltconstants');
const VoltConfiguration = require('voltjs/lib/configuration');
const config = require('./config');
const logger = require('./logger');

function getVoltConfig() {
  const conf = new VoltConfiguration();
  conf.host = config.voltHost;
  conf.port = config.voltPort;
  conf.username = config.voltUser;
  conf.password = config.voltPassword;
  conf.service = 'database';
  conf.messageQueueSize = 0;
  conf.reconnect = false;
  return conf;
}

const reconnectTime = 1000;
const maxReconnectTime = 512000;
const connections = [...Array(3)].map(getVoltConfig);
let hasConnection = false;
let reconnectCount = 0;
let connectTimeout;
let client;

const connectionHandler = (code, event) => {
  const statusCode = code ? VoltConstants.STATUS_CODE_STRINGS[code] : 'SUCCESS';
  logger.info(`Volt connection event=${event} status=${statusCode}`);
  if (statusCode === 'SUCCESS') {
    clearTimeout(connectTimeout);
    hasConnection = true;
    reconnectCount = 0;
    client.emit('open');
  }
  if (statusCode === 'UNEXPECTED_FAILURE') {
    hasConnection = false;
    client.removeAllListeners();
    let wait = (Math.pow(2, reconnectCount) * reconnectTime);
    if (wait >= maxReconnectTime) {
      wait = maxReconnectTime;
    }
    logger.info(`Volt backing off connection for ${wait} ms`);
    connectTimeout = setTimeout(doConnection, wait + Math.floor(Math.random() * 1000));
    reconnectCount++;
  }
};

function setupConnection() {
  client = new VoltClient(connections);
  client.openConnection = () => {
    logger.info('Volt connecting...');
    client.connect(() => {});
  };

  client.on(VoltConstants.SESSION_EVENT.CONNECTION, connectionHandler);
  client.on(VoltConstants.SESSION_EVENT.CONNECTION_ERROR, connectionHandler);
  client.on(VoltConstants.SESSION_EVENT.QUERY_RESPONSE_ERROR, connectionHandler);
  client.on(VoltConstants.SESSION_EVENT.QUERY_DISPATCH_ERROR, connectionHandler);
  client.on(VoltConstants.SESSION_EVENT.FATAL_ERROR, connectionHandler);
}

setupConnection();

module.exports = client;
