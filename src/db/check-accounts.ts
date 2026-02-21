import { db } from './index';
import { user, account } from './schema';
import { eq } from 'drizzle-orm';

async function checkAccounts() {
  console.log('🔍 Checking all users and accounts...\n');

  try {
    // Get all users
    const allUsers = await db.select().from(user);
    console.log(`📊 Found ${allUsers.length} user(s) in user table:\n`);

    for (const u of allUsers) {
      console.log('─'.repeat(70));
      console.log(`👤 User:`);
      console.log(`   ID: ${u.id}`);
      console.log(`   Name: ${u.name}`);
      console.log(`   Email: ${u.email}`);
      console.log(`   Email Verified: ${u.emailVerified}`);
      console.log(`   Created: ${u.createdAt}`);

      // Get accounts for this user
      const userAccounts = await db
        .select()
        .from(account)
        .where(eq(account.userId, u.id));

      console.log(`   Accounts: ${userAccounts.length}`);
      userAccounts.forEach((acc) => {
        console.log(`      - Provider: ${acc.providerId}`);
        console.log(`        Account ID: ${acc.accountId}`);
        console.log(`        Has Password: ${acc.password ? 'Yes' : 'No'}`);
      });
      console.log();
    }

    // Get all accounts
    const allAccounts = await db.select().from(account);
    console.log(
      `\n📊 Found ${allAccounts.length} account(s) in account table:\n`,
    );

    for (const acc of allAccounts) {
      console.log('─'.repeat(70));
      console.log(`🔐 Account:`);
      console.log(`   ID: ${acc.id}`);
      console.log(`   Account ID: ${acc.accountId}`);
      console.log(`   Provider: ${acc.providerId}`);
      console.log(`   User ID: ${acc.userId}`);
      console.log(`   Has Password: ${acc.password ? 'Yes' : 'No'}`);
      console.log(`   Created: ${acc.createdAt}`);

      // Check if user exists
      const [linkedUser] = await db
        .select()
        .from(user)
        .where(eq(user.id, acc.userId))
        .limit(1);

      if (linkedUser) {
        console.log(
          `   ✅ Linked User: ${linkedUser.name} (${linkedUser.email})`,
        );
      } else {
        console.log(`   ❌ User NOT FOUND - Orphaned account!`);
      }
      console.log();
    }

    console.log('─'.repeat(70));
    console.log('\n💡 If you see orphaned accounts or mismatched user IDs,');
    console.log('   that explains why quizzes are not showing up.\n');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

checkAccounts();
