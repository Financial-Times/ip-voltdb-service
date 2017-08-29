const VoltProcedure = require('voltjs/lib/query');

const adhocProc = new VoltProcedure('@AdHoc', ['string']);

module.exports = (client) => {
  return {
    getAvailableProcs() {
      return [...client.availableProcs.keys()];
    },

    callAdhoc() {
      const query = adhocProc.getQuery();
      // Won't make this a real method until we sanitize input
      query.setParameters(['select top 5 * from user_preferences']);
      return client.execProc(query);
    },

    callProcedure(proc, params = []) {
      const foundProc = client.availableProcs.get(proc);
      if (foundProc) {
        const query = foundProc.getQuery();
        query.setParameters(params);
        return client.execProc(query);
      }
      return Promise.reject(new Error('Query not available'));
    }
  };
};
