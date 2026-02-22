import { db } from './index';
import { quiz, quizAttempt } from './schema';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function checkDatabase() {
  try {
    console.log('\n=== Database Connection Check ===\n');
    console.log('Connection string:', process.env.DATABASE_URL);

    // Get current database using raw SQL
    const dbResult = await db.execute(sql`SELECT current_database()`);
    console.log('\nCurrent database:', dbResult.rows[0]);

    // Count quizzes and attempts using Drizzle ORM
    const quizzes = await db.select().from(quiz);
    const attempts = await db.select().from(quizAttempt);

    console.log('\nData counts:');
    console.log(`  Quizzes: ${quizzes.length}`);
    console.log(`  Attempts: ${attempts.length}`);

    // Count unique users
    const uniqueUsers = new Set(
      attempts.filter((a) => a.userId).map((a) => a.userId),
    );
    console.log(`  Unique users with attempts: ${uniqueUsers.size}`);
    console.log(
      `  Anonymous attempts: ${attempts.filter((a) => !a.userId).length}`,
    );

    // Show sample quiz with attempts
    if (attempts.length > 0) {
      const attemptsByQuiz = new Map<string, number>();
      const scoresByQuiz = new Map<string, number[]>();

      attempts.forEach((attempt) => {
        const count = attemptsByQuiz.get(attempt.quizId) || 0;
        attemptsByQuiz.set(attempt.quizId, count + 1);

        const scores = scoresByQuiz.get(attempt.quizId) || [];
        scores.push(attempt.percentage);
        scoresByQuiz.set(attempt.quizId, scores);
      });

      const sorted = Array.from(attemptsByQuiz.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

      console.log('\nTop 3 quizzes by attempts:');
      sorted.forEach(([quizId, count]) => {
        const quizRecord = quizzes.find((q) => q.id === quizId);
        if (quizRecord) {
          const scores = scoresByQuiz.get(quizId) || [];
          const avgScore = Math.round(
            scores.reduce((sum, s) => sum + s, 0) / scores.length,
          );
          console.log(
            `  "${quizRecord.title}": ${count} attempts, ${avgScore}% avg`,
          );
        }
      });
    }

    console.log('\n✓ Check completed\n');
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

checkDatabase()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Check failed:', error);
    process.exit(1);
  });
