
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

function slugify(text: string) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')     // Replace spaces with -
        .replace(/[^\w\-]+/g, '') // Remove all non-word chars
        .replace(/\-\-+/g, '-');  // Replace multiple - with single -
}

async function main() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log('--- Migrating Shops to Organizations ---');

        // 1. Get all shops
        const shopsRes = await client.query('SELECT * FROM shops');
        const shops = shopsRes.rows;
        console.log(`Found ${shops.length} shops to migrate.`);

        for (const shop of shops) {
            // Check if already exists in organizations (by id)
            const existing = await client.query('SELECT id FROM organizations WHERE id = $1', [shop.id]);
            if (existing.rows.length > 0) {
                console.log(`Organization ${shop.id} already exists. Skipping.`);
                continue;
            }

            // Generate slug
            let slug = slugify(shop.name);
            // Ensure unique slug (simple append if needed, though rare for migration of existing valid shops)
            // For now assuming existing shop names are unique enough or don't clash

            console.log(`Migrating shop: ${shop.name} -> Org: ${slug}`);

            await client.query(
                `INSERT INTO organizations (id, name, slug, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5)`,
                [shop.id, shop.name, slug, shop.created_at, shop.updated_at]
            );
        }

        console.log('--- Updating Users org_id ---');
        const usersUpdate = await client.query(`
            UPDATE users 
            SET org_id = shop_id 
            WHERE shop_id IS NOT NULL AND org_id IS NULL
        `);
        console.log(`Updated ${usersUpdate.rowCount} users.`);

        console.log('--- Updating Surveys org_id ---');
        const surveysUpdate = await client.query(`
            UPDATE surveys 
            SET org_id = shop_id 
            WHERE shop_id IS NOT NULL AND org_id IS NULL
        `);
        console.log(`Updated ${surveysUpdate.rowCount} surveys.`);

        await client.query('COMMIT');
        console.log('Migration completed successfully.');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

main();
