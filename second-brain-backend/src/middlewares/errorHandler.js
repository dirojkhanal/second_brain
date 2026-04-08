import { config } from '../config/env.js';
import { AppError } from '../utils/appError.js';

export const errorHandler = (err, req, res, next) => {
    // Default values
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // DEVELOPMENT: send full error
    if (config.nodeEnv === 'development') {
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
            error: err,
            stack: err.stack,
        });
    }

    // PRODUCTION: send safe response
    if (err instanceof AppError) {
        // Operational error (trusted)
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });
    }

    // Unknown / programming error
    console.error('Unexpected Error:', err);

    return res.status(500).json({
        status: 'error',
        message: 'Something went wrong',
    });
};