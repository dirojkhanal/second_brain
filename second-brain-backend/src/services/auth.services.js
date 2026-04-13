import bcrypt from "bcrypt";
import { AppError } from "../utils/appError.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "../utils/jwt.utils.js";
import * as authRepo from "../repositories/auth.repository.js";
import { generateOTP, hashOTP, compareOTP } from "../utils/otp.utils.js";
import { sendOTPEmail } from "../utils/email.utils.js";

const SALT_ROUNDS = 10;

export const userRegister = async ({ name, email, password }) => {
  const userExisting = await authRepo.findUserByEmail(email);

  if (userExisting) {
    throw new AppError('User already exists', 400);
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await authRepo.createUser({
    name,
    email,
    password: hashedPassword,
    role: 'user',
  });

  const tokens = await generateTokens(user);

  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  return { user: safeUser, ...tokens };
};

//LOGIN 
export const userLogin = async ({ email, password }) => {
  const user = await authRepo.findUserByEmail(email);

  const isValidPassword = user
    ? await bcrypt.compare(password, user.password)
    : false;

  if (!user || !isValidPassword) {
    throw new AppError('Invalid email or password', 401);
  }

  const tokens = await generateTokens(user);

  const { password: _, ...safeUser } = user;

  return {
    user: safeUser,
    ...tokens,
  };
};

// LOGOUT 
export const userLogout = async (refreshToken) => {
  if (!refreshToken) return;

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (err) {
    // token invalid or expired -> just ignore (already unusable)
    return;
  }
  // get all active tokens for this user
  const storedTokens = await authRepo.findActiveTokensByUserId(decoded.id);

  for (const stored of storedTokens) {
    const isMatch = await bcrypt.compare(refreshToken, stored.token);

    if (isMatch) {
      await authRepo.revokeRefreshTokenById(stored.id);
      break;
    }
  }
};

//REFRESH TOKEN
export const refreshAccessToken = async (refreshToken) => {
    if (!refreshToken) {
        throw new AppError('Refresh token missing', 401);
    }

    // Step 1: verify the JWT signature and expiry
    const decoded = verifyRefreshToken(refreshToken); 

    // Step 2: fetch all active tokens for this user from DB
    const storedTokens = await authRepo.findActiveTokensByUserId(decoded.id);

    if (!storedTokens.length) {
        throw new AppError('Session expired, please login again', 401);
    }

    // Step 3: find which stored hash matches this token
    let matchedToken = null;
    for (const stored of storedTokens) {
        const isMatch = await bcrypt.compare(refreshToken, stored.token);
        if (isMatch) {
            matchedToken = stored;
            break;
        }
    }

    if (!matchedToken) {
        throw new AppError('Invalid refresh token', 401);
    }

    // Step 4: revoke the old token (rotate — don't reuse)
    await authRepo.revokeRefreshTokenById(matchedToken.id);

    // Step 5: fetch fresh user data
    const user = await authRepo.findUserById(decoded.id);
    if (!user) {
        throw new AppError('User not found', 401);
    }

    // Step 6: generate new tokens
    const tokens = await generateTokens(user);

    const safeUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
    };

    return { user: safeUser, ...tokens };
};

//forgot-password
const OTP_COOLDOWN_SECONDS = 5;      // must wait 60s before requesting again
const OTP_MAX_PER_HOUR = 20;           // max 5 OTPs per hour
export const forgotPassword = async ({ email }) => {
    const user = await authRepo.findUserByEmail(email);

    // don't reveal if email exists
    if (!user) return;

    // check 1: cooldown — how long since last OTP?
    const lastOTP = await authRepo.getLastOTP({
        userId: user.id,
        type: 'forgot_password',
    });

    if (lastOTP) {
    const secondsSinceLast = parseFloat(lastOTP.seconds_ago);

    if (secondsSinceLast < OTP_COOLDOWN_SECONDS) {
        const waitSeconds = Math.ceil(OTP_COOLDOWN_SECONDS - secondsSinceLast);
        throw new AppError(
            `Please wait ${waitSeconds} seconds before requesting another OTP.`,
            429
        );
    }
}
    // check 2: max attempts per hour
    const recentCount = await authRepo.getRecentOTPCount({
        userId: user.id,
        type: 'forgot_password',
        withinMinutes: 60,
    });

    if (recentCount >= OTP_MAX_PER_HOUR) {
        throw new AppError(
            'Too many OTP requests. Please try again after 1 hour.',
            429
        );
    }

    // all checks passed — generate and send OTP
    const otp = generateOTP();
    const hashedOtp = await hashOTP(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await authRepo.saveOTP({
        userId: user.id,
        otpCode: hashedOtp,
        type: 'forgot_password',
        expiresAt,
    });

    await sendOTPEmail({
        toEmail: user.email,
        name: user.name,
        otp,
        type: 'forgot_password',
    });
};






































//Private Helpers 
const generateTokens = async (user) => {
  const payload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  // HASH REFRESH TOKEN HERE
  const hashedToken = await bcrypt.hash(refreshToken, 10);

  const expireAt = new Date();
  expireAt.setDate(expireAt.getDate() + 7);

  await authRepo.saveRefreshToken({
    userId: user.id,
    token: hashedToken, // store hashed version
    expiresAt: expireAt,
  });

  return { accessToken, refreshToken }; // return original token to client
};