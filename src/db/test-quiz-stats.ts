import { db } from './index';
import {
  createQuiz,
  getQuizById,
  getQuizzes,
} from './repositories/quiz';
import {
  saveQuizAttempt,
  getQuizStats,
  getMultipleQuizStats,
  formatCompletionCount,
} from './repositories/quiz-attempts';
import type { CreateQuizInput } from './types';

/**
 * Test script to demonstrate quiz attempts and statistics functionality
 *
 * This script:
 * 1. Creates a test quiz
 * 2. Simulates multiple users completing it
 * 3. Retrieves and displays statistics
 * 4. Shows how stats appear in quiz listings
 */

async function testQuizStatistics() {
  console.log('\n=== Testing Quiz Attempts & Statistics ===\n');

  try {
    // Create a test quiz
    console.log('1. Creating test quiz...');
    const testQuizInput: CreateQuizInput = {
      title: 'Statistics Test Quiz',
      description: 'A quiz to test the statistics functionality',
      isPublic: true,
      tagIds: [],
      questions: [
        {
          text: 'What is 2 + 2?',
          order: 0,
          points: 10,
          answers: [
            { text: '3', isCorrect: false, order: 0 },
            { text: '4', isCorrect: true, order: 1 },
            { text: '5', isCorrect: false, order: 2 },
          ],
        },
        {
          text: 'What is the capital of France?',
          order: 1,
          points: 10,
          answers: [
            { text: 'London', isCorrect: false, order: 0 },
            { text: 'Paris', isCorrect: true, order: 1 },
            { text: 'Berlin', isCorrect: false, order: 2 },
          ],
        },
      ],
    };

    // Note: You need to provide a valid user ID for testing
    const testUserId = 'test-user-id-123'; // Replace with actual user ID
    const quiz = await createQuiz(testUserId, testQuizInput);
    console.log(`✓ Created quiz: ${quiz.title} (ID: ${quiz.id})\n`);

    // Simulate multiple quiz attempts with different scores
    console.log('2. Simulating quiz attempts...');
    const attempts = [
      { userId: 'user-1', score: 20, maxScore: 20, percentage: 100 },
      { userId: 'user-2', score: 15, maxScore: 20, percentage: 75 },
      { userId: 'user-3', score: 18, maxScore: 20, percentage: 90 },
      { userId: 'user-4', score: 12, maxScore: 20, percentage: 60 },
      { userId: 'user-5', score: 20, maxScore: 20, percentage: 100 },
      { userId: null, score: 10, maxScore: 20, percentage: 50 }, // Anonymous user
    ];

    for (const attempt of attempts) {
      await saveQuizAttempt(
        quiz.id,
        attempt.userId,
        attempt.score,
        attempt.maxScore,
        attempt.percentage
      );
      const userLabel = attempt.userId ? `User ${attempt.userId}` : 'Anonymous';
      console.log(`  ✓ Saved attempt: ${userLabel} - ${attempt.percentage}%`);
    }
    console.log('');

    // Get statistics for the quiz
    console.log('3. Retrieving quiz statistics...');
    const stats = await getQuizStats(quiz.id);
    console.log(`  Completion Count: ${stats.completionCount} users`);
    console.log(`  Average Score: ${stats.averageScore}%`);
    console.log(`  Formatted Count: ${formatCompletionCount(stats.completionCount)}\n`);

    // Get quiz with stats included
    console.log('4. Fetching quiz with stats...');
    const quizWithStats = await getQuizById(quiz.id);
    if (quizWithStats?.stats) {
      console.log(`  Quiz: ${quizWithStats.title}`);
      console.log(`  Completions: ${formatCompletionCount(quizWithStats.stats.completionCount)}`);
      console.log(`  Average: ${quizWithStats.stats.averageScore}%\n`);
    }

    // Test bulk stats retrieval
    console.log('5. Testing bulk stats retrieval...');
    const statsMap = await getMultipleQuizStats([quiz.id]);
    const bulkStats = statsMap.get(quiz.id);
    if (bulkStats) {
      console.log(`  Bulk stats match: ${bulkStats.completionCount === stats.completionCount}\n`);
    }

    // Show how it appears in quiz listings
    console.log('6. Fetching quiz in listings...');
    const quizzes = await getQuizzes({ isPublic: true }, { limit: 10 });
    const foundQuiz = quizzes.data.find(q => q.id === quiz.id);
    if (foundQuiz?.stats) {
      console.log(`  Found in listings with stats:`);
      console.log(`  - Title: ${foundQuiz.title}`);
      console.log(`  - Taken by: ${formatCompletionCount(foundQuiz.stats.completionCount)}`);
      console.log(`  - Avg Score: ${foundQuiz.stats.averageScore}%\n`);
    }

    // Test various completion count formats
    console.log('7. Testing completion count formatting...');
    const testCounts = [0, 5, 15, 150, 1500, 15000, 150000, 1500000];
    testCounts.forEach(count => {
      console.log(`  ${count.toLocaleString()} → ${formatCompletionCount(count)}`);
    });
    console.log('');

    console.log('✓ All tests completed successfully!\n');
    console.log('=== Summary ===');
    console.log(`Quiz statistics are now tracked for quiz: ${quiz.id}`);
    console.log(`Total attempts recorded: ${attempts.length}`);
    console.log(`Unique users: ${stats.completionCount}`);
    console.log(`Average performance: ${stats.averageScore}%`);
    console.log('\nThese stats will automatically appear on quiz cards in the UI.');

  } catch (error) {
    console.error('Error during test:', error);
    throw error;
  }
}

// Run the test
testQuizStatistics()
  .then(() => {
    console.log('\n✓ Test script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Test script failed:', error);
    process.exit(1);
  });
