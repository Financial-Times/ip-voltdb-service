const operationsAPI = require('./api');
const VoltProcedure = require('voltjs/lib/query');

describe('Operations API', () => {
  let operations;
  const client = {};
  client.availableProcs = new Map([
    ['proc1', new VoltProcedure('@AdHoc', ['string'])],
    ['proc2', new VoltProcedure('@AdHoc', ['string'])]
  ]);

  beforeEach(() => {
    operations = operationsAPI(client);
  });

  it('gets the available procs', () => {
    expect(operations.getAvailableProcs()).toEqual([...client.availableProcs.keys()]);
  });

  it('calls an available procedure', async () => {
    const result = 'Hello, world!';
    client.execProc = () => Promise.resolve(result);
    await expect(operations.callProcedure('proc1')).resolves.toBe(result);
  });

  it('does not call an unavailable procedure', async () => {
    await expect(operations.callProcedure('procNonExist')).rejects.toBeDefined();
  });

  it('returns an error if query params set incorrectly', async () => {
    client.execProc = () => Promise.reject('problem');
    await expect(operations.callProcedure('proc1', [1, 2])).rejects.toBeDefined();
  });
});
