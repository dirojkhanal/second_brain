import dotenv from 'dotenv';

dotenv.config();

// REQUIRED ENV VARIABLES
const required = [
    'NODE_ENV',
    'PORT',
    'DATABASE_URL',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'JWT_ACCESS_EXPIRES_IN',
    'JWT_REFRESH_EXPIRES_IN',
    'RESEND_API_KEY',
    'RESEND_FROM_EMAIL',
];

// FAIL FAST
required.forEach((key) => {
    if (!process.env[key]) {
        throw new Error(`Missing environment variable: ${key}`);
    }
});
// CONFIG EXPORT
export const config = {
    nodeEnv: process.env.NODE_ENV,
    port: Number(process.env.PORT),

    db: {
        url: process.env.DATABASE_URL,
    },

    jwt: {
        accessSecret: process.env.JWT_ACCESS_SECRET,
        refreshSecret: process.env.JWT_REFRESH_SECRET,
        accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
    },

    email: {
        resendApiKey: process.env.RESEND_API_KEY,
        fromEmail: process.env.RESEND_FROM_EMAIL,
    },

    clientUrl: process.env.CLIENT_URL || null,
};