import { db } from './index';
import { user } from './schema';
import { eq } from 'drizzle-orm';

async function debugUserMismatch() {
  console.log('🔍 Debugging user ID mismatch...\n');

  try {
    const adminEmail = 'admin@funquiz.com';

    // Get all users from database
    console.log('📊 All users in database:');
    const allUsers = await db.select().from(user);

    console.log(`Found ${allUsers.length} user(s):\n`);

    allUsers.forEach((u, index) => {
      console.log(`User ${index + 1}:`);
      console.log(`  ID: ${u.id}`);
      console.log(`  Name: ${u.name}`);
      console.log(`  Email: ${u.email}`);
      console.log(`  Email Verified: ${u.emailVerified}`);
      console.log(`  Created: ${u.createdAt}`);
      console.log();
    });

    // Check specific admin user
    const [adminUser] = await db
      .select()
      .from(user)
      .where(eq(user.email, adminEmail))
      .limit(1);

    if (!adminUser) {
      console.log('❌ No admin user found with email:', adminEmail);
      console.log('\n💡 This means you need to create a new account or update the email.');
      process.exit(1);
    }

    console.log('✅ Found admin user in database:');
    console.log(`   ID: ${adminUser.id}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Name: ${adminUser.name}`);

    console.log('\n📝 Instructions:');
    console.log('1. When you log in, check what user ID is in your session');
    console.log('2. If the session user ID is different from the database user ID above,');
    console.log('   it means you have multiple accounts or a session mismatch');
    console.log('\n3. To fix this, you can:');
    console.log('   a) Log out and log back in with the correct account');
    console.log('   b) Or transfer the quizzes to your current logged-in user ID');

    console.log('\n🔑 Database Admin User ID:');
    console.log(`   ${adminUser.id}`);
    console.log('\nCompare this with the user ID in your session when logged in.');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

debugUserMismatch();
