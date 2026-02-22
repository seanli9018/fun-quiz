import { createFileRoute } from '@tanstack/react-router';
import { searchTagsAction } from '@/lib/quiz/actions';

export const Route = createFileRoute('/api/tags/search')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const searchTerm = url.searchParams.get('q') || '';

          const result = await searchTagsAction(searchTerm);

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
                  : 'Failed to search tags',
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
