
import { db } from '../src/db';

async function main() {
    console.log('Creating users table...');

    await db.pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'user',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

    console.log('Users table created/verified.');

    const email = process.argv[2];
    if (email) {
        console.log(`Adding admin user: ${email}`);
        await db.pool.query(`
        INSERT INTO users (email, role)
        VALUES ($1, 'admin')
        ON CONFLICT (email) DO UPDATE SET role = 'admin'
      `, [email]);
        console.log('Admin added.');
    } else {
        console.log('No email provided to seed. Usage: tsx scripts/setup-users.ts <email>');
    }

    process.exit(0);
}

main().catch(console.error);
