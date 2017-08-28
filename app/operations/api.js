const VoltProcedure = require('voltjs/lib/query');

const systemCatalogProc = new VoltProcedure('@SystemCatalog', ['string']);
const adhocProc = new VoltProcedure('@AdHoc', ['string']);

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

  function countProcParams(procCols) {
    return procCols.reduce((seen, proc) => {
      seen[proc.PROCEDURE_NAME] = (seen[proc.PROCEDURE_NAME] || 0) + 1;
      return seen;
    }, {});
  }

  function selectAvailableProcs(procs, procParamCounts) {
    procs.forEach((proc) => {
      const remarks = JSON.parse(proc.REMARKS);
      // Only use read only, single key, user defined procedures
      if (remarks.readOnly && !proc.PROCEDURE_NAME.includes('.select') &&
        procParamCounts[proc.PROCEDURE_NAME] === 1) {
        availableProcs.set(proc.PROCEDURE_NAME, new VoltProcedure(proc.PROCEDURE_NAME, ['string']));
      }
    });
  }

  client.once('open', async () => {
    // Retrieve valid procedure information
    const procQuery = systemCatalogProc.getQuery();
    const procColumnsQuery = systemCatalogProc.getQuery();
    procQuery.setParameters(['procedures']);
    procColumnsQuery.setParameters(['procedurecolumns']);
    const [procs, procCols] = await Promise.all([execProc(procQuery), execProc(procColumnsQuery)]);
    // Select read only, single param procs
    selectAvailableProcs(procs.table[0], countProcParams(procCols.table[0]));


    // TODO Get more information on proc inputs
  });

  return {
    getAvailableProcs() {
      return [...availableProcs.keys()];
    },

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
