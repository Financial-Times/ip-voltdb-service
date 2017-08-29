const operationsAPI = require('./api');

describe('Operations API', () => {
  let operations;
  const client = {};

  const procParamCounts = {
    proc1: 1,
    proc2: 2,
    proc3: 1,
    proc4: 1
  };

  const procList = [
    { REMARKS: '{"readOnly": true}', PROCEDURE_NAME: 'proc1' },
    { REMARKS: '{"readOnly": true}', PROCEDURE_NAME: 'proc2' },
    { REMARKS: '{"readOnly": false}', PROCEDURE_NAME: 'proc3' },
    { REMARKS: '{"readOnly": true}', PROCEDURE_NAME: 'proc4' },
  ];

  beforeEach(() => {
    operations = operationsAPI(client);
  });

  it('filters out procs that are not read only and more than one param', () => {
    const available = operations.selectAvailableProcs(procList, procParamCounts);
    for (const proc of available) {
      const found = procList.find(p => p.PROCEDURE_NAME === proc[0]);
      expect(JSON.parse(found.REMARKS).readOnly).toBeTruthy();
      expect(procParamCounts[proc[0]]).toBe(1);
    }
  });

  it('calls an available procedure', async () => {
    const result = 'Hello, world!';
    client.callProcedure = (query, cb) => {
      cb(null, null, result);
    };
    await expect(operations.callProcedure('proc1')).resolves.toBe(result);
  });

  it('does not call an unavailable procedure', async () => {
    await expect(operations.callProcedure('proc2')).rejects.toBeDefined();
  });

  it('returns an error if query params set incorrectly', async () => {
    client.callProcedure = () => {
      throw new Error('problem');
    };
    await expect(operations.callProcedure('proc1', [1, 2])).rejects.toBeDefined();
  });
});
