import { createFileRoute } from '@tanstack/react-router';
import { getUserProfileAction } from '@/lib/quiz/actions';
import type { QuizFilters, PaginationParams } from '@/db/types';

export const Route = createFileRoute('/api/user/$userId/profile')({
  server: {
    handlers: {
      GET: async ({ request, params }: { request: Request; params: { userId: string } }) => {
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

          const result = await getUserProfileAction(params.userId, filters, pagination);

          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        } catch (error) {
          const isNotFound =
            error instanceof Error && error.message.includes('not found');

          return new Response(
            JSON.stringify({
              success: false,
              error:
                error instanceof Error
                  ? error.message
                  : 'Failed to fetch user profile',
            }),
            {
              status: isNotFound ? 404 : 500,
              headers: { 'Content-Type': 'application/json' },
            },
          );
        }
      },
    },
  },
});
