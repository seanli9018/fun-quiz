import { db } from './index';
import { user, quiz } from './schema';
import { eq, sql } from 'drizzle-orm';

async function listAllUsers() {
  console.log('👥 Listing all users in the database...\n');

  try {
    // Get all users
    const allUsers = await db.select().from(user);

    if (allUsers.length === 0) {
      console.log('❌ No users found in the database!');
      process.exit(1);
    }

    console.log(`Found ${allUsers.length} user(s):\n`);

    for (const u of allUsers) {
      console.log('─'.repeat(60));
      console.log(`👤 User: ${u.name}`);
      console.log(`   ID: ${u.id}`);
      console.log(`   Email: ${u.email}`);
      console.log(`   Email Verified: ${u.emailVerified}`);
      console.log(`   Created: ${u.createdAt}`);

      // Count quizzes for this user
      const userQuizzes = await db
        .select()
        .from(quiz)
        .where(eq(quiz.userId, u.id));

      console.log(`   Quizzes: ${userQuizzes.length}`);

      if (userQuizzes.length > 0) {
        console.log(`\n   Quiz Titles:`);
        userQuizzes.slice(0, 5).forEach((q, i) => {
          console.log(`      ${i + 1}. ${q.title} (${q.isPublic ? 'Public' : 'Private'})`);
        });
        if (userQuizzes.length > 5) {
          console.log(`      ... and ${userQuizzes.length - 5} more`);
        }
      }
      console.log();
    }

    console.log('─'.repeat(60));
    console.log('\n📊 Summary:');
    console.log(`   Total users: ${allUsers.length}`);

    const totalQuizzes = await db.select().from(quiz);
    console.log(`   Total quizzes in database: ${totalQuizzes.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

listAllUsers();
