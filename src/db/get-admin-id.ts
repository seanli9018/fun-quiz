import { db } from './index';
import { user } from './schema';
import { eq } from 'drizzle-orm';

async function getAdminId() {
  console.log('🔍 Looking up admin user ID...\n');

  try {
    const adminEmail = 'admin@funquiz.com';

    const [adminUser] = await db
      .select()
      .from(user)
      .where(eq(user.email, adminEmail))
      .limit(1);

    if (!adminUser) {
      console.log('❌ Admin user not found!');
      process.exit(1);
    }

    console.log('✅ Admin user found:');
    console.log(`   ID: ${adminUser.id}`);
    console.log(`   Name: ${adminUser.name}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Created: ${adminUser.createdAt}`);
    console.log('\n📋 Use this ID for seeding quizzes.');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

getAdminId();
