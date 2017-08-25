const VoltClient = require('voltjs/lib/client');
const VoltConstants = require('voltjs/lib/voltconstants');
const VoltConfiguration = require('voltjs/lib/configuration');
const VoltProcedure = require('voltjs/lib/query');
const config = require('./config');
const logger = require('./logger');

const deviceInfoProc = new VoltProcedure('getUserPreferences', ['string']);
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
  conf.reconnect = false;
  return conf;
}

const pingTime = 2000;
const reconnectTime = 1000;
const maxReconnectTime = 512000;
const connections = [...Array(3)].map(getVoltConfig);
let reconnectCount = 0;
let pingInterval;
let connectTimeout;
let client;

const sendPing = () => {
  const query = pingProc.getQuery();
  client.callProcedure(query, (code, event) => {
    logger.debug(`Pinged DB and received code: ${code} with event: ${event}`);
  });
};

const connectionHandler = (code, event) => {
  const statusCode = code ? VoltConstants.STATUS_CODE_STRINGS[code] : 'SUCCESS';
  logger.info(`Volt connection event=${event} status=${statusCode}`);
  if (statusCode === 'SUCCESS') {
    clearTimeout(connectTimeout);
    pingInterval = setInterval(sendPing, pingTime);
    reconnectCount = 0;
  }
  if (statusCode === 'UNEXPECTED_FAILURE') {
    clearInterval(pingInterval);
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

function doConnection() {
  client = new VoltClient(connections);

  client.on(VoltConstants.SESSION_EVENT.CONNECTION, connectionHandler);
  client.on(VoltConstants.SESSION_EVENT.CONNECTION_ERROR, connectionHandler);
  client.on(VoltConstants.SESSION_EVENT.QUERY_RESPONSE_ERROR, connectionHandler);
  client.on(VoltConstants.SESSION_EVENT.QUERY_DISPATCH_ERROR, connectionHandler);
  client.on(VoltConstants.SESSION_EVENT.FATAL_ERROR, connectionHandler);
  client.connect(() => {});
}

doConnection();

module.exports = {
  callProcedure(params = []) {
    const query = deviceInfoProc.getQuery();
    query.setParameters(params);
    return new Promise((resolve, reject) => {
      // callProcedure throws synchronous error if params are invalid
      try {
        client.callProcedure(query, (code, event, results) => {
          resolve(results);
        });
      } catch (err) {
        reject(err);
      }
    });
  }
};
