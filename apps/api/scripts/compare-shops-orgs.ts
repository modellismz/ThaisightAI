
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
        console.log('--- Shops count ---');
        const shopsCount = await pool.query('SELECT COUNT(*) FROM shops');
        console.log(shopsCount.rows[0].count);

        console.log('--- Organizations count ---');
        const orgsCount = await pool.query('SELECT COUNT(*) FROM organizations');
        console.log(orgsCount.rows[0].count);

        console.log('--- Surveys (shop_id vs org_id) ---');
        const surveys = await pool.query('SELECT count(shop_id) as shop_id_count, count(org_id) as org_id_count FROM surveys');
        console.table(surveys.rows);

        console.log('--- Users (shop_id vs org_id) ---');
        // Check if users table also has org_id
        try {
            const users = await pool.query('SELECT count(shop_id) as shop_id_count, count(org_id) as org_id_count FROM users');
            console.table(users.rows);
        } catch (e) {
            console.log('Users table might not have org_id column yet.');
        }

    } catch (error) {
        console.error(error);
    } finally {
        await pool.end();
    }
}

main();
