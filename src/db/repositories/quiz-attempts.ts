import { db } from '../index';
import { quizAttempt } from '../schema';
import { eq, sql, and, inArray, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import type { QuizAttempt, QuizStats } from '../types';

/**
 * Save a quiz attempt to the database
 */
export async function saveQuizAttempt(
  quizId: string,
  userId: string | null,
  score: number,
  maxScore: number,
  percentage: number,
): Promise<QuizAttempt> {
  const [attempt] = await db
    .insert(quizAttempt)
    .values({
      id: nanoid(),
      quizId,
      userId,
      score,
      maxScore,
      percentage,
      completedAt: new Date(),
    })
    .returning();

  return attempt;
}

/**
 * Get quiz statistics (completion count and average score)
 */
export async function getQuizStats(quizId: string): Promise<QuizStats> {
  const result = await db
    .select({
      completionCount: sql<number>`COUNT(DISTINCT CASE WHEN ${quizAttempt.userId} IS NOT NULL THEN ${quizAttempt.userId} ELSE ${quizAttempt.id} END)`,
      averageScore: sql<number>`ROUND(AVG(${quizAttempt.percentage}))`,
    })
    .from(quizAttempt)
    .where(eq(quizAttempt.quizId, quizId));

  return {
    completionCount: Number(result[0]?.completionCount || 0),
    averageScore: Number(result[0]?.averageScore || 0),
  };
}

/**
 * Get statistics for multiple quizzes
 * Returns a map of quizId -> stats
 */
export async function getMultipleQuizStats(
  quizIds: string[],
): Promise<Map<string, QuizStats>> {
  if (quizIds.length === 0) {
    return new Map();
  }

  const results = await db
    .select({
      quizId: quizAttempt.quizId,
      completionCount: sql<number>`COUNT(DISTINCT CASE WHEN ${quizAttempt.userId} IS NOT NULL THEN ${quizAttempt.userId} ELSE ${quizAttempt.id} END)`,
      averageScore: sql<number>`ROUND(AVG(${quizAttempt.percentage}))`,
    })
    .from(quizAttempt)
    .where(inArray(quizAttempt.quizId, quizIds))
    .groupBy(quizAttempt.quizId);

  const statsMap = new Map<string, QuizStats>();

  results.forEach((result) => {
    statsMap.set(result.quizId, {
      completionCount: Number(result.completionCount || 0),
      averageScore: Number(result.averageScore || 0),
    });
  });

  // Fill in zeros for quizzes with no attempts
  quizIds.forEach((quizId) => {
    if (!statsMap.has(quizId)) {
      statsMap.set(quizId, {
        completionCount: 0,
        averageScore: 0,
      });
    }
  });

  return statsMap;
}

/**
 * Get all attempts for a specific quiz
 */
export async function getQuizAttempts(quizId: string): Promise<QuizAttempt[]> {
  return await db
    .select()
    .from(quizAttempt)
    .where(eq(quizAttempt.quizId, quizId))
    .orderBy(desc(quizAttempt.completedAt));
}

/**
 * Get all attempts by a specific user
 */
export async function getUserAttempts(userId: string): Promise<QuizAttempt[]> {
  return await db
    .select()
    .from(quizAttempt)
    .where(eq(quizAttempt.userId, userId))
    .orderBy(desc(quizAttempt.completedAt));
}

/**
 * Get user's best attempt for a quiz
 */
export async function getUserBestAttempt(
  quizId: string,
  userId: string,
): Promise<QuizAttempt | null> {
  const attempts = await db
    .select()
    .from(quizAttempt)
    .where(and(eq(quizAttempt.quizId, quizId), eq(quizAttempt.userId, userId)))
    .orderBy(desc(quizAttempt.score))
    .limit(1);

  return attempts[0] || null;
}

// Re-export formatCompletionCount from utils for convenience
export { formatCompletionCount } from '@/lib/utils';
