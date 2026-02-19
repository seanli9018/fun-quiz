import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card';
import {
  Field,
  FieldGroup,
  FieldSet,
  FieldLegend,
  FieldContent,
  FieldLabel,
} from '@/components/ui/Field';
import { Label } from '@/components/ui/Label';
import { Separator } from '@/components/ui/Separator';
import { Trash2, Plus } from 'lucide-react';

export const Route = createFileRoute('/create-quiz')({
  component: CreateQuiz,
});

interface Answer {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  text: string;
  answers: Answer[];
}

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
        q.id === questionId ? { ...q, text } : q
      ),
    }));
  };

  const handleAnswerChange = (
    questionId: string,
    answerId: string,
    text: string
  ) => {
    setQuiz((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              answers: q.answers.map((a) =>
                a.id === answerId ? { ...a, text } : a
              ),
            }
          : q
      ),
    }));
  };

  const handleAnswerCorrectChange = (
    questionId: string,
    answerId: string
  ) => {
    setQuiz((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              answers: q.answers.map((a) =>
                a.id === answerId
                  ? { ...a, isCorrect: !a.isCorrect }
                  : { ...a, isCorrect: false }
              ),
            }
          : q
      ),
    }));
  };

  const addQuestion = () => {
    const newQuestionId = String(Math.max(...quiz.questions.map((q) => parseInt(q.id, 10)), 0) + 1);
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
            Math.max(...q.answers.map((a) => parseInt(a.id, 10)), 0) + 1
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
          {/* Quiz Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Quiz Information</CardTitle>
              <CardDescription>
                Provide basic details about your quiz
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="quiz-title">Quiz Title *</FieldLabel>
                  <FieldContent>
                    <Input
                      id="quiz-title"
                      placeholder="e.g., General Knowledge Trivia"
                      value={quiz.title}
                      onChange={(e) =>
                        handleQuizChange('title', e.target.value)
                      }
                      required
                    />
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel htmlFor="quiz-description">
                    Description
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      id="quiz-description"
                      placeholder="Describe what this quiz is about"
                      value={quiz.description}
                      onChange={(e) =>
                        handleQuizChange('description', e.target.value)
                      }
                    />
                  </FieldContent>
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>

          {/* Questions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Questions</CardTitle>
              <CardDescription>
                Add questions with multiple answers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {quiz.questions.map((question, questionIndex) => (
                <div key={question.id} className="space-y-4 pb-6 border-b last:border-b-0 last:pb-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <FieldGroup>
                        <Field>
                          <FieldLabel htmlFor={`question-${question.id}`}>
                            Question {questionIndex + 1} *
                          </FieldLabel>
                          <FieldContent>
                            <Input
                              id={`question-${question.id}`}
                              placeholder="Enter your question"
                              value={question.text}
                              onChange={(e) =>
                                handleQuestionChange(question.id, e.target.value)
                              }
                              required
                            />
                          </FieldContent>
                        </Field>
                      </FieldGroup>
                    </div>
                    {quiz.questions.length > 1 && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => removeQuestion(question.id)}
                        className="ml-2"
                      >
                        <Trash2 size={16} />
                      </Button>
                    )}
                  </div>

                  {/* Answers */}
                  <div className="space-y-3 ml-4 border-l-2 border-muted pl-4">
                    {question.answers.map((answer, answerIndex) => (
                      <div
                        key={answer.id}
                        className="flex items-end gap-3"
                      >
                        <div className="flex-1">
                          <Label className="text-xs mb-1 block">
                            Answer {answerIndex + 1}
                          </Label>
                          <Input
                            placeholder="Enter answer option"
                            value={answer.text}
                            onChange={(e) =>
                              handleAnswerChange(
                                question.id,
                                answer.id,
                                e.target.value
                              )
                            }
                            required
                            size="sm"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`correct-${question.id}-${answer.id}`}
                            checked={answer.isCorrect}
                            onChange={() =>
                              handleAnswerCorrectChange(question.id, answer.id)
                            }
                            className="w-4 h-4 cursor-pointer"
                          />
                          <Label
                            htmlFor={`correct-${question.id}-${answer.id}`}
                            className="text-xs cursor-pointer whitespace-nowrap"
                          >
                            Correct
                          </Label>
                        </div>

                        {question.answers.length > 2 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              removeAnswer(question.id, answer.id)
                            }
                          >
                            <Trash2 size={16} />
                          </Button>
                        )}
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addAnswer(question.id)}
                      className="mt-2"
                    >
                      <Plus size={16} className="mr-1" />
                      Add Answer
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={addQuestion}
              >
                <Plus size={16} className="mr-2" />
                Add Question
              </Button>
            </CardFooter>
          </Card>

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
