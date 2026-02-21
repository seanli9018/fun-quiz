import { createFileRoute } from '@tanstack/react-router';
import { evaluateQuizSubmission, canAccessQuiz } from '@/db/repositories/quiz-evaluation';
import { auth } from '@/lib/auth/server';
import type { QuizSubmission } from '@/db/types';

export const Route = createFileRoute('/api/quiz/$quizId/submit')({
  server: {
    handlers: {
      POST: async ({ request, params }: { request: Request; params: { quizId: string } }) => {
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

          // Parse submission data
          const submission = (await request.json()) as QuizSubmission;

          // Validate submission
          if (!submission.quizId || submission.quizId !== quizId) {
            return new Response(
              JSON.stringify({
                error: 'Invalid submission',
                message: 'Quiz ID mismatch',
              }),
              {
                status: 400,
                headers: {
                  'Content-Type': 'application/json',
                },
              },
            );
          }

          if (!submission.answers || !Array.isArray(submission.answers)) {
            return new Response(
              JSON.stringify({
                error: 'Invalid submission',
                message: 'Answers must be provided as an array',
              }),
              {
                status: 400,
                headers: {
                  'Content-Type': 'application/json',
                },
              },
            );
          }

          // Evaluate the quiz submission
          const result = await evaluateQuizSubmission(submission);

          if (!result) {
            return new Response(
              JSON.stringify({
                error: 'Evaluation failed',
                message: 'Unable to evaluate quiz submission',
              }),
              {
                status: 500,
                headers: {
                  'Content-Type': 'application/json',
                },
              },
            );
          }

          return new Response(JSON.stringify(result), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
            },
          });
        } catch (error) {
          console.error('Error submitting quiz:', error);
          return new Response(
            JSON.stringify({
              error: 'Failed to submit quiz',
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
