import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

let connection = null;
let dbAvailable = false;

export async function setupDb() {
    if (connection) {
        console.log("db is available");
        return { connection, dbAvailable };
    }
    try {
        const pool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

        // Simple test query
        await pool.query('SELECT 1');
        connection = pool;
        dbAvailable = true;
        console.log('[DB] Connected to MySQL');
    } catch (err) {
        console.error('[DB] MySQL unavailable, falling back to local file.');
        dbAvailable = false;
    }
    return { connection, dbAvailable }
};