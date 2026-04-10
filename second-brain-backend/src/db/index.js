import pg from 'pg';
import {config} from '../config/env.js';

const { Pool } = pg;

export const pool = new Pool({
    connectionString: config.db.url,
    ssl: {
        rejectUnauthorized: false,
    },
    max:20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 200000,

});
export const connectDB = async () => {
    try {
        await pool.connect();
        console.log('Connected to database');
    } catch (error) {
        console.error('Error connecting to database', error);
        process.exit(1);
    }
};
export const query =(text, params) => pool.query(text, params);

