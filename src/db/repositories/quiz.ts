import { db } from '../index';
import { quiz, quizTag, question, answer, tag, user } from '../schema';
import { eq, and, inArray, sql, desc, asc, or, like } from 'drizzle-orm';
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

    // Create quiz-tag associations
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
  };
}

/**
 * Get quizzes with filters and pagination
 */
export async function getQuizzes(
  filters: QuizFilters = {},
  pagination: PaginationParams = {},
): Promise<PaginatedResponse<QuizWithRelations>> {
  const { userId, tagIds, isPublic, search } = filters;
  const { page = 1, limit = 10 } = pagination;
  const offset = (page - 1) * limit;

  // Build where conditions
  const conditions = [];

  if (userId) {
    conditions.push(eq(quiz.userId, userId));
  }

  if (isPublic !== undefined) {
    conditions.push(eq(quiz.isPublic, isPublic));
  }

  if (search) {
    conditions.push(
      or(
        like(quiz.title, `%${search}%`),
        like(quiz.description, `%${search}%`),
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

  // Get paginated results
  const quizzes = await baseQuery
    .orderBy(desc(quiz.createdAt))
    .limit(limit)
    .offset(offset);

  // Fetch tags and questions for each quiz
  const data = await Promise.all(
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
      };
    }),
  );

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
