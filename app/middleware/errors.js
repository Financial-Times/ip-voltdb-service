function notFound(req, res, next) {
  const err = new Error('Not found');
  err.status = 404;
  next(err);
}

// eslint-disable-next-line
function errorHandler(err, req, res, next) {
  res.status(err.status || err.statusCode || 500);
  return res.json({
    message: err.message,
    errors: err.error || []
  });
}

module.exports = {
  notFound,
  errorHandler
};
