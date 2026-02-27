import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Award,
  TrendingDown,
  Flame,
  Calendar,
  ArrowUp,
} from 'lucide-react';
import { useSession } from '@/lib/auth/client';
import type { QuizWithRelations, PaginatedResponse, Tag } from '@/db/types';
import { QuizOverviewCard } from '@/components/quiz-overview-card';
import { useDebounce } from '@/lib/hooks';

export const Route = createFileRoute('/take-quiz')({
  component: TakeQuizPage,
});

function TakeQuizPage() {
  const { data: session } = useSession();
  const [popularQuizzes, setPopularQuizzes] = useState<QuizWithRelations[]>([]);
  const [hardestQuizzes, setHardestQuizzes] = useState<QuizWithRelations[]>([]);
  const [latestQuizzes, setLatestQuizzes] = useState<QuizWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [popularPage, setPopularPage] = useState(1);
  const [hardestPage, setHardestPage] = useState(1);
  const [hasMorePopular, setHasMorePopular] = useState(true);
  const [hasMoreHardest, setHasMoreHardest] = useState(true);
  const [loadingMorePopular, setLoadingMorePopular] = useState(false);
  const [loadingMoreHardest, setLoadingMoreHardest] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const limit = 12;
  const previewLimit = 4;
  const loadMoreLimit = 8;

  // Fetch all tags
  useEffect(() => {
    async function fetchTags() {
      try {
        const response = await fetch('/api/tags/list');
        if (!response.ok) {
          throw new Error('Failed to fetch tags');
        }
        const result = await response.json();
        if (result.success) {
          setAllTags(result.tags);
        }
      } catch (err) {
        console.error('Error fetching tags:', err);
      }
    }

    fetchTags();
  }, []);

  // Handle scroll for back to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Reset pages when filters change
    setPopularPage(1);
    setHardestPage(1);
    setPopularQuizzes([]);
    setHardestQuizzes([]);
    setHasMorePopular(true);
    setHasMoreHardest(true);
    fetchAllQuizzes();
  }, [currentPage, debouncedSearch, selectedTags]);

  const fetchAllQuizzes = async () => {
    try {
      setLoading(true);
      setError(null);

      // Helper to build params without undefined values
      const buildParams = (extraParams: Record<string, string>) => {
        const params: Record<string, string> = { ...extraParams };

        if (debouncedSearch) params.search = debouncedSearch;
        if (selectedTags.length > 0) params.tagIds = selectedTags.join(',');

        return new URLSearchParams(params);
      };

      // Fetch popular quizzes (initial load)
      const popularParams = buildParams({
        sortBy: 'popular',
        limit: previewLimit.toString(),
        page: '1',
      });

      // Fetch hardest quizzes (initial load)
      const hardestParams = buildParams({
        sortBy: 'hardest',
        limit: previewLimit.toString(),
        page: '1',
      });

      // Fetch latest quizzes with pagination
      const latestParams = buildParams({
        sortBy: 'latest',
        page: currentPage.toString(),
        limit: limit.toString(),
      });

      const [popularRes, hardestRes, latestRes] = await Promise.all([
        fetch(`/api/quiz/public-quizzes?${popularParams}`),
        fetch(`/api/quiz/public-quizzes?${hardestParams}`),
        fetch(`/api/quiz/public-quizzes?${latestParams}`),
      ]);

      if (!popularRes.ok || !hardestRes.ok || !latestRes.ok) {
        throw new Error('Failed to fetch quizzes');
      }

      const popularData: PaginatedResponse<QuizWithRelations> =
        await popularRes.json();
      const hardestData: PaginatedResponse<QuizWithRelations> =
        await hardestRes.json();
      const latestData: PaginatedResponse<QuizWithRelations> =
        await latestRes.json();

      setPopularQuizzes(popularData.data);
      setHardestQuizzes(hardestData.data);
      setLatestQuizzes(latestData.data);
      setTotalPages(latestData.pagination.totalPages);
      setTotal(latestData.pagination.total);

      // Check if there are more quizzes to load
      setHasMorePopular(
        popularData.data.length === previewLimit &&
          popularData.pagination.totalPages > 1,
      );
      setHasMoreHardest(
        hardestData.data.length === previewLimit &&
          hardestData.pagination.totalPages > 1,
      );
    } catch (err) {
      console.error('Error fetching quizzes:', err);
      setError(err instanceof Error ? err.message : 'Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  const loadMorePopular = async () => {
    try {
      setLoadingMorePopular(true);
      const nextPage = popularPage + 1;

      const buildParams = (extraParams: Record<string, string>) => {
        const params: Record<string, string> = { ...extraParams };
        if (debouncedSearch) params.search = debouncedSearch;
        if (selectedTags.length > 0) params.tagIds = selectedTags.join(',');
        return new URLSearchParams(params);
      };

      const popularParams = buildParams({
        sortBy: 'popular',
        limit: loadMoreLimit.toString(),
        page: nextPage.toString(),
      });

      const response = await fetch(`/api/quiz/public-quizzes?${popularParams}`);
      if (!response.ok) throw new Error('Failed to fetch more popular quizzes');

      const data: PaginatedResponse<QuizWithRelations> = await response.json();

      setPopularQuizzes((prev) => [...prev, ...data.data]);
      setPopularPage(nextPage);
      setHasMorePopular(nextPage < data.pagination.totalPages);
    } catch (err) {
      console.error('Error loading more popular quizzes:', err);
    } finally {
      setLoadingMorePopular(false);
    }
  };

  const loadMoreHardest = async () => {
    try {
      setLoadingMoreHardest(true);
      const nextPage = hardestPage + 1;

      const buildParams = (extraParams: Record<string, string>) => {
        const params: Record<string, string> = { ...extraParams };
        if (debouncedSearch) params.search = debouncedSearch;
        if (selectedTags.length > 0) params.tagIds = selectedTags.join(',');
        return new URLSearchParams(params);
      };

      const hardestParams = buildParams({
        sortBy: 'hardest',
        limit: loadMoreLimit.toString(),
        page: nextPage.toString(),
      });

      const response = await fetch(`/api/quiz/public-quizzes?${hardestParams}`);
      if (!response.ok) throw new Error('Failed to fetch more hardest quizzes');

      const data: PaginatedResponse<QuizWithRelations> = await response.json();

      setHardestQuizzes((prev) => [...prev, ...data.data]);
      setHardestPage(nextPage);
      setHasMoreHardest(nextPage < data.pagination.totalPages);
    } catch (err) {
      console.error('Error loading more hardest quizzes:', err);
    } finally {
      setLoadingMoreHardest(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchAllQuizzes();
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

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId],
    );
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedTags([]);
    setCurrentPage(1);
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const hasActiveFilters = search.trim() || selectedTags.length > 0;

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
        <form onSubmit={handleSearch} className="mb-6">
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

        {/* Tag Filters */}
        {allTags.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-foreground">
                Filter by Tags
              </h2>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="gap-2 text-sm h-8"
                >
                  <X className="size-3" />
                  Clear filters
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
                      className="cursor-pointer transition-all hover:scale-105"
                    >
                      {tag.name}
                    </button>
                  }
                />
              ))}
            </div>
            {selectedTags.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                {selectedTags.length} tag{selectedTags.length > 1 ? 's' : ''}{' '}
                selected
              </p>
            )}
          </div>
        )}

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

        {/* Content Sections */}
        {!loading && !error && (
          <>
            {/* Most Popular Section */}
            {popularQuizzes.length > 0 && (
              <section className="mb-12">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Flame className="size-6 text-primary" />
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">
                        Most Popular
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Quizzes with the most completions
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                  {popularQuizzes.map((quiz) => (
                    <QuizOverviewCard key={quiz.id} quiz={quiz} />
                  ))}
                </div>
                {hasMorePopular && (
                  <div className="flex justify-center mt-6">
                    <Button
                      variant="ghost"
                      onClick={loadMorePopular}
                      disabled={loadingMorePopular}
                      className="gap-2"
                    >
                      {loadingMorePopular ? (
                        <>
                          <div className="inline-block size-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></div>
                          Loading...
                        </>
                      ) : (
                        'Show More'
                      )}
                    </Button>
                  </div>
                )}
              </section>
            )}

            {/* Hardest Quizzes Section */}
            {hardestQuizzes.length > 0 && (
              <section className="mb-12">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <TrendingDown className="size-6 text-primary" />
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">
                        Hardest Quizzes
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Challenge yourself with the lowest scoring quizzes
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                  {hardestQuizzes.map((quiz) => (
                    <QuizOverviewCard key={quiz.id} quiz={quiz} />
                  ))}
                </div>
                {hasMoreHardest && (
                  <div className="flex justify-center mt-6">
                    <Button
                      variant="ghost"
                      onClick={loadMoreHardest}
                      disabled={loadingMoreHardest}
                      className="gap-2"
                    >
                      {loadingMoreHardest ? (
                        <>
                          <div className="inline-block size-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></div>
                          Loading...
                        </>
                      ) : (
                        'Show More'
                      )}
                    </Button>
                  </div>
                )}
              </section>
            )}

            {/* Latest Quizzes Section */}
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="size-6 text-primary" />
                <div>
                  <h2 className="text-2xl font-bold text-foreground">
                    Latest Quizzes
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Recently created quizzes
                  </p>
                </div>
              </div>

              {latestQuizzes.length === 0 &&
              popularQuizzes.length === 0 &&
              hardestQuizzes.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center py-12">
                    <Award className="size-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No quizzes found
                    </h3>
                    <p className="text-muted-foreground">
                      {hasActiveFilters
                        ? 'Try adjusting your search or filter criteria'
                        : 'No public quizzes available at the moment'}
                    </p>
                  </CardContent>
                </Card>
              ) : latestQuizzes.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center py-12">
                    <p className="text-muted-foreground">
                      No more quizzes to show
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 mt-6">
                    {latestQuizzes.map((quiz) => (
                      <QuizOverviewCard key={quiz.id} quiz={quiz} />
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
            </section>
          </>
        )}
      </div>

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 p-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 z-50"
          aria-label="Back to top"
        >
          <ArrowUp className="size-6" />
        </button>
      )}
    </div>
  );
}
