import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  CheckCircle2,
  XCircle,
  Award,
  Clock,
  ArrowLeft,
  ArrowRight,
  Send,
} from 'lucide-react';

export const Route = createFileRoute('/quiz/$quizId_/take')({
  component: TakeQuizPage,
});

type QuizQuestion = {
  id: string;
  text: string;
  order: number;
  points: number;
  answers: {
    id: string;
    text: string;
    order: number;
  }[];
};

type QuizData = {
  id: string;
  title: string;
  description: string | null;
  questions: QuizQuestion[];
};

type QuizResult = {
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

function TakeQuizPage() {
  const { quizId } = Route.useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchQuiz();
  }, [quizId]);

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/quiz/${quizId}/take`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch quiz');
      }

      const data: QuizData = await response.json();
      setQuiz(data);
    } catch (err) {
      console.error('Error fetching quiz:', err);
      setError(err instanceof Error ? err.message : 'Failed to load quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId: string, answerId: string) => {
    if (submitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answerId,
    }));
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleNext = () => {
    if (quiz && currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleSubmit = async () => {
    if (!quiz) return;

    // Check if all questions are answered
    const unansweredQuestions = quiz.questions.filter(
      (q) => !selectedAnswers[q.id]
    );

    if (unansweredQuestions.length > 0) {
      alert(
        `Please answer all questions before submitting. ${unansweredQuestions.length} question(s) remaining.`
      );
      return;
    }

    try {
      setSubmitting(true);

      const submission = {
        quizId: quiz.id,
        answers: quiz.questions.map((q) => ({
          questionId: q.id,
          answerId: selectedAnswers[q.id],
        })),
      };

      const response = await fetch(`/api/quiz/${quizId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submission),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit quiz');
      }

      const resultData: QuizResult = await response.json();
      setResult(resultData);
      setSubmitted(true);
      setCurrentQuestionIndex(0); // Reset to first question to show results
    } catch (err) {
      console.error('Error submitting quiz:', err);
      alert(err instanceof Error ? err.message : 'Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetake = () => {
    setSelectedAnswers({});
    setSubmitted(false);
    setResult(null);
    setCurrentQuestionIndex(0);
  };

  const handleBackToList = () => {
    navigate({ to: '/take-quiz' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block size-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4"></div>
          <p className="text-muted-foreground">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <XCircle className="size-16 text-destructive mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Unable to Load Quiz</h2>
                <p className="text-muted-foreground mb-6">
                  {error || 'Quiz not found'}
                </p>
                <Button onClick={handleBackToList}>Back to Quiz List</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const totalQuestions = quiz.questions.length;
  const answeredCount = Object.keys(selectedAnswers).length;
  const progress = (answeredCount / totalQuestions) * 100;

  // Get result for current question if submitted
  const currentQuestionResult = result?.answers.find(
    (a) => a.questionId === currentQuestion.id
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleBackToList}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="size-4" />
            Back to Quizzes
          </Button>
          <h1 className="text-3xl font-bold text-foreground mb-2">{quiz.title}</h1>
          {quiz.description && (
            <p className="text-muted-foreground">{quiz.description}</p>
          )}
        </div>

        {/* Results Summary */}
        {submitted && result && (
          <Card className="mb-6 border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="size-6 text-primary" />
                Quiz Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">
                    {result.score}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    out of {result.maxScore} points
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">
                    {result.percentage}%
                  </div>
                  <div className="text-sm text-muted-foreground">Score</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {result.correctAnswers}
                  </div>
                  <div className="text-sm text-muted-foreground">Correct</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">
                    {result.totalQuestions - result.correctAnswers}
                  </div>
                  <div className="text-sm text-muted-foreground">Incorrect</div>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button onClick={handleRetake} className="flex-1">
                  Retake Quiz
                </Button>
                <Button
                  variant="outline"
                  onClick={handleBackToList}
                  className="flex-1"
                >
                  Back to List
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress Bar */}
        {!submitted && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-muted-foreground">
                {answeredCount} / {totalQuestions} answered
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Question Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <Badge variant="secondary">
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Clock className="size-3" />
                {currentQuestion.points} {currentQuestion.points === 1 ? 'point' : 'points'}
              </Badge>
            </div>
            <CardTitle className="text-xl">{currentQuestion.text}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {currentQuestion.answers.map((answer) => {
                const isSelected = selectedAnswers[currentQuestion.id] === answer.id;
                const isCorrectAnswer =
                  submitted && currentQuestionResult?.correctAnswerId === answer.id;
                const isWrongSelection =
                  submitted &&
                  isSelected &&
                  currentQuestionResult?.correctAnswerId !== answer.id;

                return (
                  <button
                    key={answer.id}
                    onClick={() => handleAnswerSelect(currentQuestion.id, answer.id)}
                    disabled={submitted}
                    className={`
                      w-full text-left p-4 rounded-lg border-2 transition-all
                      ${
                        submitted
                          ? isCorrectAnswer
                            ? 'border-green-500 bg-green-50 dark:bg-green-950'
                            : isWrongSelection
                              ? 'border-red-500 bg-red-50 dark:bg-red-950'
                              : 'border-border bg-muted'
                          : isSelected
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50 hover:bg-muted'
                      }
                      ${submitted ? 'cursor-default' : 'cursor-pointer'}
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex-1">{answer.text}</span>
                      {submitted && isCorrectAnswer && (
                        <CheckCircle2 className="size-5 text-green-600 ml-2 shrink-0" />
                      )}
                      {submitted && isWrongSelection && (
                        <XCircle className="size-5 text-red-600 ml-2 shrink-0" />
                      )}
                      {!submitted && isSelected && (
                        <div className="size-5 rounded-full bg-primary ml-2 shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Result explanation for current question */}
            {submitted && currentQuestionResult && (
              <div className="mt-4 p-4 rounded-lg bg-muted">
                <div className="flex items-start gap-2">
                  {currentQuestionResult.isCorrect ? (
                    <CheckCircle2 className="size-5 text-green-600 mt-0.5 shrink-0" />
                  ) : (
                    <XCircle className="size-5 text-red-600 mt-0.5 shrink-0" />
                  )}
                  <div>
                    <p className="font-medium">
                      {currentQuestionResult.isCorrect
                        ? 'Correct!'
                        : 'Incorrect'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {currentQuestionResult.isCorrect
                        ? `You earned ${currentQuestionResult.points} ${currentQuestionResult.points === 1 ? 'point' : 'points'}!`
                        : `The correct answer is highlighted above.`}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="gap-2"
          >
            <ArrowLeft className="size-4" />
            Previous
          </Button>

          <div className="text-sm text-muted-foreground">
            {currentQuestionIndex + 1} / {totalQuestions}
          </div>

          {currentQuestionIndex < totalQuestions - 1 ? (
            <Button onClick={handleNext} className="gap-2">
              Next
              <ArrowRight className="size-4" />
            </Button>
          ) : (
            !submitted && (
              <Button
                onClick={handleSubmit}
                disabled={submitting || answeredCount < totalQuestions}
                className="gap-2"
              >
                {submitting ? (
                  <>
                    <div className="size-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="size-4" />
                    Submit Quiz
                  </>
                )}
              </Button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
