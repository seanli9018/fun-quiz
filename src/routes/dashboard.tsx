import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { useSession } from '@/lib/auth/client';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { QuizWithRelations, Tag } from '@/db/types';
import { formatCompletionCount } from '@/lib/utils';
import { Users, TrendingUp } from 'lucide-react';
import { useDebounce } from '@/lib/hooks';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/Pagination';
import { ErrorCard } from '@/components/error/ErrorCard';

export const Route = createFileRoute('/dashboard')({
  component: Dashboard,
});

interface QuizResponse {
  success: boolean;
  data: QuizWithRelations[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface TagsResponse {
  success: boolean;
  tags: Tag[];
}

function Dashboard() {
  const { data: session, isPending } = useSession();
  const [quizzes, setQuizzes] = useState<QuizWithRelations[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Fetch all tags
  useEffect(() => {
    async function fetchTags() {
      try {
        const response = await fetch('/api/tags/list');
        if (!response.ok) {
          throw new Error('Failed to fetch tags');
        }
        const result: TagsResponse = await response.json();
        if (result.success) {
          setAllTags(result.tags);
        }
      } catch (err) {
        console.error('Error fetching tags:', err);
      }
    }

    fetchTags();
  }, []);

  // Fetch quizzes when filters change
  useEffect(() => {
    if (!session?.user || isPending) return;

    async function fetchQuizzes() {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        params.append('page', currentPage.toString());
        params.append('limit', '10');

        if (selectedTags.length > 0) {
          params.append('tagIds', selectedTags.join(','));
        }

        if (debouncedSearchQuery.trim()) {
          params.append('search', debouncedSearchQuery.trim());
        }

        const response = await fetch(`/api/quiz/user-quizzes?${params}`);
        if (!response.ok) {
          throw new Error('Failed to fetch quizzes');
        }

        const result: QuizResponse = await response.json();
        if (result.success) {
          setQuizzes(result.data);
          setTotalPages(result.pagination.totalPages);
          setTotal(result.pagination.total);
        }
      } catch (err) {
        console.error('Error fetching quizzes:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to fetch quizzes',
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchQuizzes();
  }, [session, isPending, selectedTags, debouncedSearchQuery, currentPage]);

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId],
    );
    setCurrentPage(1); // Reset to first page when filtering
  };

  const clearFilters = () => {
    setSelectedTags([]);
    setSearchQuery('');
    setCurrentPage(1);
  };

  if (isPending) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--color-background)' }}
      >
        <div style={{ color: 'var(--color-foreground)' }}>Loading...</div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div
        className="min-h-screen px-4 py-12"
        style={{ backgroundColor: 'var(--color-background)' }}
      >
        <div className="max-w-4xl mx-auto">
          <ErrorCard
            type="unauthorized"
            message="You need to be signed in to view your dashboard."
            actions={
              <Link to="/login">
                <Button>Sign In</Button>
              </Link>
            }
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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-4xl md:text-5xl font-bold mb-2"
            style={{ color: 'var(--color-foreground)' }}
          >
            My Quizzes
          </h1>
          <p
            className="text-lg"
            style={{ color: 'var(--color-muted-foreground)' }}
          >
            Manage and view all your created quizzes
          </p>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Link to="/create-quiz" className="shrink-0">
            <Button variant="default">Create New Quiz</Button>
          </Link>
          <input
            type="text"
            placeholder="Search quizzes..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="flex-1 px-4 py-2 rounded-md border"
            style={{
              backgroundColor: 'var(--color-card)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-foreground)',
            }}
          />
        </div>

        {/* Filters */}
        {allTags.length > 0 && (
          <div
            className="mb-6 p-4 rounded-lg"
            style={{
              backgroundColor: 'var(--color-card)',
              borderColor: 'var(--color-border)',
              borderWidth: '1px',
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <h2
                className="text-lg font-semibold"
                style={{ color: 'var(--color-foreground)' }}
              >
                Filter by Tags
              </h2>
              {(selectedTags.length > 0 || searchQuery) && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant={
                    selectedTags.includes(tag.id) ? 'default' : 'outline'
                  }
                  render={
                    <button
                      onClick={() => toggleTag(tag.id)}
                      className="cursor-pointer"
                    />
                  }
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6">
            <ErrorCard
              type="server"
              title="Failed to Load Quizzes"
              message={error}
              size="sm"
              onRetry={() => window.location.reload()}
            />
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="text-center py-12">
            <div
              className="text-lg"
              style={{ color: 'var(--color-muted-foreground)' }}
            >
              Loading quizzes...
            </div>
          </div>
        ) : quizzes.length === 0 ? (
          /* Empty State */
          <div
            className="text-center py-12 rounded-lg"
            style={{
              backgroundColor: 'var(--color-card)',
              borderColor: 'var(--color-border)',
              borderWidth: '1px',
            }}
          >
            <h3
              className="text-2xl font-semibold mb-2"
              style={{ color: 'var(--color-foreground)' }}
            >
              {selectedTags.length > 0 || searchQuery
                ? 'No quizzes found'
                : 'No quizzes yet'}
            </h3>
            <p
              className="text-lg mb-6"
              style={{ color: 'var(--color-muted-foreground)' }}
            >
              {selectedTags.length > 0 || searchQuery
                ? 'Try adjusting your filters'
                : 'Create your first quiz to get started'}
            </p>
            {!selectedTags.length && !searchQuery && (
              <Link to="/create-quiz">
                <Button>Create Your First Quiz</Button>
              </Link>
            )}
          </div>
        ) : (
          /* Quiz List */
          <>
            <div
              className="mb-4 text-sm"
              style={{ color: 'var(--color-muted-foreground)' }}
            >
              Showing {quizzes.length} of {total} quizzes
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {quizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="p-6 rounded-lg transition-shadow hover:shadow-lg"
                  style={{
                    backgroundColor: 'var(--color-card)',
                    borderColor: 'var(--color-border)',
                    borderWidth: '1px',
                  }}
                >
                  {/* Quiz Header */}
                  <div className="mb-4">
                    <h3
                      className="text-xl font-bold mb-2 line-clamp-2"
                      style={{ color: 'var(--color-foreground)' }}
                    >
                      {quiz.title}
                    </h3>
                    {quiz.description && (
                      <p
                        className="text-sm line-clamp-2"
                        style={{ color: 'var(--color-muted-foreground)' }}
                      >
                        {quiz.description}
                      </p>
                    )}
                  </div>

                  {/* Tags */}
                  {quiz.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {quiz.tags.map((tag) => (
                        <Badge key={tag.id} variant="secondary">
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Quiz Info */}
                  <div
                    className="flex items-center gap-4 mb-4 text-sm"
                    style={{ color: 'var(--color-muted-foreground)' }}
                  >
                    <span>{quiz.questions.length} questions</span>
                    <span>•</span>
                    <span>{quiz.isPublic ? 'Public' : 'Private'}</span>
                  </div>

                  {/* Popularity Stats */}
                  {quiz.stats && quiz.stats.completionCount > 0 && (
                    <div
                      className="flex items-center gap-4 mb-4 text-sm"
                      style={{ color: 'var(--color-muted-foreground)' }}
                    >
                      <span className="flex items-center gap-1">
                        <Users className="size-3.5" />
                        {formatCompletionCount(quiz.stats.completionCount)}{' '}
                        taken
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="size-3.5" />
                        {quiz.stats.averageScore}% avg
                      </span>
                    </div>
                  )}

                  {/* Date */}
                  <div
                    className="text-xs mb-4"
                    style={{ color: 'var(--color-muted-foreground)' }}
                  >
                    Created {new Date(quiz.createdAt).toLocaleDateString()}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link
                      to="/quiz/$quizId"
                      params={{ quizId: quiz.id }}
                      className="flex-1"
                    >
                      <Button variant="default" size="sm" className="w-full">
                        View
                      </Button>
                    </Link>
                    <Link
                      to="/quiz/$quizId/edit"
                      params={{ quizId: quiz.id }}
                      className="flex-1"
                    >
                      <Button variant="outline" size="sm" className="w-full">
                        Edit
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination className="mt-8">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage((p) => Math.max(1, p - 1));
                      }}
                      className={
                        currentPage === 1
                          ? 'pointer-events-none opacity-50'
                          : ''
                      }
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                      // Show first page, last page, current page, and pages around current
                      return (
                        page === 1 ||
                        page === totalPages ||
                        Math.abs(page - currentPage) <= 1
                      );
                    })
                    .map((page, index, array) => {
                      // Add ellipsis if there's a gap
                      const showEllipsisBefore =
                        index > 0 && page - array[index - 1] > 1;
                      return (
                        <PaginationItem key={page}>
                          {showEllipsisBefore && <PaginationEllipsis />}
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(page);
                            }}
                            isActive={currentPage === page}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage((p) => Math.min(totalPages, p + 1));
                      }}
                      className={
                        currentPage === totalPages
                          ? 'pointer-events-none opacity-50'
                          : ''
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
