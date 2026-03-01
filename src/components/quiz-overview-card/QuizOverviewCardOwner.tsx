import { Link } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Clock, Award, Users, TrendingUp, Eye, Pencil } from 'lucide-react';
import type { QuizWithRelations } from '@/db/types';
import { formatCompletionCount } from '@/lib/utils';

interface QuizOverviewCardOwnerProps {
  quiz: QuizWithRelations;
}

export function QuizOverviewCardOwner({ quiz }: QuizOverviewCardOwnerProps) {
  const questionCount = quiz.questions.length;
  const totalPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0);
  const completionCount = quiz.stats?.completionCount || 0;
  const averageScore = quiz.stats?.averageScore || 0;

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 flex flex-col h-full border">
      <CardHeader>
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <CardTitle className="text-base line-clamp-2">{quiz.title}</CardTitle>
        </div>
        {/* Tags */}
        {quiz.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {quiz.tags.map((tag) => (
              <Badge
                key={tag.id}
                variant="secondary"
                className="text-[10px] px-1.5 py-0"
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        )}
        {/* Description */}
        {quiz.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {quiz.description}
          </p>
        )}
      </CardHeader>
      <CardContent className="grow">
        {/* Quiz Stats */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3.5" />
            <span>{questionCount} questions</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Award className="size-3.5" />
            <span>{totalPoints} points</span>
          </div>
        </div>
        {/* Popularity Stats */}
        {completionCount > 0 && (
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="size-3.5" />
              <span>{formatCompletionCount(completionCount)} taken</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <TrendingUp className="size-3.5" />
              <span>{averageScore}% avg</span>
            </div>
          </div>
        )}
      </CardContent>
      {/* Action Buttons */}
      <CardContent className="pt-0 mt-auto">
        <div className="flex gap-2">
          <Link
            to="/quiz/$quizId"
            params={{ quizId: quiz.id }}
            className="flex-1"
          >
            <Button className="w-full" size="sm" variant="outline">
              <Eye className="size-3.5" />
              View
            </Button>
          </Link>
          <Link
            to="/quiz/$quizId/edit"
            params={{ quizId: quiz.id }}
            className="flex-1"
          >
            <Button className="w-full" size="sm">
              <Pencil className="size-3.5" />
              Edit
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
