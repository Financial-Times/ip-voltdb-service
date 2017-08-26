const VoltProcedure = require('voltjs/lib/query');

const userPreferencesProc = new VoltProcedure('getUserPreferences', ['string']);
const adhocProc = new VoltProcedure('@AdHoc', ['string']);
const listProcedures = new VoltProcedure('@SystemCatalog', ['string']);

const availableProcs = new Map();

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
    procs.table[0].forEach((proc) => {
      const remarks = JSON.parse(proc.REMARKS);
      // only use read only, single key, user defined procedures
      if (remarks.readOnly && remarks.partitionParameter === 0 && remarks.singlePartition &&
        !proc.PROCEDURE_NAME.includes('.select')) {
        availableProcs.set(proc.PROCEDURE_NAME, new VoltProcedure(proc.PROCEDURE_NAME, ['string']));
      }
    });
    // TODO EXEC @SystemCatalog PROCEDURECOLUMNS to get params and only allow single params for now
  });

  return {
    callAdhoc() {
      const query = adhocProc.getQuery();
      // Won't make this a real method until we sanitize input
      query.setParameters(['select top 5 * from user_preferences']);
      return execProc(query);
    },

    callProcedure(proc, params = []) {
      const foundProc = availableProcs.get(proc);
      if (foundProc) {
        const query = foundProc.getQuery();
        query.setParameters(params);
        return execProc(query);
      }
      return Promise.reject(new Error('Query not available'));
    }
  };
};
