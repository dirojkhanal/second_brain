import { verifyAccessToken } from '../utils/jwt.utils.js';
import { AppError } from '../utils/appError.js';
import * as authRepo from '../repositories/auth.repository.js';

/**
 * Middleware to verify JWT access token from cookies
 * Attaches user data to req.user if valid
 */
export const authenticate = async (req, res, next) => {
    const accessToken = req.cookies?.accessToken;

    if (!accessToken) {
        throw new AppError('Authentication required. Please login.', 401);
    }

    // Verify token signature and expiry
    const decoded = verifyAccessToken(accessToken);

    // Fetch fresh user data from database
    const user = await authRepo.findUserById(decoded.id);

    if (!user) {
        throw new AppError('User no longer exists. Please login again.', 401);
    }

    // Attach user to request object
    req.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.is_verified,
    };

    next();
};

/**
 * Middleware to check if user has required role(s)
 * Must be used after authenticate middleware
 * 
 * @param {...string} allowedRoles - Roles that can access the route (e.g., 'admin', 'user')
 * 
 * Usage: authorize('admin')
 * Usage: authorize('admin', 'moderator')
 */
export const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            throw new AppError('Authentication required', 401);
        }

        if (!allowedRoles.includes(req.user.role)) {
            throw new AppError(
                `Access denied. This route requires one of: ${allowedRoles.join(', ')}`,
                403
            );
        }

        next();
    };
};

/**
 * Middleware to check if user's email is verified
 * Must be used after authenticate middleware
 */
export const requireVerified = (req, res, next) => {
    if (!req.user) {
        throw new AppError('Authentication required', 401);
    }

    if (!req.user.isVerified) {
        throw new AppError('Email verification required. Please verify your email.', 403);
    }

    next();
};