/**
 * Example Usage of Quiz Repository Functions
 *
 * This file demonstrates how to use the quiz repository functions
 * in your application. These examples can be used in API routes,
 * server actions, or any server-side code.
 */

import {
  createQuiz,
  getQuizById,
  getQuizzes,
  updateQuiz,
  deleteQuiz,
  getAllTags,
  userOwnsQuiz,
} from './quiz';
import {
  evaluateQuizSubmission,
  getQuizForTaking,
  canAccessQuiz,
} from './quiz-evaluation';
import type {
  CreateQuizInput,
  UpdateQuizInput,
  QuizSubmission,
} from '../types';

// ============================================================================
// EXAMPLE 1: Create a New Quiz
// ============================================================================

export async function exampleCreateQuiz(userId: string) {
  const quizInput: CreateQuizInput = {
    title: 'Introduction to JavaScript',
    description: 'Test your knowledge of JavaScript basics',
    isPublic: true,
    tagIds: ['technology-tag-id', 'programming-tag-id'], // Use actual tag IDs from database
    questions: [
      {
        text: 'What is the correct syntax for declaring a variable in JavaScript?',
        order: 1,
        points: 10,
        answers: [
          { text: 'var x = 5;', isCorrect: true, order: 1 },
          { text: 'variable x = 5;', isCorrect: false, order: 2 },
          { text: 'x := 5;', isCorrect: false, order: 3 },
          { text: 'declare x = 5;', isCorrect: false, order: 4 },
        ],
      },
      {
        text: 'Which of the following is a JavaScript data type?',
        order: 2,
        points: 10,
        answers: [
          { text: 'String', isCorrect: true, order: 1 },
          { text: 'Integer', isCorrect: false, order: 2 },
          { text: 'Float', isCorrect: false, order: 3 },
          { text: 'Character', isCorrect: false, order: 4 },
        ],
      },
      {
        text: 'What does DOM stand for?',
        order: 3,
        points: 15,
        answers: [
          { text: 'Document Object Model', isCorrect: true, order: 1 },
          { text: 'Data Object Management', isCorrect: false, order: 2 },
          { text: 'Digital Output Method', isCorrect: false, order: 3 },
          { text: 'Document Oriented Markup', isCorrect: false, order: 4 },
        ],
      },
    ],
  };

  try {
    const newQuiz = await createQuiz(userId, quizInput);
    console.log('Quiz created successfully:', newQuiz.id);
    return newQuiz;
  } catch (error) {
    console.error('Error creating quiz:', error);
    throw error;
  }
}

// ============================================================================
// EXAMPLE 2: Get a Single Quiz with All Details
// ============================================================================

export async function exampleGetQuizDetails(quizId: string) {
  try {
    const quiz = await getQuizById(quizId);

    if (!quiz) {
      console.log('Quiz not found');
      return null;
    }

    console.log('Quiz Details:');
    console.log('- Title:', quiz.title);
    console.log('- Creator:', quiz.user.name);
    console.log('- Tags:', quiz.tags.map((t) => t.name).join(', '));
    console.log('- Questions:', quiz.questions.length);
    console.log('- Public:', quiz.isPublic);

    return quiz;
  } catch (error) {
    console.error('Error getting quiz:', error);
    throw error;
  }
}

// ============================================================================
// EXAMPLE 3: List Quizzes with Filters and Pagination
// ============================================================================

export async function exampleListQuizzes() {
  try {
    // Get public quizzes with specific tags
    const result = await getQuizzes(
      {
        isPublic: true,
        tagIds: ['science-tag-id', 'history-tag-id'],
        search: 'world', // Search in title/description
      },
      {
        page: 1,
        limit: 10,
      },
    );

    console.log(`Found ${result.pagination.total} quizzes`);
    console.log(`Showing page ${result.pagination.page} of ${result.pagination.totalPages}`);

    result.data.forEach((quiz) => {
      console.log(`- ${quiz.title} by ${quiz.user.name}`);
    });

    return result;
  } catch (error) {
    console.error('Error listing quizzes:', error);
    throw error;
  }
}

