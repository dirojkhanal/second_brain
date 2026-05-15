import rateLimit from 'express-rate-limit';

export const otpRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {
        status: 'fail',
        message: 'Too many requests from this IP. Please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Separate AI limiter — protects against runaway API cost
export const aiRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour window
    max: 30,                   // 30 AI requests per hour per IP
    message: {
        status: 'fail',
        message: 'AI request limit reached. Please try again in an hour.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});