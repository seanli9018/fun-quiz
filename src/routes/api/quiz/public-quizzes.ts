import { createFileRoute } from '@tanstack/react-router';
import { getQuizzes } from '@/db/repositories/quiz';

export const Route = createFileRoute('/api/quiz/public-quizzes')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        try {
          const url = new URL(request.url);
          const page = parseInt(url.searchParams.get('page') || '1', 10);
          const limit = parseInt(url.searchParams.get('limit') || '10', 10);
          const search = url.searchParams.get('search') || undefined;
          const tagIds = url.searchParams
            .get('tagIds')
            ?.split(',')
            .filter(Boolean);

          // Fetch only public quizzes
          const result = await getQuizzes(
            {
              isPublic: true,
              search,
              tagIds,
            },
            {
              page,
              limit,
            },
          );

          return new Response(JSON.stringify(result), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
            },
          });
        } catch (error) {
          console.error('Error fetching public quizzes:', error);
          return new Response(
            JSON.stringify({
              error: 'Failed to fetch public quizzes',
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
