import { db } from './index';
import { user, quiz } from './schema';
import { eq } from 'drizzle-orm';

async function verifyAdminQuizzes() {
  console.log('🔍 Verifying admin quizzes...\n');

  try {
    const adminEmail = 'admin@funquiz.com';

    // Find admin user
    const [adminUser] = await db
      .select()
      .from(user)
      .where(eq(user.email, adminEmail))
      .limit(1);

    if (!adminUser) {
      console.log('❌ Admin user not found!');
      process.exit(1);
    }

    console.log('✅ Admin User:');
    console.log(`   ID: ${adminUser.id}`);
    console.log(`   Name: ${adminUser.name}`);
    console.log(`   Email: ${adminUser.email}`);

    // Get all quizzes for admin
    const adminQuizzes = await db
      .select()
      .from(quiz)
      .where(eq(quiz.userId, adminUser.id));

    console.log(`\n✅ Found ${adminQuizzes.length} quizzes for admin\n`);

    if (adminQuizzes.length > 0) {
      console.log('📚 Quiz List:');
      adminQuizzes.forEach((q, index) => {
        console.log(`   ${index + 1}. ${q.title}`);
        console.log(`      - Public: ${q.isPublic ? 'Yes' : 'No'}`);
        console.log(`      - Created: ${q.createdAt}`);
      });
    }

    console.log('\n📊 Summary:');
    console.log(`   - Total quizzes: ${adminQuizzes.length}`);
    console.log(`   - Public quizzes: ${adminQuizzes.filter((q) => q.isPublic).length}`);
    console.log(`   - Private quizzes: ${adminQuizzes.filter((q) => !q.isPublic).length}`);

    console.log('\n🎉 Verification complete!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

verifyAdminQuizzes();
