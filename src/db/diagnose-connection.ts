import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function diagnoseConnections() {
  console.log('\n=== Database Connection Diagnostics ===\n');

  // Show environment variable
  console.log('1. Environment Variables:');
  console.log(`   DATABASE_URL from .env: ${process.env.DATABASE_URL}\n`);

  // Test with direct Pool connection
  console.log('2. Testing direct Pool connection:');
  const pool1 = new Pool({
    connectionString: process.env.DATABASE_URL!,
  });

  try {
    const client1 = await pool1.connect();
    const result1 = await client1.query('SELECT current_database()');
    console.log(`   Connected to: ${result1.rows[0].current_database}`);

    const countResult1 = await client1.query('SELECT COUNT(*) FROM quiz_attempt');
    console.log(`   quiz_attempt count: ${countResult1.rows[0].count}\n`);

    client1.release();
  } catch (error) {
    console.error('   Error with Pool:', error);
  } finally {
    await pool1.end();
  }

  // Test with Drizzle ORM (like the app uses)
  console.log('3. Testing Drizzle ORM connection:');
  const pool2 = new Pool({
    connectionString: process.env.DATABASE_URL!,
  });

  const db = drizzle(pool2);

  try {
    const result2 = await db.execute(
      // @ts-ignore
      { sql: 'SELECT current_database()', params: [] }
    );
    console.log(`   Connected to: ${JSON.stringify(result2.rows[0])}`);

    const countResult2 = await db.execute(
      // @ts-ignore
      { sql: 'SELECT COUNT(*) FROM quiz_attempt', params: [] }
    );
    console.log(`   quiz_attempt count: ${countResult2.rows[0].count}\n`);
  } catch (error) {
    console.error('   Error with Drizzle:', error);
  } finally {
    await pool2.end();
  }

  // Test with the actual db instance from the app
  console.log('4. Testing app\'s db instance:');
  const { db: appDb } = await import('./index.js');

  try {
    const result3 = await appDb.execute(
      // @ts-ignore
      { sql: 'SELECT current_database()', params: [] }
    );
    console.log(`   Connected to: ${JSON.stringify(result3.rows[0])}`);

    const countResult3 = await appDb.execute(
      // @ts-ignore
      { sql: 'SELECT COUNT(*) FROM quiz_attempt', params: [] }
    );
    console.log(`   quiz_attempt count: ${countResult3.rows[0].count}\n`);
  } catch (error) {
    console.error('   Error with app db:', error);
  }

  console.log('=== Diagnosis Complete ===\n');
}

diagnoseConnections()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Diagnosis failed:', error);
    process.exit(1);
  });
