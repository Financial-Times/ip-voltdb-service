const VoltProcedure = require('voltjs/lib/query');

const adhocProc = new VoltProcedure('@AdHoc', ['string']);

module.exports = (client) => {
  return {
    getAvailableProcs() {
      return [...client.availableProcs.keys()];
    },

    callAdhoc(proc, params) {
      const query = adhocProc.getQuery();
      query.setParameters([params[0]]);
      return client.execProc(query);
    },

    callProcedure(proc, params = []) {
      const foundProc = client.availableProcs.get(proc);
      if (foundProc) {
        const query = foundProc.getQuery();
        query.setParameters(params);
        return client.execProc(query);
      }
      return this.callAdhoc(proc, params);
    }
  };
};
