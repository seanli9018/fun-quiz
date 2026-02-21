import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  Search,
  Clock,
  Award,
  User,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { QuizWithRelations, PaginatedResponse } from '@/db/types';

export const Route = createFileRoute('/take-quiz')({
  component: TakeQuizPage,
});

function TakeQuizPage() {
  const [quizzes, setQuizzes] = useState<QuizWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 9;

  useEffect(() => {
    fetchQuizzes();
  }, [currentPage, search]);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
      });

      if (search) {
        params.append('search', search);
      }

      const response = await fetch(`/api/quiz/public-quizzes?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch quizzes');
      }

      const data: PaginatedResponse<QuizWithRelations> = await response.json();
      setQuizzes(data.data);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch (err) {
      console.error('Error fetching quizzes:', err);
      setError(err instanceof Error ? err.message : 'Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchQuizzes();
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Take a Quiz
          </h1>
          <p className="text-muted-foreground text-lg">
            Browse and play official quizzes created by our community
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search quizzes by title or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 h-12 text-base"
            />
          </div>
        </form>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block size-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4"></div>
              <p className="text-muted-foreground">Loading quizzes...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive text-center">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!loading && !error && quizzes.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <Award className="size-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No quizzes found</h3>
              <p className="text-muted-foreground">
                {search
                  ? 'Try adjusting your search terms'
                  : 'No public quizzes available at the moment'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Quiz Grid */}
        {!loading && !error && quizzes.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {quizzes.map((quiz) => (
                <QuizCard key={quiz.id} quiz={quiz} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="gap-2"
                >
                  <ChevronLeft className="size-4" />
                  Previous
                </Button>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({total} total)
                  </span>
                </div>

                <Button
                  variant="outline"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="gap-2"
                >
                  Next
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function QuizCard({ quiz }: { quiz: QuizWithRelations }) {
  const questionCount = quiz.questions.length;
  const totalPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0);

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <div className="flex items-start justify-between gap-2 mb-2">
          <CardTitle className="text-xl line-clamp-2">{quiz.title}</CardTitle>
        </div>

        {/* Tags */}
        {quiz.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {quiz.tags.map((tag) => (
              <Badge key={tag.id} variant="secondary" className="text-xs">
                {tag.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Description */}
        {quiz.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {quiz.description}
          </p>
        )}
      </CardHeader>

      <CardContent>
        {/* Quiz Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="size-4" />
            <span>{questionCount} questions</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Award className="size-4" />
            <span>{totalPoints} points</span>
          </div>
        </div>

        {/* Creator Info */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4 pb-4 border-b border-border">
          <User className="size-3" />
          <span>Created by {quiz.user.name}</span>
        </div>

        {/* Action Button */}
        <Link to="/quiz/$quizId/take" params={{ quizId: quiz.id }}>
          <Button className="w-full" size="lg">
            Start Quiz
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
