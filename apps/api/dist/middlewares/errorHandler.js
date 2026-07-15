import { AppError } from '../utils/errors.js';
import logger from '../utils/logger.js';
export const errorHandler = (err, req, res, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
next) => {
    let statusCode = 500;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'An unexpected error occurred';
    if (err instanceof AppError) {
        statusCode = err.statusCode;
        code = err.code;
        message = err.message;
        logger.warn(`API Error [${code}]: ${message}`, { statusCode });
    }
    else {
        // Log unexpected server errors
        logger.error(`Unhandled Exception: ${err.message}`, {
            stack: err.stack,
            url: req.originalUrl,
            method: req.method
        });
    }
    res.status(statusCode).json({
        success: false,
        error: {
            code,
            message,
        },
    });
};
export default errorHandler;
