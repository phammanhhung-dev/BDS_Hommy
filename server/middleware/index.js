const auth = require('./auth');
const validation = require('./validation');
const { errorHandler, notFoundHandler } = require('./errorHandler');

module.exports = {
  ...auth,
  validation,
  errorHandler,
  notFoundHandler
};
