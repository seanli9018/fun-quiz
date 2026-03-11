import { createFileRoute } from '@tanstack/react-router';
import { auth } from '@/lib/auth/server';
import { db } from '@/db';
import { commentLike, quizComment } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export const Route = createFileRoute(
  '/api/quiz/$quizId/comments/$commentId/like',
)({
  server: {
    handlers: {
      POST: async ({
        request,
        params,
      }: {
        request: Request;
        params: { quizId: string; commentId: string };
      }) => {
        try {
          const { commentId } = params;

          // Get session - authentication required
          const session = await auth.api.getSession({
            headers: request.headers,
          });

          if (!session?.user) {
            return Response.json(
              {
                success: false,
                error: 'You must be logged in to like comments',
              },
              { status: 401 },
            );
          }

          const userId = session.user.id;

          // Verify comment exists
          const comment = await db.query.quizComment.findFirst({
            where: eq(quizComment.id, commentId),
          });

          if (!comment) {
            return Response.json(
              {
                success: false,
                error: 'Comment not found',
              },
              { status: 404 },
            );
          }

          // Check if user has already liked this comment
          const existingLike = await db.query.commentLike.findFirst({
            where: and(
              eq(commentLike.commentId, commentId),
              eq(commentLike.userId, userId),
            ),
          });

          if (existingLike) {
            // Unlike - remove the like
            await db
              .delete(commentLike)
              .where(
                and(
                  eq(commentLike.commentId, commentId),
                  eq(commentLike.userId, userId),
                ),
              );

            return Response.json({
              success: true,
              data: {
                isLiked: false,
                message: 'Comment unliked successfully',
              },
            });
          } else {
            // Like - add the like
            await db.insert(commentLike).values({
              id: crypto.randomUUID(),
              commentId,
              userId,
              createdAt: new Date(),
            });

            return Response.json({
              success: true,
              data: {
                isLiked: true,
                message: 'Comment liked successfully',
              },
            });
          }
        } catch (error) {
          console.error('Error toggling comment like:', error);
          return Response.json(
            {
              success: false,
              error: 'Failed to toggle comment like',
            },
            { status: 500 },
          );
        }
      },
    },
  },
});
