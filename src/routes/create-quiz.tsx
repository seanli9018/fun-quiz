import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { QuizInfoCard } from '@/components/quiz-info/QuizInfoCard';
import { QuizQuestionsCard } from '@/components/quiz-questions/QuizQuestionsCard';
import type { Question } from '@/components/quiz-questions/QuizQuestionsCard';

export const Route = createFileRoute('/create-quiz')({
  component: CreateQuiz,
});

interface QuizForm {
  title: string;
  description: string;
  questions: Question[];
}

function CreateQuiz() {
  const [quiz, setQuiz] = useState<QuizForm>({
    title: '',
    description: '',
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Quiz submitted:', quiz);
    // TODO: Send quiz data to backend
    alert('Quiz created! (Check console for data)');
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

        <form onSubmit={handleSubmit} className="space-y-8">
          <QuizInfoCard
            title={quiz.title}
            description={quiz.description}
            onChange={handleQuizChange}
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
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              disabled={!quiz.title || quiz.questions.some((q) => !q.text)}
            >
              Create Quiz
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateQuiz;
