import { db } from './index';
import { quiz, user } from './schema';
import { eq } from 'drizzle-orm';

async function checkQuizzes() {
  console.log('\n=== Checking Quiz Data ===\n');

  try {
    // Get all quizzes with user info
    const quizzes = await db
      .select({
        id: quiz.id,
        title: quiz.title,
        isPublic: quiz.isPublic,
        userId: quiz.userId,
        userEmail: user.email,
      })
      .from(quiz)
      .leftJoin(user, eq(quiz.userId, user.id))
      .limit(10);

    console.log(`Found ${quizzes.length} quizzes:\n`);
    quizzes.forEach((q) => {
      console.log(`  - "${q.title}"`);
      console.log(`    ID: ${q.id}`);
      console.log(`    Public: ${q.isPublic}`);
      console.log(`    User ID: ${q.userId}`);
      console.log(`    User Email: ${q.userEmail}`);
      console.log('');
    });

    // Get all users
    const users = await db.select({ id: user.id, email: user.email }).from(user);
    console.log(`\nAll users (${users.length}):`);
    users.forEach((u) => {
      console.log(`  - ${u.email} (${u.id})`);
    });

    // Count public quizzes
    const publicQuizzes = await db
      .select()
      .from(quiz)
      .where(eq(quiz.isPublic, true));
    console.log(`\nPublic quizzes: ${publicQuizzes.length}`);

    console.log('\n✓ Check completed\n');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

checkQuizzes();
