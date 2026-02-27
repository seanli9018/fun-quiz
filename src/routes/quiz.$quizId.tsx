import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { useSession } from '@/lib/auth/client';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { QuizWithRelations } from '@/db/types';
import { formatCompletionCount } from '@/lib/utils';
import {
  Users,
  TrendingUp,
  Calendar,
  Lock,
  Globe,
  ArrowLeft,
  Pencil,
  Trash2,
} from 'lucide-react';
import { ErrorCard } from '@/components/error/ErrorCard';

export const Route = createFileRoute('/quiz/$quizId')({
  component: QuizView,
});

function QuizView() {
  const { quizId } = Route.useParams();
  const navigate = useNavigate();
  const { data: session } = useSession();
  const [quiz, setQuiz] = useState<QuizWithRelations | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
          setQuiz(result.data);
        }
      } catch (err) {
        console.error('Error fetching quiz:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch quiz');
      } finally {
        setIsLoading(false);
      }
    }

    fetchQuiz();
  }, [quizId]);

  const handleDelete = async () => {
    if (
      !confirm(
        'Are you sure you want to delete this quiz? This action cannot be undone.',
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/quiz/${quizId}/delete`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete quiz');
      }

      if (result.success) {
        alert('Quiz deleted successfully!');
        navigate({ to: '/dashboard' });
      }
    } catch (err) {
      console.error('Error deleting quiz:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete quiz');
    } finally {
      setIsDeleting(false);
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

  if (error || !quiz) {
    return (
      <div
        className="min-h-screen px-4 py-12"
        style={{ backgroundColor: 'var(--color-background)' }}
      >
        <div className="max-w-4xl mx-auto">
          <ErrorCard
            type={error ? 'server' : 'not-found'}
            title={error ? 'Failed to Load Quiz' : undefined}
            message={error || undefined}
            onGoHome={() => navigate({ to: '/dashboard' })}
          />
        </div>
      </div>
    );
  }

  const isOwner = session?.user?.id === quiz.userId;

  // Non-owners cannot view private quizzes at all
  if (!quiz.isPublic && !isOwner) {
    return (
      <div
        className="min-h-screen px-4 py-12"
        style={{ backgroundColor: 'var(--color-background)' }}
      >
        <div className="max-w-4xl mx-auto">
          <ErrorCard
            type="forbidden"
            message="This quiz is private and can only be accessed by its owner."
            onGoHome={() => navigate({ to: '/dashboard' })}
          />
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
        {/* Back Button */}
        <div className="mb-6">
          <Link to="/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="size-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Quiz Header */}
        <div
          className="p-8 rounded-lg mb-6"
          style={{
            backgroundColor: 'var(--color-card)',
            borderColor: 'var(--color-border)',
            borderWidth: '1px',
          }}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1
                className="text-4xl font-bold mb-2"
                style={{ color: 'var(--color-foreground)' }}
              >
                {quiz.title}
              </h1>
              {quiz.description && (
                <p
                  className="text-lg"
                  style={{ color: 'var(--color-muted-foreground)' }}
                >
                  {quiz.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 ml-4">
              {quiz.isPublic ? (
                <Badge variant="default">
                  <Globe className="size-3 mr-1" />
                  Public
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <Lock className="size-3 mr-1" />
                  Private
                </Badge>
              )}
            </div>
          </div>

          {/* Tags */}
          {quiz.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {quiz.tags.map((tag) => (
                <Badge key={tag.id} variant="outline">
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}

          {/* Quiz Meta Info */}
          <div
            className="flex flex-wrap gap-4 text-sm mb-6"
            style={{ color: 'var(--color-muted-foreground)' }}
          >
            <span className="flex items-center gap-1">
              <Calendar className="size-4" />
              Created {new Date(quiz.createdAt).toLocaleDateString()}
            </span>
            <span>•</span>
            <span>{quiz.questions.length} questions</span>
            {quiz.stats && quiz.stats.completionCount > 0 && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Users className="size-4" />
                  {formatCompletionCount(quiz.stats.completionCount)} taken
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <TrendingUp className="size-4" />
                  {quiz.stats.averageScore}% avg score
                </span>
              </>
            )}
          </div>

          {/* Creator Info */}
          <div
            className="text-sm mb-6"
            style={{ color: 'var(--color-muted-foreground)' }}
          >
            Created by{' '}
            <strong>
              {quiz.user.name === 'Admin' ? 'FunQuiz' : quiz.user.name}
            </strong>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Link
              to="/quiz/$quizId/take"
              params={{ quizId: quiz.id }}
              className="flex-1"
            >
              <Button variant="default" size="lg" className="w-full">
                Take Quiz
              </Button>
            </Link>
            {isOwner && (
              <>
                <Link to="/quiz/$quizId/edit" params={{ quizId: quiz.id }}>
                  <Button variant="outline" size="lg">
                    <Pencil className="size-4 mr-2" />
                    Edit
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  style={{
                    color: 'var(--color-destructive)',
                    borderColor: 'var(--color-destructive)',
                  }}
                >
                  <Trash2 className="size-4 mr-2" />
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Questions Preview */}
        {isOwner ? (
          <div
            className="p-8 rounded-lg"
            style={{
              backgroundColor: 'var(--color-card)',
              borderColor: 'var(--color-border)',
              borderWidth: '1px',
            }}
          >
            <h2
              className="text-2xl font-bold mb-6"
              style={{ color: 'var(--color-foreground)' }}
            >
              Questions Preview (Owner View)
            </h2>

            <div className="space-y-6">
              {quiz.questions.map((question, index) => (
                <div
                  key={question.id}
                  className="pb-6 border-b"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <div className="flex gap-4">
                    <div
                      className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold"
                      style={{
                        backgroundColor: 'var(--color-primary)',
                        color: 'var(--color-primary-foreground)',
                      }}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h3
                        className="text-lg font-semibold mb-3"
                        style={{ color: 'var(--color-foreground)' }}
                      >
                        {question.text}
                      </h3>
                      <div className="space-y-2">
                        {question.answers.map((answer) => (
                          <div
                            key={answer.id}
                            className="p-3 rounded-md flex items-center"
                            style={{
                              backgroundColor: answer.isCorrect
                                ? 'var(--color-success-light, #dcfce7)'
                                : 'var(--color-muted)',
                              borderWidth: '1px',
                              borderColor: answer.isCorrect
                                ? 'var(--color-success, #22c55e)'
                                : 'var(--color-border)',
                            }}
                          >
                            <span
                              style={{
                                color: answer.isCorrect
                                  ? 'var(--color-success, #22c55e)'
                                  : 'var(--color-foreground)',
                              }}
                            >
                              {answer.text}
                            </span>
                            {answer.isCorrect && (
                              <Badge
                                variant="default"
                                className="ml-auto"
                                style={{
                                  backgroundColor:
                                    'var(--color-success, #22c55e)',
                                  color: 'white',
                                }}
                              >
                                Correct
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                      <div
                        className="mt-2 text-sm"
                        style={{ color: 'var(--color-muted-foreground)' }}
                      >
                        Points: {question.points}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div
            className="p-8 rounded-lg text-center"
            style={{
              backgroundColor: 'var(--color-card)',
              borderColor: 'var(--color-border)',
              borderWidth: '1px',
            }}
          >
            <h2
              className="text-2xl font-bold mb-4"
              style={{ color: 'var(--color-foreground)' }}
            >
              Ready to Test Your Knowledge?
            </h2>
            <p
              className="text-lg mb-6"
              style={{ color: 'var(--color-muted-foreground)' }}
            >
              This quiz has {quiz.questions.length} questions. Click below to
              start!
            </p>
            <Link to="/quiz/$quizId/take" params={{ quizId: quiz.id }}>
              <Button variant="default" size="lg">
                Start Quiz
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default QuizView;
