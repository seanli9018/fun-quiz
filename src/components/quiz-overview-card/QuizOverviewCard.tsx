import { Link } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Toggle } from '@/components/ui/Toggle';
import { Clock, Award, Users, TrendingUp, User, Bookmark } from 'lucide-react';
import type { QuizWithRelations } from '@/db/types';
import { formatCompletionCount } from '@/lib/utils';
import { useSession } from '@/lib/auth/client';
import { useState } from 'react';

interface QuizOverviewCardProps {
  quiz: QuizWithRelations;
  onBookmarkChange?: (quizId: string, isBookmarked: boolean) => void;
}

export function QuizOverviewCard({
  quiz,
  onBookmarkChange,
}: QuizOverviewCardProps) {
  const { data: session } = useSession();
  const questionCount = quiz.questions.length;
  const totalPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0);
  const completionCount = quiz.stats?.completionCount || 0;
  const averageScore = quiz.stats?.averageScore || 0;

  const [isBookmarked, setIsBookmarked] = useState(quiz.isBookmarked || false);
  const [isBookmarking, setIsBookmarking] = useState(false);

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 flex flex-col h-full border">
      <CardHeader>
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <Link to="/quiz/$quizId" params={{ quizId: quiz.id }}>
            <CardTitle className="text-base line-clamp-2 hover:underline cursor-pointer">
              {quiz.title}
            </CardTitle>
          </Link>
          {session?.user && session.user.id !== quiz.userId && (
            <Toggle
              pressed={isBookmarked}
              onPressedChange={async () => {
                if (isBookmarking) return;

                setIsBookmarking(true);
                try {
                  const method = isBookmarked ? 'DELETE' : 'POST';
                  const response = await fetch(
                    `/api/quiz/${quiz.id}/bookmark`,
                    {
                      method,
                    },
                  );

                  if (response.ok) {
                    const newBookmarkStatus = !isBookmarked;
                    setIsBookmarked(newBookmarkStatus);
                    onBookmarkChange?.(quiz.id, newBookmarkStatus);
                  }
                } catch (error) {
                  console.error('Error toggling bookmark:', error);
                } finally {
                  setIsBookmarking(false);
                }
              }}
              disabled={isBookmarking}
              size="sm"
              className="shrink-0"
              title={isBookmarked ? 'Remove bookmark' : 'Bookmark quiz'}
            >
              <Bookmark
                className={`size-4 ${isBookmarked ? 'fill-current' : ''}`}
              />
            </Toggle>
          )}
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
      {/* Creator Info & Action Button */}
      <CardContent className="pt-0 mt-auto">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground pb-3 border-t border-border pt-3">
          <User className="size-3" />
          <span>
            Created by{' '}
            {quiz.user.name === 'Admin' ? (
              'FunQuiz'
            ) : (
              <Link
                to="/user/$userId"
                params={{ userId: quiz.userId }}
                className="hover:underline font-medium"
              >
                {quiz.user.name}
              </Link>
            )}
          </span>
        </div>
        <Link to="/quiz/$quizId/take" params={{ quizId: quiz.id }}>
          <Button className="w-full" size="sm">
            Start Quiz
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
