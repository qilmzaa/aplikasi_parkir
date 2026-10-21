/** Meneruskan error dari controller async ke error handler Express. */
export default function asyncHandler(handler) {
  return function wrappedHandler(req, res, next) {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}
