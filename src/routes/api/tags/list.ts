import { createFileRoute } from '@tanstack/react-router';
import { getAllTagsAction } from '@/lib/quiz/actions';

export const Route = createFileRoute('/api/tags/list')({
  server: {
    handlers: {
      GET: async () => {
        try {
          const result = await getAllTagsAction();

          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        } catch (error) {
          return new Response(
            JSON.stringify({
              success: false,
              error:
                error instanceof Error
                  ? error.message
                  : 'Failed to fetch tags',
            }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            },
          );
        }
      },
    },
  },
});
