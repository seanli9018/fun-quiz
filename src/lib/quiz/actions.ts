import { getRequestHeaders } from '@tanstack/react-start/server';
import { auth } from '@/lib/auth/server';
import {
  createQuiz,
  getAllTags,
  getQuizzes,
  searchTags,
} from '@/db/repositories/quiz';
import { getUserById } from '@/db/repositories/user';
import { getBookmarkStatusForQuizzes } from '@/db/repositories/quiz-bookmarks';
import type {
  CreateQuizInput,
  QuizFilters,
  PaginationParams,
} from '@/db/types';

/**
 * Create a new quiz
 * This function should be called from a server action or API route
 */
export async function createQuizAction(data: CreateQuizInput) {
  // Get current user session
  const headers = getRequestHeaders();
  const session = await auth.api.getSession({ headers });

  if (!session || !session.user) {
    throw new Error('Unauthorized: You must be logged in to create a quiz');
  }

  try {
    // Create the quiz in the database
    const quiz = await createQuiz(session.user.id, data);

    return {
      success: true,
      quiz,
    };
  } catch (error) {
    console.error('Error creating quiz:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to create quiz',
    );
  }
}

/**
 * Get all available tags
 */
export async function getAllTagsAction() {
  try {
    const tags = await getAllTags();
    return { success: true, tags };
  } catch (error) {
    console.error('Error fetching tags:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to fetch tags',
    );
  }
}

/**
 * Search tags by name
 */
export async function searchTagsAction(searchTerm: string) {
  try {
    const tags = await searchTags(searchTerm);
    return { success: true, tags };
  } catch (error) {
    console.error('Error searching tags:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to search tags',
    );
  }
}

/**
 * Get quizzes for the authenticated user
 */
export async function getUserQuizzesAction(
  filters: Omit<QuizFilters, 'userId'> = {},
  pagination: PaginationParams = {},
) {
  // Get current user session
  const headers = getRequestHeaders();
  const session = await auth.api.getSession({ headers });

  if (!session || !session.user) {
    throw new Error('Unauthorized: You must be logged in to view your quizzes');
  }

  try {
    // Get quizzes for the authenticated user
    const result = await getQuizzes(
      { ...filters, userId: session.user.id },
      pagination,
    );

    return {
      success: true,
      ...result,
    };
  } catch (error) {
    console.error('Error fetching user quizzes:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to fetch quizzes',
    );
  }
}

/**
 * Get user profile with their quizzes
 */
export async function getUserProfileAction(
  userId: string,
  filters: Omit<QuizFilters, 'userId'> = {},
  pagination: PaginationParams = {},
) {
  // Get current user session to determine if viewing own profile
  const headers = getRequestHeaders();
  const session = await auth.api.getSession({ headers });

  try {
    // Get user profile
    const user = await getUserById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    // Get user's public quizzes
    // If viewing own profile, show all quizzes
    // If viewing another user's profile, only show public quizzes
    const isOwnProfile = session?.user?.id === userId;
    const quizFilters: QuizFilters = {
      ...filters,
      userId,
      ...(isOwnProfile ? {} : { isPublic: true }),
    };

    const result = await getQuizzes(quizFilters, pagination);

    // Add bookmark status if user is logged in
    if (session?.user) {
      const quizIds = result.data.map((q) => q.id);
      const bookmarkStatus = await getBookmarkStatusForQuizzes(
        session.user.id,
        quizIds,
      );

      result.data = result.data.map((quiz) => ({
        ...quiz,
        isBookmarked: bookmarkStatus.get(quiz.id) || false,
      }));
    }

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        bio: user.bio,
        createdAt: user.createdAt,
      },
      isOwnProfile,
      ...result,
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to fetch user profile',
    );
  }
}
