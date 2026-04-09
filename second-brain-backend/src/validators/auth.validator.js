import { z } from 'zod';
import AppError from '../utils/appError.js';

// ─── Reusable Field Schemas ───────────────────────────────────────

const emailSchema = z
  .string({ required_error: 'Email is required' })
  .trim()
  .min(1, 'Email is required')
  .email('Invalid email format')
  .toLowerCase();

const passwordSchema = z
  .string({ required_error: 'Password is required' })
  .min(8, 'Password must be at least 8 characters')
  .max(64, 'Password must not exceed 64 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

const otpSchema = z
  .string({ required_error: 'OTP is required' })
  .trim()
  .length(6, 'OTP must be exactly 6 digits')
  .regex(/^\d{6}$/, 'OTP must contain only digits');

const otpTypeSchema = z.enum(['signup', 'forgot_password'], {
  required_error: 'OTP type is required',
  invalid_type_error: "OTP type must be either 'signup' or 'forgot_password'",
});

// ─── Request Schemas ──────────────────────────────────────────────

const registerSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
  email: emailSchema,
  password: passwordSchema,
});

const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
});

const verifyOTPSchema = z.object({
  email: emailSchema,
  otp: otpSchema,
  type: otpTypeSchema,
});

const forgotPasswordSchema = z.object({
  email: emailSchema,
});

const resetPasswordSchema = z
  .object({
    email: emailSchema,
    otp: otpSchema,
    newPassword: passwordSchema,
    confirmPassword: z
      .string({ required_error: 'Please confirm your password' })
      .min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

const refreshTokenSchema = z.object({
  refreshToken: z
    .string({ required_error: 'Refresh token is required' })
    .min(1, 'Refresh token is required'),
});

// Validation Middleware Factory 

/**
 * Formats Zod errors into a clean array of messages
 * e.g. ["Email is required", "Password must be at least 8 characters"]
 */
const formatZodErrors = (error) =>
  error.errors.map((e) => ({
    field: e.path.join('.') || 'unknown',
    message: e.message,
  }));

/**
 * Creates an Express middleware that validates req.body against a Zod schema.
 * On success: attaches parsed (cleaned + coerced) data to req.body
 * On failure: throws a 400 AppError with structured error details
 */
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const errors = formatZodErrors(result.error);

    // Use first error as the main message, attach all errors to err.errors
    const err = new AppError(errors[0].message, 400);
    err.errors = errors; // full list accessible in errorHandler
    return next(err);
  }

  // Replace req.body with parsed data (trimmed, lowercased, coerced)
  req.body = result.data;
  next();
};

//  Exported Validators

export const validateRegister       = validate(registerSchema);
export const validateLogin          = validate(loginSchema);
export const validateVerifyOTP      = validate(verifyOTPSchema);
export const validateForgotPassword = validate(forgotPasswordSchema);
export const validateResetPassword  = validate(resetPasswordSchema);
export const validateRefreshToken   = validate(refreshTokenSchema);