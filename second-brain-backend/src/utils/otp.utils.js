// src/utils/otp.utils.js
import crypto from 'crypto';
import bcrypt from 'bcrypt';

// generates a random 6-digit OTP
export const generateOTP = () => {
    return crypto.randomInt(100000, 999999).toString();
};

export const hashOTP = async (otp) => {
    return bcrypt.hash(otp, 10);
};

export const compareOTP = async (otp, hashed) => {
    return bcrypt.compare(otp, hashed);
};

