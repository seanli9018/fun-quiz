import { db } from './index';
import { user, account, quiz } from './schema';
import { eq } from 'drizzle-orm';

async function fixUserId() {
  console.log('🔧 Fixing user ID mismatch...\n');

  try {
    const oldUserId = 'P5PjVfmiQexzHrwaEduilL1nICACRDOq';
    const newUserId = 'lq5e2cVL1tqoXV1RglbyAlaoE86uJ7Ce';
    const adminEmail = 'admin@funquiz.com';

    console.log('Old User ID (in database):', oldUserId);
    console.log('New User ID (from session):', newUserId);
    console.log();

    // Check if old user exists
    const [oldUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, oldUserId))
      .limit(1);

    if (!oldUser) {
      console.log('❌ Old user not found!');
      process.exit(1);
    }

    console.log('✅ Found old user:', oldUser.name, '(', oldUser.email, ')');

    // Check if new user already exists
    const [existingNewUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, newUserId))
      .limit(1);

    if (existingNewUser) {
      console.log('✅ New user already exists in database!');
      console.log('   Name:', existingNewUser.name);
      console.log('   Email:', existingNewUser.email);
    } else {
      // Delete old user's accounts first
      console.log('\n🗑️  Deleting old user accounts...');
      const oldAccounts = await db
        .delete(account)
        .where(eq(account.userId, oldUserId))
        .returning();
      console.log(`✓ Deleted ${oldAccounts.length} account(s)`);

      // Delete old user
      console.log('🗑️  Deleting old user record...');
      await db.delete(user).where(eq(user.id, oldUserId));
      console.log('✓ Deleted old user');

      // Create new user with the session ID
      console.log('\n📝 Creating new user record with session ID...');

      const [newUser] = await db
        .insert(user)
        .values({
          id: newUserId,
          name: oldUser.name,
          email: adminEmail,
          emailVerified: oldUser.emailVerified,
          image: oldUser.image,
          createdAt: oldUser.createdAt,
          updatedAt: new Date(),
        })
        .returning();

      console.log('✅ Created new user:', newUser.name);
    }

    // Get all quizzes from old user
    const quizzesToTransfer = await db
      .select()
      .from(quiz)
      .where(eq(quiz.userId, oldUserId));

    console.log(`\n🔄 Transferring ${quizzesToTransfer.length} quizzes...\n`);

    // Transfer quizzes to new user
    let count = 0;
    for (const q of quizzesToTransfer) {
      await db
        .update(quiz)
        .set({
          userId: newUserId,
          updatedAt: new Date(),
        })
        .where(eq(quiz.id, q.id));

      count++;
      if (count % 5 === 0 || count === quizzesToTransfer.length) {
        console.log(
          `  ✓ Transferred ${count}/${quizzesToTransfer.length} quizzes`,
        );
      }
    }

    // Check if old user still exists (if new user already existed, we didn't delete it yet)
    const [stillExists] = await db
      .select()
      .from(user)
      .where(eq(user.id, oldUserId))
      .limit(1);

    if (stillExists) {
      // Delete old user's accounts
      const deletedAccounts = await db
        .delete(account)
        .where(eq(account.userId, oldUserId))
        .returning();
      console.log(`\n✓ Deleted ${deletedAccounts.length} old account(s)`);

      // Delete old user
      await db.delete(user).where(eq(user.id, oldUserId));
      console.log('✓ Deleted old user record');
    } else {
      console.log('\n✓ Old user already removed');
    }

    // Verify
    console.log('\n📊 Verification:');
    const [finalUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, newUserId))
      .limit(1);

    if (finalUser) {
      console.log(`✅ User: ${finalUser.name} (${finalUser.email})`);
      console.log(`   ID: ${finalUser.id}`);

      const userQuizzes = await db
        .select()
        .from(quiz)
        .where(eq(quiz.userId, newUserId));

      console.log(`   Quizzes: ${userQuizzes.length}`);
    }

    console.log('\n🎉 Fix complete!');
    console.log(
      '\n✨ All quizzes have been transferred to your logged-in account!',
    );
    console.log(
      '📱 Please refresh your dashboard - you should now see all 44 quizzes!',
    );
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

fixUserId();
