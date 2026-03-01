import { createFileRoute, Link, useRouter } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { useSession } from '@/lib/auth/client';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { QuizWithRelations, Tag } from '@/db/types';
import { Calendar, Mail, ArrowLeft } from 'lucide-react';
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
import {
  QuizOverviewCard,
  QuizOverviewCardOwner,
} from '@/components/quiz-overview-card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';

export const Route = createFileRoute('/user/$userId')({
  component: UserProfile,
});

interface UserProfileData {
  id: string;
  name: string;
  email: string;
  image: string | null;
  bio: string | null;
  createdAt: Date;
}

interface ProfileResponse {
  success: boolean;
  user: UserProfileData;
  isOwnProfile: boolean;
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

function UserProfile() {
  const { userId } = Route.useParams();
  const router = useRouter();
  const { isPending: sessionPending, data: session } = useSession();
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
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
  const [createdCount, setCreatedCount] = useState(0);
  const [bookmarkedCount, setBookmarkedCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'created' | 'bookmarked'>(
    'created',
  );

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

  // Fetch user profile data once
  useEffect(() => {
    if (sessionPending) return;

    async function fetchUserProfile() {
      try {
        const response = await fetch(
          `/api/user/${userId}/profile?page=1&limit=1`,
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch profile');
        }

        const result: ProfileResponse = await response.json();
        if (result.success) {
          setProfileData(result.user);
          setIsOwnProfile(result.isOwnProfile);
          setCreatedCount(result.pagination.total);
        }

        // If it's own profile, also fetch bookmarked count
        if (result.success && result.isOwnProfile && session?.user) {
          const bookmarksResponse = await fetch(
            `/api/user/${userId}/bookmarks?page=1&limit=1`,
          );
          if (bookmarksResponse.ok) {
            const bookmarksResult = await bookmarksResponse.json();
            if (bookmarksResult.success) {
              setBookmarkedCount(bookmarksResult.pagination.total);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to fetch profile',
        );
      }
    }

    fetchUserProfile();
  }, [userId, sessionPending]);

  // Fetch quizzes when filters change
  useEffect(() => {
    if (sessionPending || !profileData) return;

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

        let response;
        if (activeTab === 'bookmarked' && session?.user.id === userId) {
          // Fetch bookmarked quizzes
          response = await fetch(`/api/user/${userId}/bookmarks?${params}`);
        } else {
          // Fetch created quizzes
          response = await fetch(`/api/user/${userId}/profile?${params}`);
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch quizzes');
        }

        const result: ProfileResponse = await response.json();
        if (result.success) {
          setQuizzes(result.data);
          setTotalPages(result.pagination.totalPages);
          setTotal(result.pagination.total);

          // Update the appropriate count
          if (activeTab === 'created') {
            setCreatedCount(result.pagination.total);
          } else {
            setBookmarkedCount(result.pagination.total);
          }
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
  }, [
    userId,
    sessionPending,
    selectedTags,
    debouncedSearchQuery,
    currentPage,
    activeTab,
    session,
    profileData,
  ]);

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

  const handleTabChange = (tab: 'created' | 'bookmarked') => {
    setActiveTab(tab);
    setCurrentPage(1);
    clearFilters();
  };

  const handleBookmarkChange = (quizId: string, isBookmarked: boolean) => {
    // Update bookmark count
    if (isBookmarked) {
      setBookmarkedCount((prev) => prev + 1);
    } else {
      setBookmarkedCount((prev) => Math.max(0, prev - 1));
    }

    // If we're on the bookmarks tab and a quiz was unbookmarked, remove it from the list
    if (activeTab === 'bookmarked' && !isBookmarked) {
      setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
      setTotal((prev) => prev - 1);
    }
  };

  if (sessionPending) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--color-background)' }}
      >
        <div style={{ color: 'var(--color-foreground)' }}>Loading...</div>
      </div>
    );
  }

  if (isLoading && !profileData) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--color-background)' }}
      >
        <div style={{ color: 'var(--color-foreground)' }}>
          Loading profile...
        </div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div
        className="min-h-screen px-4 py-12"
        style={{ backgroundColor: 'var(--color-background)' }}
      >
        <div className="max-w-4xl mx-auto">
          <ErrorCard
            type={error?.includes('not found') ? 'not-found' : 'server'}
            title={error?.includes('not found') ? 'User Not Found' : undefined}
            message={error || 'This user could not be found or may not exist.'}
            actions={
              <Link to="/">
                <Button>Go Home</Button>
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
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.history.back()}
          >
            <ArrowLeft className="size-4 mr-2" />
            Go Back
          </Button>
        </div>

        {/* Profile Header */}
        <div
          className="mb-8 p-6 rounded-lg"
          style={{
            backgroundColor: 'var(--color-card)',
            borderColor: 'var(--color-border)',
            borderWidth: '1px',
          }}
        >
          <div className="flex items-start gap-6">
            {/* Profile Image */}
            <div className="shrink-0">
              {profileData.image ? (
                <img
                  src={profileData.image}
                  alt={profileData.name}
                  className="size-24 rounded-full object-cover"
                />
              ) : (
                <div
                  className="size-24 rounded-full flex items-center justify-center text-3xl font-bold"
                  style={{
                    backgroundColor: 'var(--color-primary)',
                    color: 'var(--color-primary-foreground)',
                  }}
                >
                  {profileData.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <h1
                className="text-4xl font-bold mb-2"
                style={{ color: 'var(--color-foreground)' }}
              >
                {profileData.name}
              </h1>
              <div
                className="flex items-center gap-4 mb-4 text-sm"
                style={{ color: 'var(--color-muted-foreground)' }}
              >
                <span className="flex items-center gap-1">
                  <Mail className="size-4" />
                  {profileData.email}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="size-4" />
                  Joined {new Date(profileData.createdAt).toLocaleDateString()}
                </span>
              </div>
              {profileData.bio && (
                <p
                  className="text-base whitespace-pre-wrap"
                  style={{ color: 'var(--color-foreground)' }}
                >
                  {profileData.bio}
                </p>
              )}
            </div>

            {/* Edit Profile Button (only for own profile) */}
            {isOwnProfile && (
              <Link to="/settings">
                <Button variant="outline">Edit Profile</Button>
              </Link>
            )}
          </div>
        </div>

        {/* Tabs Section (only for own profile) */}
        {isOwnProfile && (
          <div className="mb-6">
            <Tabs
              value={activeTab}
              onValueChange={(value) =>
                handleTabChange(value as 'created' | 'bookmarked')
              }
            >
              <TabsList>
                <TabsTrigger value="created">
                  Created Quizzes ({createdCount})
                </TabsTrigger>
                <TabsTrigger value="bookmarked">
                  Bookmarked ({bookmarkedCount})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}

        {/* Quizzes Section */}
        <div className="mb-8">
          <h2
            className="text-3xl font-bold mb-2"
            style={{ color: 'var(--color-foreground)' }}
          >
            {isOwnProfile
              ? activeTab === 'created'
                ? 'My Quizzes'
                : 'Bookmarked Quizzes'
              : `${profileData.name}'s Quizzes`}
          </h2>
          <p
            className="text-lg"
            style={{ color: 'var(--color-muted-foreground)' }}
          >
            {isOwnProfile
              ? activeTab === 'created'
                ? 'Manage and view all your created quizzes'
                : 'Your saved quizzes for later'
              : `Browse all public quizzes created by ${profileData.name}`}
          </p>
        </div>

        {/* Actions Bar */}
        {isOwnProfile && activeTab === 'created' && (
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
        )}

        {/* Search Bar for bookmarked tab */}
        {isOwnProfile && activeTab === 'bookmarked' && (
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search bookmarked quizzes..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 rounded-md border"
              style={{
                backgroundColor: 'var(--color-card)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-foreground)',
              }}
            />
          </div>
        )}

        {/* Search Bar (for viewing others' profiles) */}
        {!isOwnProfile && (
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search quizzes..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 rounded-md border"
              style={{
                backgroundColor: 'var(--color-card)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-foreground)',
              }}
            />
          </div>
        )}

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
              <h3
                className="text-lg font-semibold"
                style={{ color: 'var(--color-foreground)' }}
              >
                Filter by Tags
              </h3>
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
                : isOwnProfile
                  ? activeTab === 'bookmarked'
                    ? 'No bookmarked quizzes'
                    : 'No quizzes yet'
                  : 'No public quizzes'}
            </h3>
            <p
              className="text-lg mb-6"
              style={{ color: 'var(--color-muted-foreground)' }}
            >
              {selectedTags.length > 0 || searchQuery
                ? 'Try adjusting your filters'
                : isOwnProfile
                  ? activeTab === 'bookmarked'
                    ? 'Bookmark quizzes to save them for later'
                    : 'Create your first quiz to get started'
                  : `${profileData.name} hasn't created any public quizzes yet`}
            </p>
            {isOwnProfile &&
              !selectedTags.length &&
              !searchQuery &&
              activeTab === 'created' && (
                <Link to="/create-quiz">
                  <Button>Create Your First Quiz</Button>
                </Link>
              )}
            {isOwnProfile &&
              !selectedTags.length &&
              !searchQuery &&
              activeTab === 'bookmarked' && (
                <Link to="/take-quiz">
                  <Button>Browse Quizzes</Button>
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
              {quizzes.map((quiz) =>
                isOwnProfile && activeTab === 'created' ? (
                  <QuizOverviewCardOwner key={quiz.id} quiz={quiz} />
                ) : (
                  <QuizOverviewCard
                    key={quiz.id}
                    quiz={quiz}
                    onBookmarkChange={handleBookmarkChange}
                  />
                ),
              )}
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

export default UserProfile;
