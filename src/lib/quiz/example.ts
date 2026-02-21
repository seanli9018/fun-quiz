import type { CreateQuizInput } from '@/db/types';

/**
 * Example quiz data for testing the quiz creation feature
 * This demonstrates the structure needed to create a quiz
 */

export const exampleQuizBasic: CreateQuizInput = {
  title: 'Basic Math Quiz',
  description: 'Test your basic arithmetic skills',
  isPublic: true,
  tagIds: [], // Can be populated with actual tag IDs from database
  questions: [
    {
      text: 'What is 2 + 2?',
      order: 1,
      points: 10,
      answers: [
        { text: '3', isCorrect: false, order: 1 },
        { text: '4', isCorrect: true, order: 2 },
        { text: '5', isCorrect: false, order: 3 },
        { text: '22', isCorrect: false, order: 4 },
      ],
    },
    {
      text: 'What is 10 × 5?',
      order: 2,
      points: 10,
      answers: [
        { text: '50', isCorrect: true, order: 1 },
        { text: '15', isCorrect: false, order: 2 },
        { text: '105', isCorrect: false, order: 3 },
        { text: '100', isCorrect: false, order: 4 },
      ],
    },
  ],
};

export const exampleQuizAdvanced: CreateQuizInput = {
  title: 'World Geography Challenge',
  description:
    'A comprehensive test of your knowledge about countries, capitals, and landmarks around the world',
  isPublic: true,
  tagIds: [], // Add geography tag ID here
  questions: [
    {
      text: 'What is the capital of France?',
      order: 1,
      points: 5,
      answers: [
        { text: 'London', isCorrect: false, order: 1 },
        { text: 'Paris', isCorrect: true, order: 2 },
        { text: 'Berlin', isCorrect: false, order: 3 },
        { text: 'Madrid', isCorrect: false, order: 4 },
      ],
    },
    {
      text: 'Which country has the largest population?',
      order: 2,
      points: 10,
      answers: [
        { text: 'India', isCorrect: false, order: 1 },
        { text: 'United States', isCorrect: false, order: 2 },
        { text: 'China', isCorrect: true, order: 3 },
        { text: 'Indonesia', isCorrect: false, order: 4 },
      ],
    },
    {
      text: 'What is the longest river in the world?',
      order: 3,
      points: 15,
      answers: [
        { text: 'Amazon River', isCorrect: false, order: 1 },
        { text: 'Nile River', isCorrect: true, order: 2 },
        { text: 'Yangtze River', isCorrect: false, order: 3 },
        { text: 'Mississippi River', isCorrect: false, order: 4 },
      ],
    },
    {
      text: 'Which continent is the Sahara Desert located on?',
      order: 4,
      points: 5,
      answers: [
        { text: 'Asia', isCorrect: false, order: 1 },
        { text: 'Australia', isCorrect: false, order: 2 },
        { text: 'Africa', isCorrect: true, order: 3 },
        { text: 'South America', isCorrect: false, order: 4 },
      ],
    },
  ],
};

export const exampleQuizPrivate: CreateQuizInput = {
  title: 'Company Training Quiz',
  description: 'Internal training assessment for new employees',
  isPublic: false, // Private quiz
  tagIds: [],
  questions: [
    {
      text: 'What is our company mission statement?',
      order: 1,
      points: 10,
      answers: [
        {
          text: 'To provide excellent customer service',
          isCorrect: false,
          order: 1,
        },
        {
          text: 'To innovate and lead the industry',
          isCorrect: true,
          order: 2,
        },
        { text: 'To maximize profits', isCorrect: false, order: 3 },
      ],
    },
  ],
};

export const exampleQuizMinimal: CreateQuizInput = {
  title: 'Quick True/False Quiz',
  isPublic: true,
  tagIds: [],
  questions: [
    {
      text: 'The Earth is flat.',
      order: 1,
      points: 10,
      answers: [
        { text: 'True', isCorrect: false, order: 1 },
        { text: 'False', isCorrect: true, order: 2 },
      ],
    },
  ],
};

/**
 * Example function to create a quiz programmatically
 * Note: This can only be called from server-side code
 */
export async function createExampleQuiz() {
  // This would be called from a server action or API route
  const response = await fetch('/api/quiz/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(exampleQuizBasic),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create quiz');
  }

  const result = await response.json();
  return result.quiz;
}

/**
 * Helper function to validate quiz data before submission
 */
export function validateQuizInput(input: CreateQuizInput): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate title
  if (!input.title.trim()) {
    errors.push('Quiz title is required');
  }

  // Validate questions
  if (input.questions.length === 0) {
    errors.push('At least one question is required');
  }

  input.questions.forEach((question, index) => {
    // Validate question text
    if (!question.text.trim()) {
      errors.push(`Question ${index + 1} must have text`);
    }

    // Validate answers
    if (question.answers.length < 2) {
      errors.push(`Question ${index + 1} must have at least 2 answers`);
    }

    // Validate correct answer
    const correctAnswers = question.answers.filter((a) => a.isCorrect);
    if (correctAnswers.length === 0) {
      errors.push(`Question ${index + 1} must have at least one correct answer`);
    }
    if (correctAnswers.length > 1) {
      errors.push(`Question ${index + 1} can only have one correct answer`);
    }

    // Validate answer text
    question.answers.forEach((answer, answerIndex) => {
      if (!answer.text.trim()) {
        errors.push(
          `Question ${index + 1}, Answer ${answerIndex + 1} must have text`,
        );
      }
    });

    // Validate points
    if (question.points < 1) {
      errors.push(`Question ${index + 1} must have at least 1 point`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Example usage:
 *
 * import { exampleQuizBasic, validateQuizInput } from '@/lib/quiz/example';
 *
 * // Validate before sending
 * const validation = validateQuizInput(exampleQuizBasic);
 * if (!validation.valid) {
 *   console.error('Validation errors:', validation.errors);
 *   return;
 * }
 *
 * // Send to API
 * const response = await fetch('/api/quiz/create', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify(exampleQuizBasic),
 * });
 */
