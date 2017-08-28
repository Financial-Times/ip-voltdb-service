const ensureHttps = require('./ensureHttps');

describe('Ensure HTTPS middleware', () => {
  it('Calls back with an error if forwarded protocol is not https', () => {
    let called = false;
    const req = {
      get() {
        return 'http';
      }
    };
    const cb = (err) => {
      expect(err).toBeDefined();
      called = true;
    };
    ensureHttps(req, null, cb);
    expect(called).toBeTruthy();
  });

  it('Calls back with no error if forwarded protocol doesn\'t exist', () => {
    let called = false;
    const req = { get() {} };
    const cb = (err) => {
      expect(err).not.toBeDefined();
      called = true;
    };
    ensureHttps(req, null, cb);
    expect(called).toBeTruthy();
  });

  it('Calls back with no error if forwarded protocol is HTTPS', () => {
    let called = false;
    const req = {
      get() {
        return 'https';
      }
    };
    const cb = (err) => {
      expect(err).not.toBeDefined();
      called = true;
    };
    ensureHttps(req, null, cb);
    expect(called).toBeTruthy();
  });
});
