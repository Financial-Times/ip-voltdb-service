const VoltProcedure = require('voltjs/lib/query');

const userPreferencesProc = new VoltProcedure('getUserPreferences', ['string']);
const adhocProc = new VoltProcedure('@AdHoc', ['string']);

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

  return {
    callAdhoc() {
      const query = adhocProc.getQuery();
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
