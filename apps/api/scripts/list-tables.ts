
import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: 'apps/api/.env' });

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'thaisight',
    password: process.env.DB_PASSWORD || 'thaisight_dev',
    database: process.env.DB_NAME || 'thaisight',
});

async function main() {
    try {
        const res = await pool.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);
        console.table(res.rows);
    } catch (error) {
        console.error(error);
    } finally {
        await pool.end();
    }
}

main();
