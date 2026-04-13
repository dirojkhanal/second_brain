import { query } from '../db/index.js';

// Users 
export const createUser = async ({ name, email, password, role }) => {
  const { rows } = await query(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role, is_verified, created_at`,
    [name, email, password, role]
  );

  return rows[0];
};

export const findUserByEmail = async (email) => {
  const { rows } = await query(
    `SELECT * FROM users WHERE email = $1`,
    [email]
  );
  return rows[0] || null;
};

export const findUserById = async (id) => {
  const { rows } = await query(
    `SELECT id, name, email, role, is_verified, created_at
     FROM users WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
};

export const markUserVerified = async (userId) => {
  await query(
    `UPDATE users
     SET is_verified = TRUE, updated_at = CURRENT_TIMESTAMP
     WHERE id = $1`,
    [userId]
  );
};

export const updateUserPassword = async (userId, hashedPassword) => {
  await query(
    `UPDATE users
     SET password = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2`,
    [hashedPassword, userId]
  );
};

// OTPs 
export const invalidatePreviousOTPs = async (userId, type) => {
  await query(
    `UPDATE otps SET is_used = TRUE
     WHERE user_id = $1 AND type = $2 AND is_used = FALSE`,
    [userId, type]
  );
};

export const saveOTP = async ({ userId, otpCode, type, expiresAt }) => {
  await invalidatePreviousOTPs(userId, type);
  await query(
    `INSERT INTO otps (user_id, otp_code, type, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [userId, otpCode, type, expiresAt]
  );
};

export const findValidOTP = async ({ userId, otpCode, type }) => {
  const { rows } = await query(
    `SELECT * FROM otps
     WHERE user_id = $1
       AND otp_code = $2
       AND type = $3
       AND is_used = FALSE
       AND expires_at > CURRENT_TIMESTAMP`,
    [userId, otpCode, type]
  );
  return rows[0] || null;
};

export const markOTPUsed = async (otpId) => {
  await query(`UPDATE otps SET is_used = TRUE WHERE id = $1`, [otpId]);
};

// Refresh Tokens
export const saveRefreshToken = async ({ userId, token, expiresAt }) => {
  await query(
    `INSERT INTO refresh_tokens (user_id, token, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, token, expiresAt]
  );
};

export const findActiveTokensByUserId = async (userId) => {
  const { rows } = await query(
    `SELECT * FROM refresh_tokens
     WHERE user_id = $1
       AND is_revoked = FALSE
       AND expires_at > CURRENT_TIMESTAMP`,
    [userId]
  );
  return rows;
}; 

export const revokeRefreshTokenById = async (id) => {
  await query(
    `UPDATE refresh_tokens SET is_revoked = TRUE WHERE id = $1`,
    [id]
  );
};

export const revokeAllUserRefreshTokens = async (userId) => {
  await query(
    `UPDATE refresh_tokens SET is_revoked = TRUE WHERE user_id = $1`,
    [userId]
  );
};
// src/repositories/auth.repository.js — add this

export const getRecentOTPCount = async ({ userId, type, withinMinutes }) => {
    const { rows } = await query(
        `SELECT COUNT(*) as count FROM otps
         WHERE user_id = $1
           AND type = $2
           AND created_at > NOW() - ($3 * INTERVAL '1 minute')`,
        [userId, type, withinMinutes]
    );
    return parseInt(rows[0].count);
};
export const getLastOTP = async ({ userId, type }) => {
    const { rows } = await query(
        `SELECT *, 
                EXTRACT(EPOCH FROM (NOW() - created_at)) AS seconds_ago
         FROM otps
         WHERE user_id = $1
           AND type = $2
         ORDER BY created_at DESC
         LIMIT 1`,
        [userId, type]
    );
    return rows[0] || null;
};

