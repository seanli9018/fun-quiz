import { createFileRoute } from '@tanstack/react-router';
import { auth } from '@/lib/auth/server';
import { db } from '@/db';
import { quizComment, user, quiz } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export const Route = createFileRoute('/api/quiz/$quizId/comments')({
  server: {
    handlers: {
      GET: async ({
        request,
        params,
      }: {
        request: Request;
        params: { quizId: string };
      }) => {
        try {
          const { quizId } = params;

          // Get session to check user access
          const session = await auth.api.getSession({
            headers: request.headers,
          });
          const userId = session?.user?.id;

          // First, check if the quiz exists and is accessible
          const quizData = await db.query.quiz.findFirst({
            where: eq(quiz.id, quizId),
          });

          if (!quizData) {
            return Response.json(
              {
                success: false,
                error: 'Quiz not found',
              },
              { status: 404 },
            );
          }

          // Check access permissions for private quizzes
          if (!quizData.isPublic && quizData.userId !== userId) {
            return Response.json(
              {
                success: false,
                error: 'You do not have access to this quiz',
              },
              { status: 403 },
            );
          }

          // Fetch all comments for the quiz (both top-level and replies)
          const allComments = await db
            .select({
              id: quizComment.id,
              quizId: quizComment.quizId,
              userId: quizComment.userId,
              content: quizComment.content,
              parentId: quizComment.parentId,
              createdAt: quizComment.createdAt,
              updatedAt: quizComment.updatedAt,
              userName: user.name,
              userImage: user.image,
            })
            .from(quizComment)
            .leftJoin(user, eq(quizComment.userId, user.id))
            .where(eq(quizComment.quizId, quizId))
            .orderBy(desc(quizComment.createdAt));

          // Organize comments into a flat 2-layer structure
          const commentMap = new Map();
          const topLevelComments: any[] = [];

          // First pass: create all comment objects
          allComments.forEach((comment) => {
            const commentObj = {
              id: comment.id,
              quizId: comment.quizId,
              userId: comment.userId,
              content: comment.content,
              parentId: comment.parentId,
              createdAt: comment.createdAt,
              updatedAt: comment.updatedAt,
              user: {
                id: comment.userId,
                name: comment.userName || 'Unknown User',
                image: comment.userImage,
              },
              replies: [],
            };
            commentMap.set(comment.id, commentObj);
          });

          // Second pass: organize into flat 2-layer structure
          // All replies (regardless of nesting) go under their root parent
          allComments.forEach((comment) => {
            const commentObj = commentMap.get(comment.id);
            if (comment.parentId) {
              // This is a reply - find the root parent
              let rootParentId = comment.parentId;
              let currentParent = commentMap.get(rootParentId);

              // Traverse up to find the root comment (one without parentId)
              while (currentParent && currentParent.parentId) {
                rootParentId = currentParent.parentId;
                currentParent = commentMap.get(rootParentId);
              }

              // Add this reply to the root parent
              const rootParent = commentMap.get(rootParentId);
              if (rootParent) {
                rootParent.replies.push(commentObj);
              }
            } else {
              // This is a top-level comment
              topLevelComments.push(commentObj);
            }
          });

          return Response.json({
            success: true,
            data: topLevelComments,
          });
        } catch (error) {
          console.error('Error fetching comments:', error);
          return Response.json(
            {
              success: false,
              error: 'Failed to fetch comments',
            },
            { status: 500 },
          );
        }
      },

      POST: async ({
        request,
        params,
      }: {
        request: Request;
        params: { quizId: string };
      }) => {
        try {
          const { quizId } = params;

          // Get session - authentication required
          const session = await auth.api.getSession({
            headers: request.headers,
          });

          if (!session?.user) {
            return Response.json(
              {
                success: false,
                error: 'You must be logged in to comment',
              },
              { status: 401 },
            );
          }

          const userId = session.user.id;

          // Parse request body
          const body = await request.json();
          const { content, parentId } = body;

          if (
            !content ||
            typeof content !== 'string' ||
            content.trim().length === 0
          ) {
            return Response.json(
              {
                success: false,
                error: 'Comment content is required',
              },
              { status: 400 },
            );
          }

          if (content.length > 2000) {
            return Response.json(
              {
                success: false,
                error: 'Comment must be less than 2000 characters',
              },
              { status: 400 },
            );
          }

          // Verify quiz exists and is accessible
          const quizData = await db.query.quiz.findFirst({
            where: eq(quiz.id, quizId),
          });

          if (!quizData) {
            return Response.json(
              {
                success: false,
                error: 'Quiz not found',
              },
              { status: 404 },
            );
          }

          // Check access permissions for private quizzes
          if (!quizData.isPublic && quizData.userId !== userId) {
            return Response.json(
              {
                success: false,
                error: 'You do not have access to this quiz',
              },
              { status: 403 },
            );
          }

          // If parentId is provided, verify it exists and belongs to this quiz
          if (parentId) {
            const parentComment = await db.query.quizComment.findFirst({
              where: and(
                eq(quizComment.id, parentId),
                eq(quizComment.quizId, quizId),
              ),
            });

            if (!parentComment) {
              return Response.json(
                {
                  success: false,
                  error: 'Parent comment not found',
                },
                { status: 404 },
              );
            }
          }

          // Create the comment
          const [newComment] = await db
            .insert(quizComment)
            .values({
              id: crypto.randomUUID(),
              quizId,
              userId,
              content: content.trim(),
              parentId: parentId || null,
              createdAt: new Date(),
              updatedAt: new Date(),
            })
            .returning();

          // Fetch the comment with user data
          const commentWithUser = await db
            .select({
              id: quizComment.id,
              quizId: quizComment.quizId,
              userId: quizComment.userId,
              content: quizComment.content,
              parentId: quizComment.parentId,
              createdAt: quizComment.createdAt,
              updatedAt: quizComment.updatedAt,
              userName: user.name,
              userImage: user.image,
            })
            .from(quizComment)
            .leftJoin(user, eq(quizComment.userId, user.id))
            .where(eq(quizComment.id, newComment.id))
            .limit(1);

          const result = commentWithUser[0];

          return Response.json({
            success: true,
            data: {
              id: result.id,
              quizId: result.quizId,
              userId: result.userId,
              content: result.content,
              parentId: result.parentId,
              createdAt: result.createdAt,
              updatedAt: result.updatedAt,
              user: {
                id: result.userId,
                name: result.userName || 'Unknown User',
                image: result.userImage,
              },
              replies: [],
            },
          });
        } catch (error) {
          console.error('Error creating comment:', error);
          return Response.json(
            {
              success: false,
              error: 'Failed to create comment',
            },
            { status: 500 },
          );
        }
      },
    },
  },
});