// ============================================================================
// EXAMPLE 4: Get User's Own Quizzes
// ============================================================================

export async function exampleGetUserQuizzes(userId: string) {
  try {
    const result = await getQuizzes(
      {
        userId, // Filter by creator
      },
      {
        page: 1,
        limit: 20,
      },
    );

    console.log(`User has created ${result.pagination.total} quizzes`);
    return result;
  } catch (error) {
    console.error('Error getting user quizzes:', error);
    throw error;
  }
}

// ============================================================================
// EXAMPLE 5: Update a Quiz
// ============================================================================

export async function exampleUpdateQuiz(quizId: string, userId: string) {
  const updateInput: UpdateQuizInput = {
    id: quizId,
    title: 'Updated Quiz Title',
    description: 'Updated description',
    isPublic: false, // Change to private
    tagIds: ['new-tag-id-1', 'new-tag-id-2'],
    questions: [
      {
        // Update existing question (include id)
        id: 'existing-question-id',
        text: 'Updated question text',
        order: 1,
        points: 20,
        answers: [
          {
            id: 'existing-answer-id-1',
            text: 'Updated answer 1',
            isCorrect: true,
            order: 1,
          },
          {
            id: 'existing-answer-id-2',
            text: 'Updated answer 2',
            isCorrect: false,
            order: 2,
          },
          {
            // New answer (no id)
            text: 'New answer option',
            isCorrect: false,
            order: 3,
          },
        ],
      },
      {
        // Add new question (no id)
        text: 'This is a brand new question',
        order: 2,
        points: 15,
        answers: [
          { text: 'Answer A', isCorrect: true, order: 1 },
          { text: 'Answer B', isCorrect: false, order: 2 },
          { text: 'Answer C', isCorrect: false, order: 3 },
        ],
      },
    ],
  };

  try {
    const updatedQuiz = await updateQuiz(quizId, userId, updateInput);

    if (!updatedQuiz) {
      console.log('Quiz not found or user does not own the quiz');
      return null;
    }

    console.log('Quiz updated successfully');
    return updatedQuiz;
  } catch (error) {
    console.error('Error updating quiz:', error);
    throw error;
  }
}

// ============================================================================
// EXAMPLE 6: Delete a Quiz
// ============================================================================

export async function exampleDeleteQuiz(quizId: string, userId: string) {
  try {
    // Check ownership first (optional, but good practice)
    const isOwner = await userOwnsQuiz(quizId, userId);

    if (!isOwner) {
      console.log('User does not own this quiz');
      return false;
    }

    const deleted = await deleteQuiz(quizId, userId);

    if (deleted) {
      console.log('Quiz deleted successfully');
    } else {
      console.log('Quiz not found');
    }

    return deleted;
  } catch (error) {
    console.error('Error deleting quiz:', error);
    throw error;
  }
}

// ============================================================================
// EXAMPLE 7: Get All Available Tags
// ============================================================================

export async function exampleGetTags() {
  try {
    const tags = await getAllTags();

    console.log('Available tags:');
    tags.forEach((tag) => {
      console.log(`- ${tag.name} (${tag.id})`);
    });

    return tags;
  } catch (error) {
    console.error('Error getting tags:', error);
    throw error;
  }
}

// ============================================================================
// EXAMPLE 8: Taking a Quiz (Get Questions Without Answers)
// ============================================================================

export async function exampleStartQuiz(quizId: string, userId?: string) {
  try {
    // Check if user can access the quiz
    const hasAccess = await canAccessQuiz(quizId, userId);

    if (!hasAccess) {
      console.log('User does not have access to this quiz');
      return null;
    }

    // Get quiz for taking (without correct answer flags)
    const quiz = await getQuizForTaking(quizId);

    if (!quiz) {
      console.log('Quiz not found');
      return null;
    }

    console.log(`Starting quiz: ${quiz.title}`);
    console.log(`Total questions: ${quiz.questions.length}`);

    return quiz;
  } catch (error) {
    console.error('Error starting quiz:', error);
    throw error;
  }
}

