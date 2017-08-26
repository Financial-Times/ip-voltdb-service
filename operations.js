const VoltProcedure = require('voltjs/lib/query');

const userPreferencesProc = new VoltProcedure('getUserPreferences', ['string']);
const adhocProc = new VoltProcedure('@AdHoc', ['string']);
const listProcedures = new VoltProcedure('@SystemCatalog', ['string']);

let availableProcs;

module.exports = (client) => {

  function execProc(query) {
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

  client.once('open', async () => {
    const procedureQuery = listProcedures.getQuery();
    procedureQuery.setParameters(['procedures']);
    const procs = await execProc(procedureQuery);
    console.log(procs.table[0][0]);

  });

  return {
    callAdhoc() {
      const query = adhocProc.getQuery();
      // Won't make this a real method until we sanitize input
      query.setParameters(['select top 5 * from user_preferences']);
      return execProc(query);
    },

    callProcedure(params = []) {
      const query = userPreferencesProc.getQuery();
      query.setParameters(params);
      return execProc(query);
    }
  };
};
