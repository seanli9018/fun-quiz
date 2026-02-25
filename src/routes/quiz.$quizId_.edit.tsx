import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { QuizInfoCard } from '@/components/quiz-info/QuizInfoCard';
import { QuizQuestionsCard } from '@/components/quiz-questions/QuizQuestionsCard';
import type { Question } from '@/components/quiz-questions/QuizQuestionsCard';
import { useSession } from '@/lib/auth/client';
import type { QuizWithRelations, Tag } from '@/db/types';
import { ArrowLeft } from 'lucide-react';

export const Route = createFileRoute('/quiz/$quizId_/edit')({
  component: EditQuiz,
});

interface QuizForm {
  title: string;
  description: string;
  isPublic: boolean;
  tags: Tag[];
  questions: Question[];
}

function EditQuiz() {
  const { quizId } = Route.useParams();
  const navigate = useNavigate();
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<QuizForm>({
    title: '',
    description: '',
    isPublic: true,
    tags: [],
    questions: [],
  });

  useEffect(() => {
    async function fetchQuiz() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/quiz/${quizId}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch quiz');
        }

        if (result.success) {
          const quizData: QuizWithRelations = result.data;

          // Check if user owns this quiz
          if (session?.user?.id !== quizData.userId) {
            setError('You do not have permission to edit this quiz');
            return;
          }

          // Transform the quiz data to match the form structure
          setQuiz({
            title: quizData.title,
            description: quizData.description || '',
            isPublic: quizData.isPublic,
            tags: quizData.tags,
            questions: quizData.questions.map((q) => ({
              id: q.id,
              text: q.text,
              points: q.points,
              answers: q.answers.map((a) => ({
                id: a.id,
                text: a.text,
                isCorrect: a.isCorrect,
              })),
            })),
          });
        }
      } catch (err) {
        console.error('Error fetching quiz:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch quiz');
      } finally {
        setIsLoading(false);
      }
    }

    if (session?.user) {
      fetchQuiz();
    }
  }, [quizId, session]);

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

  const handlePointsChange = (questionId: string, points: number) => {
    setQuiz((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === questionId ? { ...q, points } : q,
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
    const newQuestionId = `temp-${Date.now()}`;
    setQuiz((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          id: newQuestionId,
          text: '',
          points: 1,
          answers: [
            { id: `temp-${Date.now()}-1`, text: '', isCorrect: true },
            { id: `temp-${Date.now()}-2`, text: '', isCorrect: false },
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
          const newAnswerId = `temp-${Date.now()}`;
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
      setError('You must be logged in to edit a quiz');
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
      const tagIds: string[] = quiz.tags.map((tag) => {
        // If tag ID starts with 'temp-', it's a new tag, pass the name
        if (tag.id.startsWith('temp-')) {
          return tag.name;
        }
        // Otherwise, pass the existing tag ID
        return tag.id;
      });

      // Transform the quiz data to match the UpdateQuizInput type
      const quizInput = {
        title: quiz.title,
        description: quiz.description || undefined,
        isPublic: quiz.isPublic,
        tagIds,
        questions: quiz.questions.map((q, index) => ({
          id: q.id.startsWith('temp-') ? undefined : q.id, // Don't send temp IDs
          text: q.text,
          order: index + 1,
          points: q.points,
          answers: q.answers.map((a, answerIndex) => ({
            id: a.id.startsWith('temp-') ? undefined : a.id, // Don't send temp IDs
            text: a.text,
            isCorrect: a.isCorrect,
            order: answerIndex + 1,
          })),
        })),
      };

      // Call the API endpoint to update the quiz
      const response = await fetch(`/api/quiz/${quizId}/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quizInput),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update quiz');
      }

      if (result.success) {
        alert('Quiz updated successfully!');
        navigate({ to: `/quiz/${quizId}` });
      }
    } catch (err) {
      console.error('Error updating quiz:', err);
      setError(err instanceof Error ? err.message : 'Failed to update quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--color-background)' }}
      >
        <div style={{ color: 'var(--color-foreground)' }}>Loading quiz...</div>
      </div>
    );
  }

  if (error && quiz.questions.length === 0) {
    return (
      <div
        className="min-h-screen px-4 py-12"
        style={{ backgroundColor: 'var(--color-background)' }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <h1
              className="text-3xl font-bold mb-4"
              style={{ color: 'var(--color-foreground)' }}
            >
              {error}
            </h1>
            <Button
              variant="outline"
              onClick={() => navigate({ to: '/dashboard' })}
            >
              <ArrowLeft className="size-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen px-4 py-12"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate({ to: `/quiz/${quizId}` })}
          >
            <ArrowLeft className="size-4 mr-2" />
            Back to Quiz
          </Button>
        </div>

        <h1
          className="text-4xl md:text-5xl font-bold mb-2"
          style={{ color: 'var(--color-foreground)' }}
        >
          Edit Quiz
        </h1>
        <p
          className="text-lg mb-8"
          style={{ color: 'var(--color-muted-foreground)' }}
        >
          Update your quiz questions and settings
        </p>

        {!session?.user && (
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
            <p className="text-yellow-800 dark:text-yellow-200">
              You must be logged in to edit a quiz. Please sign in to continue.
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
            onPointsChange={handlePointsChange}
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
              onClick={() => navigate({ to: `/quiz/${quizId}` })}
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
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditQuiz;
