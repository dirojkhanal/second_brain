import { z } from 'zod';
import {AppError} from '../utils/appError.js';

const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .email('Invalid email');

const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters');

const otpSchema = z
  .string()
  .length(6, 'OTP must be 6 digits');

// REQUEST SCHEMAS
const registerSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: emailSchema,
  password: passwordSchema,
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

const forgotPasswordSchema = z.object({
  email: emailSchema,
});
const verifyOTPSchema = z.object({
  email: emailSchema,
  otp: otpSchema,
  type: z.enum(['signup', 'forgot_password']),
});

const resetPasswordSchema = z
  .object({
    email: emailSchema,
    otp: otpSchema,
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token required'),
});

// VALIDATION MIDDLEWARE
const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (err) {
    const message = err.errors?.[0]?.message || 'Validation error';
    next(new AppError(message, 400));
  }
};
// EXPORTS
export const validateRegister       = validate(registerSchema);
export const validateLogin          = validate(loginSchema);
export const validateForgotPassword = validate(forgotPasswordSchema);
export const validateVerifyOTP      = validate(verifyOTPSchema);
export const validateResetPassword  = validate(resetPasswordSchema);
export const validateRefreshToken   = validate(refreshTokenSchema);