import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { QuizInfoCard } from '@/components/quiz-info/QuizInfoCard';
import { QuizQuestionsCard } from '@/components/quiz-questions/QuizQuestionsCard';
import type { Question } from '@/components/quiz-questions/QuizQuestionsCard';
import { useSession } from '@/lib/auth/client';
import type { CreateQuizInput, Tag } from '@/db/types';

export const Route = createFileRoute('/create-quiz')({
  component: CreateQuiz,
});

interface QuizForm {
  title: string;
  description: string;
  isPublic: boolean;
  tags: Tag[];
  questions: Question[];
}

function CreateQuiz() {
  const navigate = useNavigate();
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [quiz, setQuiz] = useState<QuizForm>({
    title: '',
    description: '',
    isPublic: true,
    tags: [],
    questions: [
      {
        id: '1',
        text: '',
        answers: [
          { id: '1', text: '', isCorrect: true },
          { id: '2', text: '', isCorrect: false },
        ],
      },
    ],
  });

  const handleQuizChange = (field: 'title' | 'description', value: string) => {
    setQuiz((prev) => ({ ...prev, [field]: value }));
  };

  const handleQuestionChange = (questionId: string, text: string) => {
    setQuiz((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === questionId ? { ...q, text } : q,
      ),
    }));
  };

  const handleAnswerChange = (
    questionId: string,
    answerId: string,
    text: string,
  ) => {
    setQuiz((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              answers: q.answers.map((a) =>
                a.id === answerId ? { ...a, text } : a,
              ),
            }
          : q,
      ),
    }));
  };

  const handleAnswerCorrectChange = (questionId: string, answerId: string) => {
    setQuiz((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              answers: q.answers.map((a) =>
                a.id === answerId
                  ? { ...a, isCorrect: !a.isCorrect }
                  : { ...a, isCorrect: false },
              ),
            }
          : q,
      ),
    }));
  };

  const addQuestion = () => {
    const newQuestionId = String(
      Math.max(...quiz.questions.map((q) => parseInt(q.id, 10)), 0) + 1,
    );
    setQuiz((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          id: newQuestionId,
          text: '',
          answers: [
            { id: '1', text: '', isCorrect: true },
            { id: '2', text: '', isCorrect: false },
          ],
        },
      ],
    }));
  };

  const removeQuestion = (questionId: string) => {
    if (quiz.questions.length > 1) {
      setQuiz((prev) => ({
        ...prev,
        questions: prev.questions.filter((q) => q.id !== questionId),
      }));
    }
  };

  const addAnswer = (questionId: string) => {
    setQuiz((prev) => ({
      ...prev,
      questions: prev.questions.map((q) => {
        if (q.id === questionId) {
          const newAnswerId = String(
            Math.max(...q.answers.map((a) => parseInt(a.id, 10)), 0) + 1,
          );
          return {
            ...q,
            answers: [
              ...q.answers,
              { id: newAnswerId, text: '', isCorrect: false },
            ],
          };
        }
        return q;
      }),
    }));
  };

  const removeAnswer = (questionId: string, answerId: string) => {
    setQuiz((prev) => ({
      ...prev,
      questions: prev.questions.map((q) => {
        if (q.id === questionId && q.answers.length > 2) {
          return {
            ...q,
            answers: q.answers.filter((a) => a.id !== answerId),
          };
        }
        return q;
      }),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if user is authenticated
    if (!session?.user) {
      setError('You must be logged in to create a quiz');
      return;
    }

    // Validate quiz data
    if (!quiz.title.trim()) {
      setError('Quiz title is required');
      return;
    }

    if (quiz.questions.length === 0) {
      setError('At least one question is required');
      return;
    }

    // Validate each question has text and at least 2 answers with one correct
    for (const question of quiz.questions) {
      if (!question.text.trim()) {
        setError('All questions must have text');
        return;
      }

      if (question.answers.length < 2) {
        setError('Each question must have at least 2 answers');
        return;
      }

      const hasCorrectAnswer = question.answers.some((a) => a.isCorrect);
      if (!hasCorrectAnswer) {
        setError('Each question must have one correct answer');
        return;
      }

      const allAnswersHaveText = question.answers.every((a) => a.text.trim());
      if (!allAnswersHaveText) {
        setError('All answers must have text');
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Process tags: pass tag IDs for existing tags and tag names for new tags
      // The backend will handle creating new tags
      const tagIds: string[] = quiz.tags.map((tag) => {
        // If tag ID starts with 'temp-', it's a new tag, pass the name
        if (tag.id.startsWith('temp-')) {
          return tag.name;
        }
        // Otherwise, pass the existing tag ID
        return tag.id;
      });

      // Transform the quiz data to match the CreateQuizInput type
      const quizInput: CreateQuizInput = {
        title: quiz.title,
        description: quiz.description || undefined,
        isPublic: quiz.isPublic,
        tagIds,
        questions: quiz.questions.map((q, index) => ({
          text: q.text,
          order: index + 1,
          points: 10, // Default points, you can add UI for this later
          answers: q.answers.map((a, answerIndex) => ({
            text: a.text,
            isCorrect: a.isCorrect,
            order: answerIndex + 1,
          })),
        })),
      };

      // Call the API endpoint to create the quiz
      const response = await fetch('/api/quiz/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quizInput),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create quiz');
      }

      if (result.success) {
        // Navigate to the quiz detail page or home page
        alert('Quiz created successfully!');
        navigate({ to: '/' });
      }
    } catch (err) {
      console.error('Error creating quiz:', err);
      setError(err instanceof Error ? err.message : 'Failed to create quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen px-4 py-12"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      <div className="max-w-4xl mx-auto">
        <h1
          className="text-4xl md:text-5xl font-bold mb-2"
          style={{ color: 'var(--color-foreground)' }}
        >
          Create a New Quiz
        </h1>
        <p
          className="text-lg mb-8"
          style={{ color: 'var(--color-muted-foreground)' }}
        >
          Design your custom quiz with questions and multiple-choice answers
        </p>

        {!session?.user && (
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
            <p className="text-yellow-800 dark:text-yellow-200">
              You must be logged in to create a quiz. Please sign in to
              continue.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <QuizInfoCard
            title={quiz.title}
            description={quiz.description}
            isPublic={quiz.isPublic}
            tags={quiz.tags}
            onChange={handleQuizChange}
            onPublicChange={(isPublic) =>
              setQuiz((prev) => ({ ...prev, isPublic }))
            }
            onTagsChange={(tags) => setQuiz((prev) => ({ ...prev, tags }))}
          />

          <QuizQuestionsCard
            questions={quiz.questions}
            onQuestionChange={handleQuestionChange}
            onAnswerChange={handleAnswerChange}
            onAnswerCorrectChange={handleAnswerCorrectChange}
            onAddQuestion={addQuestion}
            onRemoveQuestion={removeQuestion}
            onAddAnswer={addAnswer}
            onRemoveAnswer={removeAnswer}
          />

          {/* Submit Section */}
          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => window.history.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              disabled={
                !session?.user ||
                !quiz.title ||
                quiz.questions.some((q) => !q.text) ||
                isSubmitting
              }
            >
              {isSubmitting ? 'Creating...' : 'Create Quiz'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateQuiz;
