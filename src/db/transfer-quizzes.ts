import { db } from './index';
import { quiz, user } from './schema';
import { eq } from 'drizzle-orm';

async function transferQuizzes() {
  console.log('🔄 Quiz Transfer Tool\n');

  try {
    // Get the target user ID from command line argument
    const targetUserId = process.argv[2];

    if (!targetUserId) {
      console.log('❌ Please provide the target user ID as an argument\n');
      console.log('Usage: npx tsx src/db/transfer-quizzes.ts <target-user-id>\n');
      console.log('To find your user ID:');
      console.log('  1. Log in to your account');
      console.log('  2. Open browser developer console');
      console.log('  3. Type: sessionStorage or check network requests for user data\n');
      console.log('Or run: npx tsx src/db/list-all-users.ts');
      process.exit(1);
    }

    console.log(`Target User ID: ${targetUserId}\n`);

    // Verify target user exists
    const [targetUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, targetUserId))
      .limit(1);

    if (!targetUser) {
      console.log('❌ Error: User with this ID does not exist!\n');
      console.log('Run: npx tsx src/db/list-all-users.ts to see all users');
      process.exit(1);
    }

    console.log('✅ Target user found:');
    console.log(`   Name: ${targetUser.name}`);
    console.log(`   Email: ${targetUser.email}\n`);

    // Get all users with quizzes
    const allUsers = await db.select().from(user);

    console.log('📊 Current quiz ownership:\n');

    for (const u of allUsers) {
      const userQuizzes = await db
        .select()
        .from(quiz)
        .where(eq(quiz.userId, u.id));

      if (userQuizzes.length > 0) {
        console.log(`   ${u.name} (${u.email}): ${userQuizzes.length} quizzes`);
      }
    }

    // Get quizzes to transfer (all quizzes NOT owned by target user)
    const allQuizzes = await db.select().from(quiz);
    const quizzesToTransfer = allQuizzes.filter(
      (q) => q.userId !== targetUserId
    );

    if (quizzesToTransfer.length === 0) {
      console.log('\n✅ No quizzes need to be transferred.');
      console.log(`   All quizzes are already owned by ${targetUser.name}`);
      process.exit(0);
    }

    console.log(`\n🔄 Found ${quizzesToTransfer.length} quizzes to transfer\n`);
    console.log('Transferring quizzes...\n');

    // Transfer quizzes
    let transferredCount = 0;
    for (const quizToTransfer of quizzesToTransfer) {
      await db
        .update(quiz)
        .set({
          userId: targetUserId,
          updatedAt: new Date()
        })
        .where(eq(quiz.id, quizToTransfer.id));

      transferredCount++;
      console.log(`   ✓ [${transferredCount}/${quizzesToTransfer.length}] ${quizToTransfer.title}`);
    }

    console.log(`\n✅ Successfully transferred ${transferredCount} quizzes!`);
    console.log(`\n📊 Final ownership:`);
    console.log(`   ${targetUser.name} (${targetUser.email}): ${allQuizzes.length} quizzes`);
    console.log('\n🎉 Transfer complete!');
    console.log('\nYou can now refresh your dashboard to see all quizzes.');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

transferQuizzes();
