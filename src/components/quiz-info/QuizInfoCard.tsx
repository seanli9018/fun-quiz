import { Input } from '@/components/ui/Input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/Card';
import {
  Field,
  FieldGroup,
  FieldContent,
  FieldLabel,
} from '@/components/ui/Field';

interface QuizInfoCardProps {
  title: string;
  description: string;
  onChange: (field: 'title' | 'description', value: string) => void;
}

function QuizInfoCard({ title, description, onChange }: QuizInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quiz Information</CardTitle>
        <CardDescription>Provide basic details about your quiz</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="quiz-title">Quiz Title *</FieldLabel>
            <FieldContent>
              <Input
                id="quiz-title"
                placeholder="e.g., General Knowledge Trivia"
                value={title}
                onChange={(e) => onChange('title', e.target.value)}
                required
              />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="quiz-description">Description</FieldLabel>
            <FieldContent>
              <Input
                id="quiz-description"
                placeholder="Describe what this quiz is about"
                value={description}
                onChange={(e) => onChange('description', e.target.value)}
              />
            </FieldContent>
          </Field>
        </FieldGroup>
      </CardContent>
    </Card>
  );
}

export { QuizInfoCard };
