import { createFileRoute } from '@tanstack/react-router';
import { getQuizzes } from '@/db/repositories/quiz';
import { getSession } from '@/lib/auth/session';
import { getBookmarkStatusForQuizzes } from '@/db/repositories/quiz-bookmarks';

export const Route = createFileRoute('/api/quiz/public-quizzes')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        try {
          const url = new URL(request.url);
          const page = parseInt(url.searchParams.get('page') || '1', 10);
          const limit = parseInt(url.searchParams.get('limit') || '10', 10);
          const search = url.searchParams.get('search') || undefined;
          const excludeUserId =
            url.searchParams.get('excludeUserId') || undefined;
          const tagIds = url.searchParams
            .get('tagIds')
            ?.split(',')
            .filter(Boolean);
          const sortBy = url.searchParams.get('sortBy') as
            | 'latest'
            | 'popular'
            | 'hardest'
            | undefined;

          // Fetch only public quizzes
          const result = await getQuizzes(
            {
              isPublic: true,
              search,
              excludeUserId,
              tagIds,
              sortBy,
            },
            {
              page,
              limit,
            },
          );

          // Add bookmark status if user is logged in
          const session = await getSession();
          if (session?.user) {
            const quizIds = result.data.map((q) => q.id);
            const bookmarkStatus = await getBookmarkStatusForQuizzes(
              session.user.id,
              quizIds,
            );

            result.data = result.data.map((quiz) => ({
              ...quiz,
              isBookmarked: bookmarkStatus.get(quiz.id) || false,
            }));
          }

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
