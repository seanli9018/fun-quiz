import { createFileRoute } from '@tanstack/react-router';
import { auth } from '@/lib/auth/server';
import { getQuizById } from '@/db/repositories/quiz';

export const Route = createFileRoute('/api/quiz/$quizId')({
  server: {
    handlers: {
      GET: async ({
        request,
        params,
      }: {
        request: Request;
        params: { quizId: string };
      }) => {
        try {
          const { quizId } = params;

          // Get session to check user access
          const session = await auth.api.getSession({
            headers: request.headers,
          });
          const userId = session?.user?.id;

          // Fetch the quiz
          const quiz = await getQuizById(quizId);

          if (!quiz) {
            return Response.json(
              {
                success: false,
                error: 'Quiz not found',
              },
              { status: 404 },
            );
          }

          // Check access permissions
          // - Public quizzes are accessible to everyone (but non-owners won't see answer keys in the view)
          // - Private quizzes are only accessible to the owner
          if (!quiz.isPublic && quiz.userId !== userId) {
            return Response.json(
              {
                success: false,
                error:
                  'This quiz is private and can only be accessed by its owner',
              },
              { status: 403 },
            );
          }

          return Response.json({
            success: true,
            data: quiz,
          });
        } catch (error) {
          console.error('Error fetching quiz:', error);
          return Response.json(
            {
              success: false,
              error: 'Failed to fetch quiz',
            },
            { status: 500 },
          );
        }
      },
    },
  },
});
