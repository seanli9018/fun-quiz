import { createFileRoute } from '@tanstack/react-router';
import { getUserQuizzesAction } from '@/lib/quiz/actions';
import type { QuizFilters, PaginationParams } from '@/db/types';

export const Route = createFileRoute('/api/quiz/user-quizzes')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        try {
          const url = new URL(request.url);
          const searchParams = url.searchParams;

          // Parse filters from query params
          const filters: Omit<QuizFilters, 'userId'> = {};

          // Parse tagIds (comma-separated)
          const tagIdsParam = searchParams.get('tagIds');
          if (tagIdsParam) {
            filters.tagIds = tagIdsParam.split(',').filter(Boolean);
          }

          // Parse isPublic
          const isPublicParam = searchParams.get('isPublic');
          if (isPublicParam !== null) {
            filters.isPublic = isPublicParam === 'true';
          }

          // Parse search
          const search = searchParams.get('search');
          if (search) {
            filters.search = search;
          }

          // Parse pagination
          const pagination: PaginationParams = {};
          const pageParam = searchParams.get('page');
          const limitParam = searchParams.get('limit');

          if (pageParam) {
            pagination.page = parseInt(pageParam, 10);
          }

          if (limitParam) {
            pagination.limit = parseInt(limitParam, 10);
          }

          const result = await getUserQuizzesAction(filters, pagination);

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
                  : 'Failed to fetch quizzes',
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
