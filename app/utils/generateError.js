module.exports = function handleError(msg, status, errors = []) {
  const err = new Error(msg);
  err.status = status;
  err.errors = errors;
  return err;
};
