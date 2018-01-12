const VoltClient = require('voltjs/lib/client');
const VoltProcedure = require('voltjs/lib/query');

const systemCatalogProc = new VoltProcedure('@SystemCatalog', ['string']);

const typeMapping = {
  VARCHAR: 'string',
  TINYINT: 'short',
  BIGINT: 'int'
};

function compileProcParams(procCols) {
  return procCols.reduce((seen, proc) => {
    const varType = typeMapping[proc.TYPE_NAME] || 'string';
    if (seen[proc.PROCEDURE_NAME]) {
      seen[proc.PROCEDURE_NAME].push(varType);
    } else {
      seen[proc.PROCEDURE_NAME] = [varType];
    }
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

  filterAvailableProcs(procs, procParams) {
    procs.forEach((proc) => {
      // user defined procedures
      this.availableProcs.set(proc.PROCEDURE_NAME,
        new VoltProcedure(proc.PROCEDURE_NAME, procParams[proc.PROCEDURE_NAME]));
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
    // Select read only, single param procs
    return this.filterAvailableProcs(procs.table[0], compileProcParams(procCols.table[0]));
    // TODO Get more information on proc inputs
  }
}

module.exports = Client;
