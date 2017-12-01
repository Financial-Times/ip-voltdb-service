const config = exports;

function int(str) {
  if (!str) {
    return 0;
  }
  return parseInt(str, 10);
}

config.NODE_ENV = process.env.NODE_ENV || 'development';
config.port = int(process.env.PORT) || 3000;

// VoltDB
config.voltHost = process.env.VOLT_HOST || 'spoor-voltdb.in.ft.com';
config.voltPort = int(process.env.VOLT_PORT) || 21212;
config.voltUser = process.env.VOLT_USER || 'developer';
config.voltPassword = process.env.VOLT_PASSWORD;

// Security
config.apiKey = process.env.API_KEY || 'development';
