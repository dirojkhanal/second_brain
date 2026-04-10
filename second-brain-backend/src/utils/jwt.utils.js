import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import AppError from '../utils/appError.js';

// SIGN ACCESS TOKEN
export const signAccessToken = (payload) => {
    return jwt.sign(
        payload,
        config.jwt.accessSecret,
        {
            expiresIn: config.jwt.accessExpiresIn, // e.g. 15m
        }
    );
};
// SIGN REFRESH TOKEN
export const signRefreshToken = (payload) => {
    return jwt.sign(
        payload,
        config.jwt.refreshSecret,
        {
            expiresIn: config.jwt.refreshExpiresIn, // e.g. 7d
        }
    );
};
// VERIFY ACCESS TOKEN
export const verifyAccessToken = (token) => {
    try {
        return jwt.verify(token, config.jwt.accessSecret);
    } catch (error) {
        throw new AppError('Invalid or expired access token', 401);
    }
}
// VERIFY REFRESH TOKEN
export const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, config.jwt.refreshSecret);
    } catch (error) {
        throw new AppError('Invalid or expired refresh token', 401);
    }
};