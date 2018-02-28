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
      // TODO Sanitize input - for now just accepted hard coded entityId from
      // envoy
      const selectedProc = adhocProcs[proc];
      if (!selectedProc) {
        throw new Error('Proc does not exist');
      }
      query.setParameters(selectedProc(params[0]));
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
