import { createFileRoute } from '@tanstack/react-router';
import { auth } from '@/lib/auth/server';
import { updateQuiz, userOwnsQuiz } from '@/db/repositories/quiz';
import type { UpdateQuizInput } from '@/db/types';

export const Route = createFileRoute('/api/quiz/$quizId/update')({
  server: {
    handlers: {
      PUT: async ({
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
                error: 'You do not have permission to edit this quiz',
              },
              { status: 403 },
            );
          }

          // Parse request body
          const body = await request.json();
          const { title, description, isPublic, tagIds, questions } = body;

          // Validate input
          if (!title || typeof title !== 'string' || !title.trim()) {
            return Response.json(
              {
                success: false,
                error: 'Quiz title is required',
              },
              { status: 400 },
            );
          }

          if (
            !questions ||
            !Array.isArray(questions) ||
            questions.length === 0
          ) {
            return Response.json(
              {
                success: false,
                error: 'At least one question is required',
              },
              { status: 400 },
            );
          }

          // Validate questions
          for (const question of questions) {
            if (!question.text || !question.text.trim()) {
              return Response.json(
                {
                  success: false,
                  error: 'All questions must have text',
                },
                { status: 400 },
              );
            }

            if (!question.answers || question.answers.length < 2) {
              return Response.json(
                {
                  success: false,
                  error: 'Each question must have at least 2 answers',
                },
                { status: 400 },
              );
            }

            const hasCorrectAnswer = question.answers.some(
              (a: { isCorrect: boolean }) => a.isCorrect,
            );
            if (!hasCorrectAnswer) {
              return Response.json(
                {
                  success: false,
                  error: 'Each question must have at least one correct answer',
                },
                { status: 400 },
              );
            }

            const allAnswersHaveText = question.answers.every(
              (a: { text: string }) => a.text && a.text.trim(),
            );
            if (!allAnswersHaveText) {
              return Response.json(
                {
                  success: false,
                  error: 'All answers must have text',
                },
                { status: 400 },
              );
            }
          }

          // Build update input
          const updateInput: UpdateQuizInput = {
            id: quizId,
            title: title.trim(),
            description: description?.trim(),
            isPublic: isPublic ?? true,
            tagIds: Array.isArray(tagIds) ? tagIds : [],
            questions: questions.map((q: any, index: number) => ({
              id: q.id, // If exists, update; if not, create new
              text: q.text.trim(),
              order: index + 1,
              points: q.points || 10,
              answers: q.answers.map((a: any, answerIndex: number) => ({
                id: a.id, // If exists, update; if not, create new
                text: a.text.trim(),
                isCorrect: a.isCorrect,
                order: answerIndex + 1,
              })),
            })),
          };

          // Update the quiz
          const updatedQuiz = await updateQuiz(quizId, userId, updateInput);

          if (!updatedQuiz) {
            return Response.json(
              {
                success: false,
                error: 'Failed to update quiz',
              },
              { status: 500 },
            );
          }

          return Response.json({
            success: true,
            data: updatedQuiz,
          });
        } catch (error) {
          console.error('Error updating quiz:', error);
          return Response.json(
            {
              success: false,
              error: 'Failed to update quiz',
            },
            { status: 500 },
          );
        }
      },
    },
  },
});
