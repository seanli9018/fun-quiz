import { db } from '../index';
import { quiz, question, answer } from '../schema';
import { eq, inArray } from 'drizzle-orm';
import type { QuizSubmission, QuizResult } from '../types';

/**
 * Evaluate a quiz submission and calculate the score
 */
export async function evaluateQuizSubmission(
  submission: QuizSubmission
): Promise<QuizResult | null> {
  // Verify quiz exists
  const [quizRecord] = await db
    .select()
    .from(quiz)
    .where(eq(quiz.id, submission.quizId))
    .limit(1);

  if (!quizRecord) {
    return null;
  }

  // Get all questions for the quiz
  const questions = await db
    .select()
    .from(question)
    .where(eq(question.quizId, submission.quizId));

  if (questions.length === 0) {
    return null;
  }

  // Get all answers for these questions
  const questionIds = questions.map((q) => q.id);
  const answers = await db
    .select()
    .from(answer)
    .where(inArray(answer.questionId, questionIds));

  // Create maps for quick lookup
  const questionMap = new Map(questions.map((q) => [q.id, q]));
  const answerMap = new Map(answers.map((a) => [a.id, a]));
  const correctAnswerMap = new Map(
    answers.filter((a) => a.isCorrect).map((a) => [a.questionId, a.id])
  );

  // Evaluate each submitted answer
  let totalScore = 0;
  let maxScore = 0;
  let correctAnswersCount = 0;

  const evaluatedAnswers = submission.answers.map((submittedAnswer) => {
    const questionRecord = questionMap.get(submittedAnswer.questionId);
    const selectedAnswer = answerMap.get(submittedAnswer.answerId);
    const correctAnswerId = correctAnswerMap.get(submittedAnswer.questionId);

    if (!questionRecord || !selectedAnswer || !correctAnswerId) {
      return {
        questionId: submittedAnswer.questionId,
        selectedAnswerId: submittedAnswer.answerId,
        correctAnswerId: correctAnswerId || '',
        isCorrect: false,
        points: 0,
      };
    }

    const isCorrect = selectedAnswer.isCorrect;
    const points = isCorrect ? questionRecord.points : 0;

    maxScore += questionRecord.points;
    totalScore += points;

    if (isCorrect) {
      correctAnswersCount++;
    }

    return {
      questionId: submittedAnswer.questionId,
      selectedAnswerId: submittedAnswer.answerId,
      correctAnswerId,
      isCorrect,
      points,
    };
  });

  // Calculate percentage
  const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

  return {
    quizId: submission.quizId,
    score: totalScore,
    maxScore,
    percentage: Math.round(percentage * 100) / 100, // Round to 2 decimal places
    correctAnswers: correctAnswersCount,
    totalQuestions: questions.length,
    answers: evaluatedAnswers,
  };
}

/**
 * Get quiz questions without revealing correct answers (for taking the quiz)
 */
export async function getQuizForTaking(quizId: string) {
  // Verify quiz exists and is public or user has access
  const [quizRecord] = await db
    .select()
    .from(quiz)
    .where(eq(quiz.id, quizId))
    .limit(1);

  if (!quizRecord) {
    return null;
  }

  // Get questions
  const questions = await db
    .select({
      id: question.id,
      text: question.text,
      order: question.order,
      points: question.points,
    })
    .from(question)
    .where(eq(question.quizId, quizId))
    .orderBy(question.order);

  // Get answers but exclude the isCorrect field
  const questionsWithAnswers = await Promise.all(
    questions.map(async (q) => {
      const answers = await db
        .select({
          id: answer.id,
          text: answer.text,
          order: answer.order,
        })
        .from(answer)
        .where(eq(answer.questionId, q.id))
        .orderBy(answer.order);

      return {
        ...q,
        answers,
      };
    })
  );

  return {
    id: quizRecord.id,
    title: quizRecord.title,
    description: quizRecord.description,
    questions: questionsWithAnswers,
  };
}

/**
 * Verify if a quiz can be accessed by a user
 */
export async function canAccessQuiz(
  quizId: string,
  userId?: string
): Promise<boolean> {
  const [quizRecord] = await db
    .select()
    .from(quiz)
    .where(eq(quiz.id, quizId))
    .limit(1);

  if (!quizRecord) {
    return false;
  }

  // Public quizzes can be accessed by anyone
  if (quizRecord.isPublic) {
    return true;
  }

  // Private quizzes can only be accessed by the owner
  if (userId && quizRecord.userId === userId) {
    return true;
  }

  return false;
}
