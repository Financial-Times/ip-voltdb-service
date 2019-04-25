const VoltProcedure = require('voltjs/lib/query');

const adhocProc = new VoltProcedure('@AdHoc', ['string']);
// TODO create stored procedure in Volt and remove adhoc procs
const adhocProcs = {
  signupViews: (deviceId) => {
    return [`select top 1 * from page_views where device_spoor_id = '${deviceId}'
    order by activity_time desc`];
  }
};

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
