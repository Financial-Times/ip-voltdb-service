const VoltClient = require('voltjs/lib/client');
const VoltProcedure = require('voltjs/lib/query');

const systemCatalogProc = new VoltProcedure('@SystemCatalog', ['string']);

function countProcParams(procCols) {
  return procCols.reduce((seen, proc) => {
    seen[proc.PROCEDURE_NAME] = (seen[proc.PROCEDURE_NAME] || 0) + 1;
    return seen;
  }, {});
}

class Client extends VoltClient {
  constructor(connections) {
    super(connections);
    this.availableProcs = new Map();
    this.procCols;
  }

  execProc(query) {
    return new Promise((resolve, reject) => {
      // callProcedure throws synchronous error if params are invalid
      try {
        this.callProcedure(query, (code, event, results) => {
          resolve(results);
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  filterAvailableProcs(procs, procParamCounts) {
    procs.forEach((proc) => {
      const remarks = JSON.parse(proc.REMARKS);
      // Only use read only, single key, user defined procedures
      if (remarks.readOnly && !proc.PROCEDURE_NAME.includes('.select') &&
        procParamCounts[proc.PROCEDURE_NAME] === 1) {
        this.availableProcs.set(proc.PROCEDURE_NAME,
          new VoltProcedure(proc.PROCEDURE_NAME, ['string']));
      }
    });
  }

  async selectAvailableProcs() {
    // Retrieve valid procedure information
    const procQuery = systemCatalogProc.getQuery();
    const procColumnsQuery = systemCatalogProc.getQuery();
    procQuery.setParameters(['procedures']);
    procColumnsQuery.setParameters(['procedurecolumns']);
    const [procs, procCols] = await Promise.all([
      this.execProc(procQuery),
      this.execProc(procColumnsQuery)
    ]);
    console.log(procs);
    console.log(procCols);
    // Select read only, single param procs
    return this.filterAvailableProcs(procs.table[0], countProcParams(procCols.table[0]));
    // TODO Get more information on proc inputs
  }
}

module.exports = Client;
