import { db } from '../index';
import { quiz, quizTag, question, answer, tag, user } from '../schema';
import {
  eq,
  and,
  inArray,
  sql,
  desc,
  asc,
  or,
  like,
  ilike,
  ne,
} from 'drizzle-orm';
import { nanoid } from 'nanoid';
import type {
  CreateQuizInput,
  UpdateQuizInput,
  QuizWithRelations,
  QuizFilters,
  PaginationParams,
  PaginatedResponse,
  Quiz,
} from '../types';
import { getQuizStats, getMultipleQuizStats } from './quiz-attempts';

/**
 * Create a new quiz with questions, answers, and tags
 */
export async function createQuiz(
  userId: string,
  input: CreateQuizInput,
): Promise<Quiz> {
  return await db.transaction(async (tx) => {
    // Create the quiz
    const quizId = nanoid();
    const [newQuiz] = await tx
      .insert(quiz)
      .values({
        id: quizId,
        userId,
        title: input.title,
        description: input.description,
        isPublic: input.isPublic,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Process and create quiz-tag associations
    if (input.tagIds.length > 0) {
      const processedTagIds: string[] = [];

      for (const tagIdOrName of input.tagIds) {
        // Check if this is a tag ID (existing tag) or a tag name (new tag)
        // If it doesn't look like a nanoid (contains spaces or special chars), treat it as a tag name
        const isTagName =
          tagIdOrName.includes(' ') ||
          !/^[A-Za-z0-9_-]+$/.test(tagIdOrName) ||
          tagIdOrName.length < 10;

        if (isTagName) {
          // This is a tag name, get or create the tag
          const trimmedName = tagIdOrName.trim();

          // Check if tag already exists (case-insensitive)
          const existing = await tx
            .select()
            .from(tag)
            .where(sql`LOWER(${tag.name}) = LOWER(${trimmedName})`)
            .limit(1);

          if (existing.length > 0) {
            processedTagIds.push(existing[0].id);
          } else {
            // Create new tag
            const [newTag] = await tx
              .insert(tag)
              .values({
                id: nanoid(),
                name: trimmedName,
                createdAt: new Date(),
              })
              .returning();
            processedTagIds.push(newTag.id);
          }
        } else {
          // This is already a tag ID
          processedTagIds.push(tagIdOrName);
        }
      }

      // Create quiz-tag associations
      if (processedTagIds.length > 0) {
        await tx.insert(quizTag).values(
          processedTagIds.map((tagId) => ({
            id: nanoid(),
            quizId,
            tagId,
            createdAt: new Date(),
          })),
        );
      }
    }

    // Create questions
    for (const questionInput of input.questions) {
      const questionId = nanoid();
      await tx.insert(question).values({
        id: questionId,
        quizId,
        text: questionInput.text,
        order: questionInput.order,
        points: questionInput.points,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Create answers for this question
      await tx.insert(answer).values(
        questionInput.answers.map((answerInput) => ({
          id: nanoid(),
          questionId,
          text: answerInput.text,
          isCorrect: answerInput.isCorrect,
          order: answerInput.order,
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
      );
    }

    return newQuiz;
  });
}

/**
 * Get a quiz by ID with all relations
 */
export async function getQuizById(
  quizId: string,
): Promise<QuizWithRelations | null> {
  const quizData = await db
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
    .leftJoin(user, eq(quiz.userId, user.id))
    .where(eq(quiz.id, quizId))
    .limit(1);

  if (quizData.length === 0) {
    return null;
  }

  const quizRecord = quizData[0];

  // Get tags
  const tags = await db
    .select({
      id: tag.id,
      name: tag.name,
      createdAt: tag.createdAt,
    })
    .from(tag)
    .innerJoin(quizTag, eq(tag.id, quizTag.tagId))
    .where(eq(quizTag.quizId, quizId));

  // Get questions with answers
  const questions = await db
    .select()
    .from(question)
    .where(eq(question.quizId, quizId))
    .orderBy(asc(question.order));

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

  // Get quiz statistics
  const stats = await getQuizStats(quizId);

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
    stats,
  };
}

/**
 * Get quizzes with filters and pagination
 */
export async function getQuizzes(
  filters: QuizFilters = {},
  pagination: PaginationParams = {},
): Promise<PaginatedResponse<QuizWithRelations>> {
  const {
    userId,
    excludeUserId,
    tagIds,
    isPublic,
    search,
    sortBy = 'latest',
  } = filters;
  const { page = 1, limit = 10 } = pagination;
  const offset = (page - 1) * limit;

  // Build where conditions
  const conditions = [];

  if (userId) {
    conditions.push(eq(quiz.userId, userId));
  }

  if (excludeUserId) {
    conditions.push(ne(quiz.userId, excludeUserId));
  }

  if (isPublic !== undefined) {
    conditions.push(eq(quiz.isPublic, isPublic));
  }

  // Add search filter if provided
  if (search && search.trim()) {
    conditions.push(
      or(
        ilike(quiz.title, `%${search}%`),
        ilike(quiz.description, `%${search}%`),
      ),
    );
  }

  // Base query
  let baseQuery = db
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
    .leftJoin(user, eq(quiz.userId, user.id))
    .$dynamic();

  // Apply tag filter if provided
  if (tagIds && tagIds.length > 0) {
    baseQuery = baseQuery
      .innerJoin(quizTag, eq(quiz.id, quizTag.quizId))
      .where(
        and(
          inArray(quizTag.tagId, tagIds),
          conditions.length > 0 ? and(...conditions) : undefined,
        ),
      );
  } else if (conditions.length > 0) {
    baseQuery = baseQuery.where(and(...conditions));
  }

  // Get total count
  const countResult = await db
    .select({ count: sql<number>`count(DISTINCT ${quiz.id})` })
    .from(quiz)
    .leftJoin(user, eq(quiz.userId, user.id))
    .leftJoin(quizTag, eq(quiz.id, quizTag.quizId))
    .where(
      tagIds && tagIds.length > 0
        ? and(
            inArray(quizTag.tagId, tagIds),
            conditions.length > 0 ? and(...conditions) : undefined,
          )
        : conditions.length > 0
          ? and(...conditions)
          : undefined,
    );

  const total = Number(countResult[0]?.count || 0);

  // Get paginated results with sorting
  if (sortBy === 'popular') {
    // For popularity sorting, we need to get all quizzes first
    const allQuizzes = await baseQuery.orderBy(desc(quiz.createdAt));

    // Get stats for all quizzes
    const quizIds = allQuizzes.map((q) => q.id);
    const statsMap = await getMultipleQuizStats(quizIds);

    // Add stats to quizzes and sort by completion count
    const quizzesWithStatsArray = allQuizzes.map((quizItem) => ({
      ...quizItem,
      completionCount: statsMap.get(quizItem.id)?.completionCount || 0,
      averageScore: statsMap.get(quizItem.id)?.averageScore || 0,
    }));

    quizzesWithStatsArray.sort((a, b) => b.completionCount - a.completionCount);

    // Apply pagination after sorting
    const paginatedQuizzes = quizzesWithStatsArray.slice(
      offset,
      offset + limit,
    );

    return {
      data: await enrichQuizzesWithDetails(paginatedQuizzes, statsMap),
      pagination: {
        page,
        limit,
        total: quizzesWithStatsArray.length,
        totalPages: Math.ceil(quizzesWithStatsArray.length / limit),
      },
    };
  } else if (sortBy === 'hardest') {
    // For hardest sorting, get all quizzes and filter by those with attempts
    const allQuizzes = await baseQuery.orderBy(desc(quiz.createdAt));

    // Get stats for all quizzes
    const quizIds = allQuizzes.map((q) => q.id);
    const statsMap = await getMultipleQuizStats(quizIds);

    // Add stats to quizzes and filter out those without attempts
    const quizzesWithStatsArray = allQuizzes.map((quizItem) => ({
      ...quizItem,
      completionCount: statsMap.get(quizItem.id)?.completionCount || 0,
      averageScore: statsMap.get(quizItem.id)?.averageScore || 0,
    }));

    const quizzesWithAttempts = quizzesWithStatsArray.filter(
      (q) => q.completionCount > 0,
    );

    // Sort by average score ascending (lowest score = hardest)
    quizzesWithAttempts.sort((a, b) => a.averageScore - b.averageScore);

    // Apply pagination after sorting and filtering
    const paginatedQuizzes = quizzesWithAttempts.slice(offset, offset + limit);

    return {
      data: await enrichQuizzesWithDetails(paginatedQuizzes, statsMap),
      pagination: {
        page,
        limit,
        total: quizzesWithAttempts.length,
        totalPages: Math.ceil(quizzesWithAttempts.length / limit),
      },
    };
  } else {
    // For latest, sort by createdAt in database
    const quizzes = await baseQuery
      .orderBy(desc(quiz.createdAt))
      .limit(limit)
      .offset(offset);

    // Get statistics for all quizzes in this batch
    const quizIds = quizzes.map((q) => q.id);
    const statsMap = await getMultipleQuizStats(quizIds);

    const data = await enrichQuizzesWithDetails(quizzes, statsMap);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

/**
 * Helper function to enrich quizzes with tags, questions, and stats
 */
async function enrichQuizzesWithDetails(
  quizzes: any[],
  statsMap: Map<string, { completionCount: number; averageScore: number }>,
): Promise<QuizWithRelations[]> {
  return await Promise.all(
    quizzes.map(async (quizRecord) => {
      const tags = await db
        .select({
          id: tag.id,
          name: tag.name,
          createdAt: tag.createdAt,
        })
        .from(tag)
        .innerJoin(quizTag, eq(tag.id, quizTag.tagId))
        .where(eq(quizTag.quizId, quizRecord.id));

      const questions = await db
        .select()
        .from(question)
        .where(eq(question.quizId, quizRecord.id))
        .orderBy(asc(question.order));

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
      };
    }),
  );
}

/**
 * Update a quiz
 */
export async function updateQuiz(
  quizId: string,
  userId: string,
  input: UpdateQuizInput,
): Promise<Quiz | null> {
  return await db.transaction(async (tx) => {
    // Verify ownership
    const [existingQuiz] = await tx
      .select()
      .from(quiz)
      .where(and(eq(quiz.id, quizId), eq(quiz.userId, userId)))
      .limit(1);

    if (!existingQuiz) {
      return null;
    }

    // Update quiz basic info
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined)
      updateData.description = input.description;
    if (input.isPublic !== undefined) updateData.isPublic = input.isPublic;

    const [updatedQuiz] = await tx
      .update(quiz)
      .set(updateData)
      .where(eq(quiz.id, quizId))
      .returning();

    // Update tags if provided
    if (input.tagIds) {
      // Delete existing tags
      await tx.delete(quizTag).where(eq(quizTag.quizId, quizId));

      // Insert new tags
      if (input.tagIds.length > 0) {
        await tx.insert(quizTag).values(
          input.tagIds.map((tagId) => ({
            id: nanoid(),
            quizId,
            tagId,
            createdAt: new Date(),
          })),
        );
      }
    }

    // Update questions if provided
    if (input.questions) {
      // Get existing question IDs
      const existingQuestions = await tx
        .select({ id: question.id })
        .from(question)
        .where(eq(question.quizId, quizId));

      const existingQuestionIds = existingQuestions.map((q) => q.id);
      const inputQuestionIds = input.questions
        .filter((q) => q.id)
        .map((q) => q.id!);

      // Delete questions that are not in the input
      const questionsToDelete = existingQuestionIds.filter(
        (id) => !inputQuestionIds.includes(id),
      );

      if (questionsToDelete.length > 0) {
        await tx
          .delete(question)
          .where(inArray(question.id, questionsToDelete));
      }

      // Update or create questions
      for (const questionInput of input.questions) {
        if (questionInput.id) {
          // Update existing question
          await tx
            .update(question)
            .set({
              text: questionInput.text,
              order: questionInput.order,
              points: questionInput.points,
              updatedAt: new Date(),
            })
            .where(eq(question.id, questionInput.id));

          // Get existing answer IDs
          const existingAnswers = await tx
            .select({ id: answer.id })
            .from(answer)
            .where(eq(answer.questionId, questionInput.id));

          const existingAnswerIds = existingAnswers.map((a) => a.id);
          const inputAnswerIds = questionInput.answers
            .filter((a) => a.id)
            .map((a) => a.id!);

          // Delete answers that are not in the input
          const answersToDelete = existingAnswerIds.filter(
            (id) => !inputAnswerIds.includes(id),
          );

          if (answersToDelete.length > 0) {
            await tx.delete(answer).where(inArray(answer.id, answersToDelete));
          }

          // Update or create answers
          for (const answerInput of questionInput.answers) {
            if (answerInput.id) {
              // Update existing answer
              await tx
                .update(answer)
                .set({
                  text: answerInput.text,
                  isCorrect: answerInput.isCorrect,
                  order: answerInput.order,
                  updatedAt: new Date(),
                })
                .where(eq(answer.id, answerInput.id));
            } else {
              // Create new answer
              await tx.insert(answer).values({
                id: nanoid(),
                questionId: questionInput.id,
                text: answerInput.text,
                isCorrect: answerInput.isCorrect,
                order: answerInput.order,
                createdAt: new Date(),
                updatedAt: new Date(),
              });
            }
          }
        } else {
          // Create new question
          const questionId = nanoid();
          await tx.insert(question).values({
            id: questionId,
            quizId,
            text: questionInput.text,
            order: questionInput.order,
            points: questionInput.points,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          // Create answers for new question
          await tx.insert(answer).values(
            questionInput.answers.map((answerInput) => ({
              id: nanoid(),
              questionId,
              text: answerInput.text,
              isCorrect: answerInput.isCorrect,
              order: answerInput.order,
              createdAt: new Date(),
              updatedAt: new Date(),
            })),
          );
        }
      }
    }

    return updatedQuiz;
  });
}

/**
 * Delete a quiz
 */
export async function deleteQuiz(
  quizId: string,
  userId: string,
): Promise<boolean> {
  const result = await db
    .delete(quiz)
    .where(and(eq(quiz.id, quizId), eq(quiz.userId, userId)))
    .returning();

  return result.length > 0;
}

/**
 * Get all available tags
 */
export async function getAllTags() {
  return await db.select().from(tag).orderBy(asc(tag.name));
}

/**
 * Search tags by name (case-insensitive partial match)
 */
export async function searchTags(searchTerm: string) {
  if (!searchTerm.trim()) {
    return [];
  }

  return await db
    .select()
    .from(tag)
    .where(like(tag.name, `%${searchTerm}%`))
    .orderBy(asc(tag.name))
    .limit(10);
}

/**
 * Create a new tag or get existing tag by name
 */
export async function getOrCreateTag(name: string) {
  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new Error('Tag name cannot be empty');
  }

  // Check if tag already exists (case-insensitive)
  const existing = await db
    .select()
    .from(tag)
    .where(sql`LOWER(${tag.name}) = LOWER(${trimmedName})`)
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  // Create new tag
  const [newTag] = await db
    .insert(tag)
    .values({
      id: nanoid(),
      name: trimmedName,
      createdAt: new Date(),
    })
    .returning();

  return newTag;
}

/**
 * Check if a user owns a quiz
 */
export async function userOwnsQuiz(
  quizId: string,
  userId: string,
): Promise<boolean> {
  const result = await db
    .select({ id: quiz.id })
    .from(quiz)
    .where(and(eq(quiz.id, quizId), eq(quiz.userId, userId)))
    .limit(1);

  return result.length > 0;
}
