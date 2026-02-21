import { createFileRoute } from '@tanstack/react-router';
import { getQuizForTaking, canAccessQuiz } from '@/db/repositories/quiz-evaluation';
import { auth } from '@/lib/auth/server';

export const Route = createFileRoute('/api/quiz/$quizId/take')({
  server: {
    handlers: {
      GET: async ({ request, params }: { request: Request; params: { quizId: string } }) => {
        try {
          const { quizId } = params;

          // Get session to check user access
          const session = await auth.api.getSession({ headers: request.headers });
          const userId = session?.user?.id;

          // Check if user can access this quiz
          const hasAccess = await canAccessQuiz(quizId, userId);

          if (!hasAccess) {
            return new Response(
              JSON.stringify({
                error: 'Access denied',
                message: 'This quiz is not available or you do not have permission to access it',
              }),
              {
                status: 403,
                headers: {
                  'Content-Type': 'application/json',
                },
              },
            );
          }

          // Fetch quiz data without revealing correct answers
          const quizData = await getQuizForTaking(quizId);

          if (!quizData) {
            return new Response(
              JSON.stringify({
                error: 'Quiz not found',
                message: 'The requested quiz does not exist',
              }),
              {
                status: 404,
                headers: {
                  'Content-Type': 'application/json',
                },
              },
            );
          }

          return new Response(JSON.stringify(quizData), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
            },
          });
        } catch (error) {
          console.error('Error fetching quiz for taking:', error);
          return new Response(
            JSON.stringify({
              error: 'Failed to fetch quiz',
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
