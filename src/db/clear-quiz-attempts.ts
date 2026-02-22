// Load environment variables FIRST before any other imports
import dotenv from 'dotenv';
dotenv.config();

import { quizAttempt } from './schema';
// Now import everything else
import { db } from './index';

/**
 * Clear all quiz attempts from the database
 *
 * This script deletes all records from the quiz_attempt table.
 * Use this before re-seeding data or to reset statistics.
 */

async function clearQuizAttempts() {
  console.log('\n=== Clearing Quiz Attempts ===\n');

  try {
    // Verify database connection
    console.log('1. Verifying database connection...');
    console.log(`   DATABASE_URL: ${process.env.DATABASE_URL}`);

    // Count existing attempts
    const existingAttempts = await db.select().from(quizAttempt);
    console.log(`   Found ${existingAttempts.length} attempts in database\n`);

    if (existingAttempts.length === 0) {
      console.log('✓ No attempts to clear. Database is already empty.\n');
      return;
    }

    // Delete all attempts
    console.log('2. Deleting all quiz attempts...');
    await db.delete(quizAttempt);

    // Verify deletion
    const remainingAttempts = await db.select().from(quizAttempt);
    console.log(`   Attempts remaining: ${remainingAttempts.length}\n`);

    if (remainingAttempts.length === 0) {
      console.log('✓ Successfully cleared all quiz attempts!\n');
    } else {
      console.warn(
        '⚠ Some attempts may still remain. Please check manually.\n',
      );
    }
  } catch (error) {
    console.error('Error clearing quiz attempts:', error);
    throw error;
  }
}

// Run the clear script
clearQuizAttempts()
  .then(() => {
    console.log('✓ Clear script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('✗ Clear script failed:', error);
    process.exit(1);
  });
