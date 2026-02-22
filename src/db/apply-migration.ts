import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function applyMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL!,
  });

  try {
    console.log('Connecting to database...');
    const client = await pool.connect();

    console.log('Reading migration file...');
    const migrationPath = path.join(
      __dirname,
      '../../drizzle/0001_motionless_firelord.sql',
    );
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('Applying migration...');
    await client.query(migrationSQL);

    console.log('✓ Migration applied successfully!');

    client.release();
  } catch (error: any) {
    if (error.code === '42P07') {
      console.log('⚠ Table already exists, migration already applied.');
    } else {
      console.error('Error applying migration:', error);
      throw error;
    }
  } finally {
    await pool.end();
  }
}

applyMigration()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });
