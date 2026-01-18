
import { db } from '../src/db';

async function main() {
    console.log('Starting migration for Auth Roles and Shops...');

    try {
        // 1. Create shops table
        console.log('Creating shops table...');
        await db.pool.query(`
            CREATE TABLE IF NOT EXISTS shops (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                owner_email VARCHAR(255) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `);

        // 2. Update users table
        console.log('Updating users table schema...');
        await db.pool.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES shops(id);
        `);

        // Check current roles logic - we might need to update existing users roles?
        // Assuming existing users are fine or will be updated manually.

        // 3. Update surveys table
        console.log('Updating surveys table schema...');
        await db.pool.query(`
            ALTER TABLE surveys 
            ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES shops(id);
        `);

        console.log('Migration completed successfully.');
        process.exit(0);

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

main();
