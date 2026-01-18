
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
        const tables = ['shops', 'users', 'surveys'];
        for (const table of tables) {
            console.log(`\n--- Table: ${table} ---`);
            const res = await pool.query(`
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_name = '${table}'
            `);
            console.table(res.rows);

            // FKs
            const fks = await pool.query(`
                SELECT
                    kcu.column_name,
                    ccu.table_name AS foreign_table_name,
                    ccu.column_name AS foreign_column_name
                FROM information_schema.key_column_usage AS kcu
                JOIN information_schema.constraint_column_usage AS ccu
                    ON kcu.constraint_name = ccu.constraint_name
                WHERE kcu.table_name = '${table}'
            `);
            if (fks.rows.length > 0) {
                console.log('Foreign Keys:');
                console.table(fks.rows);
            }
        }
    } catch (error) {
        console.error(error);
    } finally {
        await pool.end();
    }
}

main();