// ============================================================================
// EXAMPLE 9: Submit and Evaluate Quiz Answers
// ============================================================================

export async function exampleSubmitQuiz(
  quizId: string,
  userAnswers: Array<{ questionId: string; answerId: string }>,
) {
  const submission: QuizSubmission = {
    quizId,
    answers: userAnswers,
  };

  try {
    const result = await evaluateQuizSubmission(submission);

    if (!result) {
      console.log('Quiz not found');
      return null;
    }

    console.log('Quiz Results:');
    console.log(`Score: ${result.score} / ${result.maxScore} (${result.percentage}%)`);
    console.log(`Correct Answers: ${result.correctAnswers} / ${result.totalQuestions}`);

    // Show detailed results
    result.answers.forEach((answer, index) => {
      const status = answer.isCorrect ? '✓' : '✗';
      console.log(
        `Question ${index + 1}: ${status} (${answer.points} points)`,
      );
    });

    return result;
  } catch (error) {
    console.error('Error submitting quiz:', error);
    throw error;
  }
}

// ============================================================================
// EXAMPLE 10: Complete Quiz Flow (Create, Take, Submit)
// ============================================================================

export async function exampleCompleteQuizFlow(userId: string) {
  try {
    // 1. Create a quiz
    const quiz = await createQuiz(userId, {
      title: 'Sample Quiz',
      description: 'A sample quiz for testing',
      isPublic: true,
      tagIds: [],
      questions: [
        {
          text: 'What is 2 + 2?',
          order: 1,
          points: 10,
          answers: [
            { text: '3', isCorrect: false, order: 1 },
            { text: '4', isCorrect: true, order: 2 },
            { text: '5', isCorrect: false, order: 3 },
          ],
        },
      ],
    });

    console.log('Created quiz:', quiz.id);

    // 2. Get the quiz for taking
    const quizForTaking = await getQuizForTaking(quiz.id);
    console.log('Retrieved quiz for taking');

    // 3. Simulate user answering
    const questionId = quizForTaking!.questions[0].id;
    const correctAnswerId = quizForTaking!.questions[0].answers[1].id;

    // 4. Submit answers
    const result = await evaluateQuizSubmission({
      quizId: quiz.id,
      answers: [{ questionId, answerId: correctAnswerId }],
    });

    console.log('Quiz result:', result);

    // 5. Clean up - delete quiz
    await deleteQuiz(quiz.id, userId);
    console.log('Deleted test quiz');

    return result;
  } catch (error) {
    console.error('Error in complete quiz flow:', error);
    throw error;
  }
}

// ============================================================================
// EXAMPLE 11: Search and Filter Quizzes
// ============================================================================

export async function exampleSearchQuizzes(searchTerm: string) {
  try {
    const result = await getQuizzes(
      {
        search: searchTerm,
        isPublic: true,
      },
      {
        page: 1,
        limit: 10,
      },
    );

    console.log(`Found ${result.pagination.total} quizzes matching "${searchTerm}"`);

    return result;
  } catch (error) {
    console.error('Error searching quizzes:', error);
    throw error;
  }
}

// ============================================================================
// EXAMPLE 12: Check Quiz Ownership
// ============================================================================

export async function exampleCheckOwnership(quizId: string, userId: string) {
  try {
    const isOwner = await userOwnsQuiz(quizId, userId);

    if (isOwner) {
      console.log('User owns this quiz and can edit/delete it');
    } else {
      console.log('User does not own this quiz');
    }

    return isOwner;
  } catch (error) {
    console.error('Error checking ownership:', error);
    throw error;
  }
}
