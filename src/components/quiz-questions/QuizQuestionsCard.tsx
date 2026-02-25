import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/Card';
import {
  Field,
  FieldGroup,
  FieldContent,
  FieldLabel,
} from '@/components/ui/Field';
import { Label } from '@/components/ui/Label';
import { Trash2, Plus } from 'lucide-react';

interface Answer {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  text: string;
  answers: Answer[];
  points: number;
}

interface QuizQuestionsCardProps {
  questions: Question[];
  onQuestionChange: (questionId: string, text: string) => void;
  onPointsChange: (questionId: string, points: number) => void;
  onAnswerChange: (questionId: string, answerId: string, text: string) => void;
  onAnswerCorrectChange: (questionId: string, answerId: string) => void;
  onAddQuestion: () => void;
  onRemoveQuestion: (questionId: string) => void;
  onAddAnswer: (questionId: string) => void;
  onRemoveAnswer: (questionId: string, answerId: string) => void;
}

function QuizQuestionsCard({
  questions,
  onQuestionChange,
  onPointsChange,
  onAnswerChange,
  onAnswerCorrectChange,
  onAddQuestion,
  onRemoveQuestion,
  onAddAnswer,
  onRemoveAnswer,
}: QuizQuestionsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Questions</CardTitle>
        <CardDescription>Add questions with multiple answers</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {questions.map((question, questionIndex) => (
          <div
            key={question.id}
            className="space-y-4 pb-6 border-b last:border-b-0 last:pb-0"
          >
            <div className="flex items-start justify-between gap-3">
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
                          onQuestionChange(question.id, e.target.value)
                        }
                        required
                      />
                    </FieldContent>
                  </Field>
                </FieldGroup>
              </div>
              <div className="w-24">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor={`points-${question.id}`}>
                      Points
                    </FieldLabel>
                    <FieldContent>
                      <Input
                        id={`points-${question.id}`}
                        type="number"
                        min="1"
                        value={question.points}
                        onChange={(e) =>
                          onPointsChange(
                            question.id,
                            parseInt(e.target.value) || 1,
                          )
                        }
                        required
                      />
                    </FieldContent>
                  </Field>
                </FieldGroup>
              </div>
              {questions.length > 1 && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => onRemoveQuestion(question.id)}
                  className="mt-6"
                >
                  <Trash2 size={16} />
                </Button>
              )}
            </div>
            {/* Answers */}
            <div className="space-y-3 ml-4 border-l-2 border-muted pl-4">
              {question.answers.map((answer, answerIndex) => (
                <div key={answer.id} className="flex items-end gap-3">
                  <div className="flex-1">
                    <Label className="text-xs mb-1 block">
                      Answer {answerIndex + 1}
                    </Label>
                    <Input
                      placeholder="Enter answer option"
                      value={answer.text}
                      onChange={(e) =>
                        onAnswerChange(question.id, answer.id, e.target.value)
                      }
                      required
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer mb-2">
                    <Checkbox
                      checked={answer.isCorrect}
                      onCheckedChange={() =>
                        onAnswerCorrectChange(question.id, answer.id)
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-xs whitespace-nowrap">Correct</span>
                  </label>

                  {question.answers.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemoveAnswer(question.id, answer.id)}
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
                onClick={() => onAddAnswer(question.id)}
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
        <Button type="button" variant="outline" onClick={onAddQuestion}>
          <Plus size={16} className="mr-2" />
          Add Question
        </Button>
      </CardFooter>
    </Card>
  );
}

export { QuizQuestionsCard };
export type { Question, Answer };
