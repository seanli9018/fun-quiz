import { createFileRoute } from '@tanstack/react-router';
import { getSession } from '@/lib/auth/session';
import {
  createBookmark,
  removeBookmark,
  isBookmarked,
} from '@/db/repositories/quiz-bookmarks';
import { getQuizById } from '@/db/repositories/quiz';

export const Route = createFileRoute('/api/quiz/$quizId/bookmark')({
  server: {
    handlers: {
      // Add bookmark
      POST: async ({ params }: { params: any }) => {
        try {
          const session = await getSession();

          if (!session) {
            return new Response(
              JSON.stringify({
                success: false,
                error: 'Unauthorized',
              }),
              {
                status: 401,
                headers: {
                  'Content-Type': 'application/json',
                },
              },
            );
          }

          const { quizId } = params;

          // Check if quiz exists
          const quiz = await getQuizById(quizId);
          if (!quiz) {
            return new Response(
              JSON.stringify({
                success: false,
                error: 'Quiz not found',
              }),
              {
                status: 404,
                headers: {
                  'Content-Type': 'application/json',
                },
              },
            );
          }

          // Create bookmark
          await createBookmark(session.user.id, quizId);

          return new Response(
            JSON.stringify({
              success: true,
              isBookmarked: true,
            }),
            {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
              },
            },
          );
        } catch (error) {
          console.error('Error creating bookmark:', error);
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Failed to create bookmark',
              message: error instanceof Error ? error.message : 'Unknown error',
            }),
            {
              status: 500,
              headers: {
                'Content-Type': 'application/json',
              },
            },
          );
        }
      },

      // Remove bookmark
      DELETE: async ({ params }: { params: any }) => {
        try {
          const session = await getSession();

          if (!session) {
            return new Response(
              JSON.stringify({
                success: false,
                error: 'Unauthorized',
              }),
              {
                status: 401,
                headers: {
                  'Content-Type': 'application/json',
                },
              },
            );
          }

          const { quizId } = params;

          // Remove bookmark
          await removeBookmark(session.user.id, quizId);

          return new Response(
            JSON.stringify({
              success: true,
              isBookmarked: false,
            }),
            {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
              },
            },
          );
        } catch (error) {
          console.error('Error removing bookmark:', error);
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Failed to remove bookmark',
              message: error instanceof Error ? error.message : 'Unknown error',
            }),
            {
              status: 500,
              headers: {
                'Content-Type': 'application/json',
              },
            },
          );
        }
      },

      // Check bookmark status
      GET: async ({ params }: { params: any }) => {
        try {
          const session = await getSession();

          if (!session) {
            return new Response(
              JSON.stringify({
                success: true,
                isBookmarked: false,
              }),
              {
                status: 200,
                headers: {
                  'Content-Type': 'application/json',
                },
              },
            );
          }

          const { quizId } = params;

          const bookmarked = await isBookmarked(session.user.id, quizId);

          return new Response(
            JSON.stringify({
              success: true,
              isBookmarked: bookmarked,
            }),
            {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
              },
            },
          );
        } catch (error) {
          console.error('Error checking bookmark status:', error);
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Failed to check bookmark status',
              message: error instanceof Error ? error.message : 'Unknown error',
            }),
            {
              status: 500,
              headers: {
                'Content-Type': 'application/json',
              },
            },
          );
        }
      },
    },
  },
});
