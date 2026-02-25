import { createFileRoute } from '@tanstack/react-router';
import { auth } from '@/lib/auth/server';
import { deleteQuiz, userOwnsQuiz } from '@/db/repositories/quiz';

export const Route = createFileRoute('/api/quiz/$quizId/delete')({
  server: {
    handlers: {
      DELETE: async ({
        request,
        params,
      }: {
        request: Request;
        params: { quizId: string };
      }) => {
        try {
          const { quizId } = params;

          // Get session
          const session = await auth.api.getSession({
            headers: request.headers,
          });

          if (!session?.user) {
            return Response.json(
              {
                success: false,
                error: 'Authentication required',
              },
              { status: 401 },
            );
          }

          const userId = session.user.id;

          // Check if user owns the quiz
          const owns = await userOwnsQuiz(quizId, userId);
          if (!owns) {
            return Response.json(
              {
                success: false,
                error: 'You do not have permission to delete this quiz',
              },
              { status: 403 },
            );
          }

          // Delete the quiz
          const deleted = await deleteQuiz(quizId, userId);

          if (!deleted) {
            return Response.json(
              {
                success: false,
                error: 'Failed to delete quiz',
              },
              { status: 500 },
            );
          }

          return Response.json({
            success: true,
            message: 'Quiz deleted successfully',
          });
        } catch (error) {
          console.error('Error deleting quiz:', error);
          return Response.json(
            {
              success: false,
              error: 'Failed to delete quiz',
            },
            { status: 500 },
          );
        }
      },
    },
  },
});
