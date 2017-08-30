const VoltProcedure = require('voltjs/lib/query');
const sqlString = require('sqlstring');
//const queryVars = require('../../utils/lodashVarFinder');
const template = require('lodash/template');

const queryList = [{ name: 'test', query: 'select * from user_preferences where user_uuid=<%= id %>' }];

const adHocQueries = new Map();
for (const query of Object.keys(queryList)) {
  adHocQueries.set(queryList[query].name, (params) => {
    const compiled = template(queryList[query].query);
    return compiled(params);
  });
}

const adhocProc = new VoltProcedure('@AdHoc', ['string']);

function sanitizeParams(params) {
  const sanitized = {};
  for (const param of Object.keys(params)) {
    sanitized[param] = sqlString.escape(params[param]);
  }
  return sanitized;
}

module.exports = (client) => {
  return {
    getAvailableProcs() {
      return [...client.availableProcs.keys()];
    },

    callAdhoc(queryName, params) {
      const foundQuery = adHocQueries.get(queryName);
      if (foundQuery) {
        const sanitized = [foundQuery(sanitizeParams(params))];
        const query = adhocProc.getQuery();
        query.setParameters(sanitized);
        return client.execProc(query);
      }
      return Promise.reject(new Error('Query not available'));
    },

    callProcedure(proc, params = []) {
      const foundProc = client.availableProcs.get(proc);
      if (foundProc) {
        const query = foundProc.getQuery();
        query.setParameters(params);
        return client.execProc(query);
      }
      return Promise.reject(new Error('Proc not available'));
    }
  };
};
