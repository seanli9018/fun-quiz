import { db } from '@/db';
import { quizBookmark } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import type { QuizBookmark } from '@/db/types';

/**
 * Create a bookmark for a quiz
 */
export async function createBookmark(
  userId: string,
  quizId: string,
): Promise<QuizBookmark> {
  // Check if bookmark already exists
  const existing = await db
    .select()
    .from(quizBookmark)
    .where(
      and(eq(quizBookmark.userId, userId), eq(quizBookmark.quizId, quizId)),
    )
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  // Create new bookmark
  const [bookmark] = await db
    .insert(quizBookmark)
    .values({
      id: nanoid(),
      userId,
      quizId,
      createdAt: new Date(),
    })
    .returning();

  return bookmark;
}

/**
 * Remove a bookmark for a quiz
 */
export async function removeBookmark(
  userId: string,
  quizId: string,
): Promise<boolean> {
  const result = await db
    .delete(quizBookmark)
    .where(
      and(eq(quizBookmark.userId, userId), eq(quizBookmark.quizId, quizId)),
    )
    .returning();

  return result.length > 0;
}

/**
 * Check if a user has bookmarked a quiz
 */
export async function isBookmarked(
  userId: string,
  quizId: string,
): Promise<boolean> {
  const result = await db
    .select()
    .from(quizBookmark)
    .where(
      and(eq(quizBookmark.userId, userId), eq(quizBookmark.quizId, quizId)),
    )
    .limit(1);

  return result.length > 0;
}

/**
 * Get all bookmarked quiz IDs for a user
 */
export async function getUserBookmarkedQuizIds(
  userId: string,
): Promise<string[]> {
  const bookmarks = await db
    .select({ quizId: quizBookmark.quizId })
    .from(quizBookmark)
    .where(eq(quizBookmark.userId, userId));

  return bookmarks.map((b) => b.quizId);
}

/**
 * Get bookmark status for multiple quizzes
 * Returns a map of quizId -> isBookmarked
 */
export async function getBookmarkStatusForQuizzes(
  userId: string,
  quizIds: string[],
): Promise<Map<string, boolean>> {
  if (quizIds.length === 0) {
    return new Map();
  }

  const bookmarks = await db
    .select({ quizId: quizBookmark.quizId })
    .from(quizBookmark)
    .where(eq(quizBookmark.userId, userId));

  const bookmarkedIds = new Set(bookmarks.map((b) => b.quizId));
  const statusMap = new Map<string, boolean>();

  for (const quizId of quizIds) {
    statusMap.set(quizId, bookmarkedIds.has(quizId));
  }

  return statusMap;
}
