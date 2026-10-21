import AppError from '../utils/AppError.js';

/**
 * Middleware validasi sederhana berbasis fungsi.
 * validator menerima req dan boleh melempar AppError / mengembalikan pesan error.
 */
export function validate(validator) {
  return function validationMiddleware(req, res, next) {
    try {
      const result = validator(req);
      if (typeof result === 'string') {
        throw new AppError(400, result, 'VALIDATION_ERROR');
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}
