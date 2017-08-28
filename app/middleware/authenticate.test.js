const authenticate = require('./authenticate');
const config = require('../../config');

describe('Authentication middleware', () => {
  it('Calls back with an authentication error if X-API-KEY missing', () => {
    let called = false;
    const req = { get() { } };
    const cb = (err) => {
      expect(err.status).toBe(401);
      called = true;
    };
    authenticate(req, null, cb);
    expect(called).toBeTruthy();
  });

  it('Calls back with an authentication error if X-API-KEY is incorrect', () => {
    let called = false;
    const req = {
      get() {
        return 'Incorrect key';
      }
    };
    const cb = (err) => {
      expect(err.status).toBe(401);
      called = true;
    };
    authenticate(req, null, cb);
    expect(called).toBeTruthy();
  });

  it('Calls back with no error if forwarded X-API-KEY is correct', () => {
    let called = false;
    const req = {
      get() {
        return config.apiKey;
      }
    };
    const cb = (err) => {
      expect(err).not.toBeDefined();
      called = true;
    };
    authenticate(req, null, cb);
    expect(called).toBeTruthy();
  });
});
