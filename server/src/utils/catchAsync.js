/**
 * Wraps async Express controller functions to catch promise rejections 
 * and pass them automatically to the global error handling middleware.
 * Follows Single Responsibility Principle & DRY pattern.
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

module.exports = catchAsync;
