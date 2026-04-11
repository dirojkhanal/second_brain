import bcrypt from "bcrypt";
import { AppError } from "../utils/appError.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "../utils/jwt.utils.js";
import * as authRepo from "../repositories/auth.repository.js";

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