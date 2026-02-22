// Load environment variables FIRST before any other imports
import dotenv from 'dotenv';
dotenv.config();

// Now import everything else
import { db } from './index.js';
import { quiz, quizAttempt, user, question } from './schema.js';
import { nanoid } from 'nanoid';
import { eq, sql } from 'drizzle-orm';

/**
 * Seed random quiz attempts for all quizzes to populate statistics
 *
 * This script:
 * 1. Fetches all quizzes from the database
 * 2. Generates random attempts with varying scores
 * 3. Creates both authenticated and anonymous attempts
 * 4. Uses realistic distributions for better demo data
 * 5. Varies popularity levels (some quizzes more popular than others)
 */

async function seedQuizAttempts() {
  console.log('\n=== Seeding Quiz Attempts ===\n');

  try {
    // Verify database connection
    console.log('0. Verifying database connection...');
    console.log(`   DATABASE_URL: ${process.env.DATABASE_URL}`);

    // Check which database we're actually connected to
    const dbCheck = await db.execute(
      sql`SELECT current_database() as db_name,
          (SELECT COUNT(*) FROM quiz) as quiz_count,
          (SELECT COUNT(*) FROM quiz_attempt) as attempt_count`,
    );
    console.log(`   Connected to database: ${dbCheck.rows[0].db_name}`);
    console.log(`   Quizzes in database: ${dbCheck.rows[0].quiz_count}`);
    console.log(`   Attempts in database: ${dbCheck.rows[0].attempt_count}`);

    // Test connection by counting existing attempts
    const existingAttempts = await db.select().from(quizAttempt);
    console.log(
      `   Found ${existingAttempts.length} existing attempts via Drizzle ORM\n`,
    );

    // Fetch all quizzes
    console.log('1. Fetching all quizzes...');
    const quizzes = await db.select().from(quiz);
    console.log(`   Found ${quizzes.length} quizzes\n`);

    if (quizzes.length === 0) {
      console.log('No quizzes found. Please create some quizzes first.');
      return;
    }

    // Fetch all users (to use some as attempt creators)
    console.log('2. Fetching users...');
    const users = await db.select().from(user);
    console.log(`   Found ${users.length} users\n`);

    let totalAttempts = 0;

    // For each quiz, create random attempts
    for (let i = 0; i < quizzes.length; i++) {
      const quizRecord = quizzes[i];
      console.log(
        `3. Processing quiz ${i + 1}/${quizzes.length}: "${quizRecord.title}"`,
      );

      // Get questions for this quiz to calculate max score
      const questions = await db
        .select()
        .from(question)
        .where(eq(question.quizId, quizRecord.id));

      const maxScore = questions.reduce((sum, q) => sum + q.points, 0);

      if (maxScore === 0) {
        console.log('   ⚠ Quiz has no questions, skipping...\n');
        continue;
      }

      // Generate varied popularity levels - some quizzes more popular than others
      // 20% very popular (100-200 attempts)
      // 30% popular (30-99 attempts)
      // 30% moderate (10-29 attempts)
      // 20% less popular (5-9 attempts)
      const rand = Math.random();
      let numAttempts;

      if (rand < 0.2) {
        // Very popular
        numAttempts = Math.floor(Math.random() * 101) + 100; // 100-200
      } else if (rand < 0.5) {
        // Popular
        numAttempts = Math.floor(Math.random() * 70) + 30; // 30-99
      } else if (rand < 0.8) {
        // Moderate
        numAttempts = Math.floor(Math.random() * 20) + 10; // 10-29
      } else {
        // Less popular
        numAttempts = Math.floor(Math.random() * 5) + 5; // 5-9
      }

      console.log(
        `   Creating ${numAttempts} attempts (max score: ${maxScore})...`,
      );

      const attempts = [];

      for (let j = 0; j < numAttempts; j++) {
        // 70% chance of authenticated user, 30% anonymous
        const isAuthenticated = Math.random() > 0.3;
        const userId =
          isAuthenticated && users.length > 0
            ? users[Math.floor(Math.random() * users.length)].id
            : null;

        // Generate score with a bell curve distribution (favoring middle scores)
        // Using Box-Muller transform for normal distribution
        const u1 = Math.random();
        const u2 = Math.random();
        const normalRandom =
          Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

        // Transform to 0-1 range with mean at 0.65 (slightly above average)
        let normalizedScore = 0.65 + normalRandom * 0.15;

        // Clamp between 0 and 1
        normalizedScore = Math.max(0, Math.min(1, normalizedScore));

        // Calculate actual score
        const score = Math.floor(normalizedScore * maxScore);
        const percentage = Math.round((score / maxScore) * 100);

        // Random completion time in the past 60 days
        const daysAgo = Math.floor(Math.random() * 60);
        const hoursAgo = Math.floor(Math.random() * 24);
        const minutesAgo = Math.floor(Math.random() * 60);
        const completedAt = new Date();
        completedAt.setDate(completedAt.getDate() - daysAgo);
        completedAt.setHours(completedAt.getHours() - hoursAgo);
        completedAt.setMinutes(completedAt.getMinutes() - minutesAgo);

        attempts.push({
          id: nanoid(),
          quizId: quizRecord.id,
          userId,
          score,
          maxScore,
          percentage,
          completedAt,
        });
      }

      // Insert all attempts for this quiz in batches to avoid overwhelming the database
      const batchSize = 100;
      for (let k = 0; k < attempts.length; k += batchSize) {
        const batch = attempts.slice(k, k + batchSize);
        await db.insert(quizAttempt).values(batch);
      }

      totalAttempts += numAttempts;
      console.log(`   ✓ Created ${numAttempts} attempts\n`);
    }

    console.log('=== Summary ===');
    console.log(`Total quizzes processed: ${quizzes.length}`);
    console.log(`Total attempts created: ${totalAttempts}`);
    console.log(
      `Average attempts per quiz: ${Math.round(totalAttempts / quizzes.length)}`,
    );

    // Show some example statistics
    console.log('\n=== Sample Statistics ===');

    // Get top 3 most attempted quizzes
    const allAttempts = await db.select().from(quizAttempt);
    const attemptsByQuiz = new Map<string, number>();

    allAttempts.forEach((attempt) => {
      const count = attemptsByQuiz.get(attempt.quizId) || 0;
      attemptsByQuiz.set(attempt.quizId, count + 1);
    });

    const sorted = Array.from(attemptsByQuiz.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    console.log('\nTop 3 Most Popular Quizzes:');
    for (const [quizId, count] of sorted) {
      const quizRecord = quizzes.find((q) => q.id === quizId);
      if (quizRecord) {
        const quizAttempts = allAttempts.filter((a) => a.quizId === quizId);
        const avgScore = Math.round(
          quizAttempts.reduce((sum, a) => sum + a.percentage, 0) /
            quizAttempts.length,
        );
        const uniqueUsers = new Set(
          quizAttempts.filter((a) => a.userId).map((a) => a.userId),
        ).size;

        console.log(`\n  "${quizRecord.title}"`);
        console.log(`    Total attempts: ${count}`);
        console.log(`    Unique users: ${uniqueUsers}`);
        console.log(`    Anonymous: ${count - uniqueUsers}`);
        console.log(`    Average score: ${avgScore}%`);
      }
    }

    console.log('\n✓ Quiz attempts seeded successfully!');
    console.log('Visit /take-quiz to see the statistics on quiz cards.\n');
  } catch (error) {
    console.error('Error seeding quiz attempts:', error);
    throw error;
  }
}

// Run the seed script
seedQuizAttempts()
  .then(() => {
    console.log('✓ Seed script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('✗ Seed script failed:', error);
    process.exit(1);
  });
