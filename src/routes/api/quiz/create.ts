import { createFileRoute } from '@tanstack/react-router';
import { createQuizAction } from '@/lib/quiz/actions';
import type { CreateQuizInput } from '@/db/types';

export const Route = createFileRoute('/api/quiz/create')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const body = (await request.json()) as CreateQuizInput;
          const result = await createQuizAction(body);

          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        } catch (error) {
          const isUnauthorized =
            error instanceof Error && error.message.includes('Unauthorized');

          return new Response(
            JSON.stringify({
              success: false,
              error:
                error instanceof Error
                  ? error.message
                  : 'Failed to create quiz',
            }),
            {
              status: isUnauthorized ? 401 : 500,
              headers: { 'Content-Type': 'application/json' },
            },
          );
        }
      },
    },
  },
});
