import { createFileRoute } from '@tanstack/react-router';
import { getSession } from '@/lib/auth/session';
import { getUserBookmarkedQuizIds } from '@/db/repositories/quiz-bookmarks';
import { db } from '@/db';
import { quiz, quizTag, tag, user, question, answer } from '@/db/schema';
import { eq, and, inArray, sql, ilike, or, asc } from 'drizzle-orm';
import { getMultipleQuizStats } from '@/db/repositories/quiz-attempts';
import type { QuizWithRelations } from '@/db/types';

export const Route = createFileRoute('/api/user/$userId/bookmarks')({
  server: {
    handlers: {
      GET: async ({ request, params }: { request: Request; params: any }) => {
        try {
          const session = await getSession();
          const { userId } = params;

          // Check if user is requesting their own bookmarks
          if (!session || session.user.id !== userId) {
            return new Response(
              JSON.stringify({
                success: false,
                error: 'Unauthorized',
              }),
              {
                status: 401,
                headers: {
                  'Content-Type': 'application/json',
                },
              },
            );
          }

          const url = new URL(request.url);
          const page = parseInt(url.searchParams.get('page') || '1', 10);
          const limit = parseInt(url.searchParams.get('limit') || '10', 10);
          const search = url.searchParams.get('search') || undefined;
          const tagIds = url.searchParams
            .get('tagIds')
            ?.split(',')
            .filter(Boolean);

          // Get bookmarked quiz IDs
          const bookmarkedQuizIds = await getUserBookmarkedQuizIds(userId);

          if (bookmarkedQuizIds.length === 0) {
            return new Response(
              JSON.stringify({
                success: true,
                data: [],
                pagination: {
                  page: 1,
                  limit,
                  total: 0,
                  totalPages: 0,
                },
              }),
              {
                status: 200,
                headers: {
                  'Content-Type': 'application/json',
                },
              },
            );
          }

          // Build conditions for the query
          const conditions: any[] = [inArray(quiz.id, bookmarkedQuizIds)];

          // Add search filter if provided (case-insensitive)
          if (search && search.trim()) {
            conditions.push(
              or(
                ilike(quiz.title, `%${search}%`),
                ilike(quiz.description, `%${search}%`),
              ),
            );
          }

          // Add tag filter if provided
          if (tagIds && tagIds.length > 0) {
            const quizIdsWithTags = await db
              .selectDistinct({ quizId: quizTag.quizId })
              .from(quizTag)
              .where(inArray(quizTag.tagId, tagIds));

            const filteredQuizIds = quizIdsWithTags.map((q) => q.quizId);
            if (filteredQuizIds.length === 0) {
              return new Response(
                JSON.stringify({
                  success: true,
                  data: [],
                  pagination: {
                    page: 1,
                    limit,
                    total: 0,
                    totalPages: 0,
                  },
                }),
                {
                  status: 200,
                  headers: {
                    'Content-Type': 'application/json',
                  },
                },
              );
            }
            conditions.push(inArray(quiz.id, filteredQuizIds));
          }

          // Get total count
          const countResult = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(quiz)
            .innerJoin(user, eq(quiz.userId, user.id))
            .where(and(...conditions));

          const total = countResult[0]?.count || 0;

          if (total === 0) {
            return new Response(
              JSON.stringify({
                success: true,
                data: [],
                pagination: {
                  page: 1,
                  limit,
                  total: 0,
                  totalPages: 0,
                },
              }),
              {
                status: 200,
                headers: {
                  'Content-Type': 'application/json',
                },
              },
            );
          }

          // Fetch quizzes with pagination
          const offset = (page - 1) * limit;
          const quizzes = await db
            .select({
              id: quiz.id,
              title: quiz.title,
              description: quiz.description,
              userId: quiz.userId,
              isPublic: quiz.isPublic,
              createdAt: quiz.createdAt,
              updatedAt: quiz.updatedAt,
              userName: user.name,
              userEmail: user.email,
              userImage: user.image,
            })
            .from(quiz)
            .innerJoin(user, eq(quiz.userId, user.id))
            .where(and(...conditions))
            .orderBy(quiz.createdAt)
            .limit(limit)
            .offset(offset);

          // Get quiz IDs for fetching related data
          const quizIds = quizzes.map((q) => q.id);

          // Get stats
          const statsMap = await getMultipleQuizStats(quizIds);

          // Enrich with details
          const enrichedQuizzes: QuizWithRelations[] = await Promise.all(
            quizzes.map(async (quizRecord) => {
              // Get tags
              const tags = await db
                .select({
                  id: tag.id,
                  name: tag.name,
                  createdAt: tag.createdAt,
                })
                .from(tag)
                .innerJoin(quizTag, eq(tag.id, quizTag.tagId))
                .where(eq(quizTag.quizId, quizRecord.id));

              // Get questions
              const questions = await db
                .select()
                .from(question)
                .where(eq(question.quizId, quizRecord.id))
                .orderBy(asc(question.order));

              // Get answers for questions
              const questionsWithAnswers = await Promise.all(
                questions.map(async (q) => {
                  const answers = await db
                    .select()
                    .from(answer)
                    .where(eq(answer.questionId, q.id))
                    .orderBy(asc(answer.order));

                  return {
                    ...q,
                    answers,
                  };
                }),
              );

              return {
                id: quizRecord.id,
                title: quizRecord.title,
                description: quizRecord.description,
                userId: quizRecord.userId,
                isPublic: quizRecord.isPublic,
                createdAt: quizRecord.createdAt,
                updatedAt: quizRecord.updatedAt,
                user: {
                  id: quizRecord.userId,
                  name: quizRecord.userName || '',
                  email: quizRecord.userEmail || '',
                  image: quizRecord.userImage,
                },
                tags,
                questions: questionsWithAnswers,
                stats: statsMap.get(quizRecord.id),
                isBookmarked: true,
              };
            }),
          );

          const totalPages = Math.ceil(total / limit);

          return new Response(
            JSON.stringify({
              success: true,
              data: enrichedQuizzes,
              pagination: {
                page,
                limit,
                total,
                totalPages,
              },
            }),
            {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
              },
            },
          );
        } catch (error) {
          console.error('Error fetching bookmarked quizzes:', error);
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Failed to fetch bookmarked quizzes',
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
