import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import type {
  quiz,
  tag,
  quizTag,
  question,
  answer,
  quizAttempt,
} from './schema';

// Select types (for reading from database)
export type Quiz = InferSelectModel<typeof quiz>;
export type Tag = InferSelectModel<typeof tag>;
export type QuizTag = InferSelectModel<typeof quizTag>;
export type Question = InferSelectModel<typeof question>;
export type Answer = InferSelectModel<typeof answer>;
export type QuizAttempt = InferSelectModel<typeof quizAttempt>;

// Insert types (for inserting into database)
export type QuizInsert = InferInsertModel<typeof quiz>;
export type TagInsert = InferInsertModel<typeof tag>;
export type QuizTagInsert = InferInsertModel<typeof quizTag>;
export type QuestionInsert = InferInsertModel<typeof question>;
export type AnswerInsert = InferInsertModel<typeof answer>;
export type QuizAttemptInsert = InferInsertModel<typeof quizAttempt>;

// Extended types with relations
export type QuizWithRelations = Quiz & {
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
  tags: Tag[];
  questions: (Question & {
    answers: Answer[];
  })[];
  stats?: {
    completionCount: number;
    averageScore: number;
  };
};

export type QuestionWithAnswers = Question & {
  answers: Answer[];
};

export type QuizWithTagsAndQuestions = Quiz & {
  tags: Tag[];
  questions: QuestionWithAnswers[];
};

// Input types for creating quizzes
export type CreateQuizInput = {
  title: string;
  description?: string;
  isPublic: boolean;
  tagIds: string[];
  questions: {
    text: string;
    order: number;
    points: number;
    answers: {
      text: string;
      isCorrect: boolean;
      order: number;
    }[];
  }[];
};

export type UpdateQuizInput = Partial<Omit<CreateQuizInput, 'questions'>> & {
  id: string;
  questions?: {
    id?: string; // If exists, update; if not, create new
    text: string;
    order: number;
    points: number;
    answers: {
      id?: string; // If exists, update; if not, create new
      text: string;
      isCorrect: boolean;
      order: number;
    }[];
  }[];
};

// Quiz submission types
export type QuizSubmission = {
  quizId: string;
  answers: {
    questionId: string;
    answerId: string;
  }[];
};

export type QuizResult = {
  quizId: string;
  score: number;
  maxScore: number;
  percentage: number;
  correctAnswers: number;
  totalQuestions: number;
  answers: {
    questionId: string;
    selectedAnswerId: string;
    correctAnswerId: string;
    isCorrect: boolean;
    points: number;
  }[];
};

// Filter and pagination types
export type QuizFilters = {
  userId?: string;
  excludeUserId?: string;
  tagIds?: string[];
  isPublic?: boolean;
  search?: string;
  sortBy?: 'latest' | 'popular' | 'hardest';
};

export type PaginationParams = {
  page?: number;
  limit?: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

// Quiz statistics types
export type QuizStats = {
  completionCount: number;
  averageScore: number;
};
