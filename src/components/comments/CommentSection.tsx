import { useState, useEffect } from 'react';
import { useSession } from '@/lib/auth/client';
import { Button } from '@/components/ui/Button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/Avatar';
import type { CommentWithUser } from '@/db/types';
import { MessageSquare, Reply, ChevronDown, Heart } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';

interface CommentSectionProps {
  quizId: string;
}

interface CommentItemProps {
  comment: CommentWithUser;
  onReply: (commentId: string, replyToName?: string) => void;
  replyingTo: string | null;
  onCancelReply: () => void;
  onSubmitReply: (
    content: string,
    parentId: string,
    rootParentId?: string,
  ) => Promise<void>;
  isSubmitting: boolean;
  isReply?: boolean;
  replyToName?: string;
  visibleRepliesCount?: number;
  onShowMoreReplies?: () => void;
  totalReplies?: number;
  onToggleLike: (commentId: string) => Promise<void>;
  quizId: string;
}

function CommentItem({
  comment,
  onReply,
  replyingTo,
  onCancelReply,
  onSubmitReply,
  isSubmitting,
  isReply = false,
  replyToName,
  visibleRepliesCount = 2,
  onShowMoreReplies,
  totalReplies = 0,
  onToggleLike,
  quizId,
}: CommentItemProps) {
  const [replyContent, setReplyContent] = useState('');
  const { data: session } = useSession();
  const [isLiked, setIsLiked] = useState(comment.isLikedByUser);
  const [likeCount, setLikeCount] = useState(comment.likeCount);
  const [isLiking, setIsLiking] = useState(false);

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    // If this is a reply to a reply, pass the root comment ID
    const rootParentId = isReply ? comment.parentId || undefined : undefined;
    await onSubmitReply(replyContent, comment.id, rootParentId);
    setReplyContent('');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const commentDate = new Date(date);
    const diffInSeconds = Math.floor(
      (now.getTime() - commentDate.getTime()) / 1000,
    );

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)} days ago`;

    return commentDate.toLocaleDateString();
  };

  const handleToggleLike = async () => {
    if (!session?.user || isLiking) return;

    setIsLiking(true);
    const previousIsLiked = isLiked;
    const previousLikeCount = likeCount;

    // Optimistic update
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);

    try {
      await onToggleLike(comment.id);
    } catch (error) {
      // Revert on error
      setIsLiked(previousIsLiked);
      setLikeCount(previousLikeCount);
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <Avatar size="default">
          {comment.user.image && (
            <AvatarImage src={comment.user.image} alt={comment.user.name} />
          )}
          <AvatarFallback>{getInitials(comment.user.name)}</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div
            className="rounded-lg p-3"
            style={{
              backgroundColor: 'var(--color-muted)',
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className="font-semibold text-sm"
                style={{ color: 'var(--color-foreground)' }}
              >
                {comment.user.name}
              </span>
              {isReply && replyToName && (
                <>
                  <span
                    className="text-xs"
                    style={{ color: 'var(--color-muted-foreground)' }}
                  >
                    replies to
                  </span>
                  <span
                    className="font-semibold text-xs"
                    style={{ color: 'var(--color-foreground)' }}
                  >
                    {replyToName}
                  </span>
                </>
              )}
              <span
                className="text-xs"
                style={{ color: 'var(--color-muted-foreground)' }}
              >
                {formatDate(comment.createdAt)}
              </span>
            </div>
            <p
              className="text-sm whitespace-pre-wrap wrap-break-word"
              style={{ color: 'var(--color-foreground)' }}
            >
              {comment.content}
            </p>
          </div>

          <div className="mt-1 flex items-center gap-3">
            {/* Like Button */}
            <button
              onClick={handleToggleLike}
              disabled={!session?.user || isLiking}
              className="px-2 py-1 text-xs font-medium rounded hover:bg-opacity-80 transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                color: isLiked
                  ? 'var(--color-destructive, #dc2626)'
                  : 'var(--color-muted-foreground)',
              }}
              title={
                !session?.user ? 'Login to like' : isLiked ? 'Unlike' : 'Like'
              }
            >
              <Heart className={`size-3.5 ${isLiked ? 'fill-current' : ''}`} />
              {likeCount > 0 && <span>{likeCount}</span>}
            </button>

            {/* Reply Button */}
            {session?.user && (
              <button
                onClick={() => onReply(comment.id)}
                className="px-2 py-1 text-xs font-medium rounded hover:bg-opacity-80 transition-colors flex items-center gap-1"
                style={{
                  color: 'var(--color-muted-foreground)',
                }}
              >
                <Reply className="size-3" />
                Reply
              </button>
            )}
          </div>

          {/* Reply Form */}
          {replyingTo === comment.id && (
            <form onSubmit={handleSubmitReply} className="mt-3 space-y-2">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                className="w-full rounded-md px-3 py-2 text-sm resize-none"
                style={{
                  backgroundColor: 'var(--color-background)',
                  borderColor: 'var(--color-border)',
                  borderWidth: '1px',
                  color: 'var(--color-foreground)',
                }}
                rows={3}
                maxLength={2000}
                disabled={isSubmitting}
              />
              <div className="flex gap-2">
                <Button
                  type="submit"
                  size="sm"
                  disabled={!replyContent.trim() || isSubmitting}
                >
                  {isSubmitting ? 'Posting...' : 'Post Reply'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onCancelReply}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {/* Nested Replies - Only for top-level comments */}
          {!isReply && comment.replies && comment.replies.length > 0 && (
            <div
              className="mt-4 space-y-3 pl-4 border-l-2"
              style={{ borderColor: 'var(--color-border)' }}
            >
              {comment.replies.slice(0, visibleRepliesCount).map((reply) => {
                // Find the parent comment name for nested replies
                const parentComment = comment.replies?.find(
                  (r) => r.id === reply.parentId,
                );
                const replyToUser = parentComment
                  ? parentComment.user.name
                  : comment.user.name;

                return (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    onReply={onReply}
                    replyingTo={replyingTo}
                    onCancelReply={onCancelReply}
                    onSubmitReply={onSubmitReply}
                    isSubmitting={isSubmitting}
                    isReply={true}
                    replyToName={replyToUser}
                    onToggleLike={onToggleLike}
                    quizId={quizId}
                  />
                );
              })}

              {/* Show More Button */}
              {totalReplies > visibleRepliesCount && (
                <button
                  onClick={onShowMoreReplies}
                  className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-md hover:bg-opacity-80 transition-colors"
                  style={{
                    color: 'var(--color-primary)',
                    backgroundColor: 'var(--color-muted)',
                  }}
                >
                  <ChevronDown className="size-4" />
                  Show {Math.min(
                    10,
                    totalReplies - visibleRepliesCount,
                  )} more{' '}
                  {totalReplies - visibleRepliesCount === 1
                    ? 'reply'
                    : 'replies'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function CommentSection({ quizId }: CommentSectionProps) {
  const { data: session } = useSession();
  const navigate = useNavigate();
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [visibleReplies, setVisibleReplies] = useState<Record<string, number>>(
    {},
  );

  useEffect(() => {
    fetchComments();
  }, [quizId]);

  const fetchComments = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/quiz/${quizId}/comments`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch comments');
      }

      if (result.success) {
        setComments(result.data);
        // Initialize visible replies count for each comment (show 2 by default)
        const initialVisibleReplies: Record<string, number> = {};
        result.data.forEach((comment: CommentWithUser) => {
          if (comment.replies && comment.replies.length > 0) {
            initialVisibleReplies[comment.id] = 2;
          }
        });
        setVisibleReplies(initialVisibleReplies);
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError(err instanceof Error ? err.message : 'Failed to load comments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !session?.user) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/quiz/${quizId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to post comment');
      }

      if (result.success) {
        // Add the new comment to the top of the list
        setComments([result.data, ...comments]);
        setNewComment('');
      }
    } catch (err) {
      console.error('Error posting comment:', err);
      setError(err instanceof Error ? err.message : 'Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReply = async (
    content: string,
    parentId: string,
    rootParentId?: string,
  ) => {
    if (!content.trim() || !session?.user) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // If rootParentId is provided, this is a reply to a reply, so use the root comment ID
      const actualParentId = rootParentId || parentId;

      const response = await fetch(`/api/quiz/${quizId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content.trim(),
          parentId: actualParentId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to post reply');
      }

      if (result.success) {
        // Refresh comments to get the updated tree structure
        await fetchComments();
        setReplyingTo(null);
      }
    } catch (err) {
      console.error('Error posting reply:', err);
      setError(err instanceof Error ? err.message : 'Failed to post reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = (commentId: string) => {
    if (!session?.user) {
      navigate({ to: '/login' });
      return;
    }
    setReplyingTo(commentId);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handleShowMoreReplies = (commentId: string) => {
    setVisibleReplies((prev) => ({
      ...prev,
      [commentId]: (prev[commentId] || 2) + 10,
    }));
  };

  const handleToggleLike = async (commentId: string) => {
    try {
      const response = await fetch(
        `/api/quiz/${quizId}/comments/${commentId}/like`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to toggle like');
      }

      // Refresh comments to get updated counts
      await fetchComments();
    } catch (err) {
      console.error('Error toggling like:', err);
      setError(err instanceof Error ? err.message : 'Failed to toggle like');
    }
  };

  return (
    <div
      className="rounded-lg p-6"
      style={{
        backgroundColor: 'var(--color-card)',
        borderColor: 'var(--color-border)',
        borderWidth: '1px',
      }}
    >
      <h2
        className="text-2xl font-bold mb-6 flex items-center gap-2"
        style={{ color: 'var(--color-foreground)' }}
      >
        <MessageSquare className="size-6" />
        Comments {comments.length > 0 && `(${comments.length})`}
      </h2>

      {/* New Comment Form */}
      {session?.user ? (
        <form onSubmit={handleSubmitComment} className="mb-6 space-y-3">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts about this quiz..."
            className="w-full rounded-md px-3 py-2 text-sm resize-none"
            style={{
              backgroundColor: 'var(--color-background)',
              borderColor: 'var(--color-border)',
              borderWidth: '1px',
              color: 'var(--color-foreground)',
            }}
            rows={4}
            maxLength={2000}
            disabled={isSubmitting}
          />
          <div className="flex items-center justify-between">
            <span
              className="text-xs"
              style={{ color: 'var(--color-muted-foreground)' }}
            >
              {newComment.length}/2000 characters
            </span>
            <Button type="submit" disabled={!newComment.trim() || isSubmitting}>
              {isSubmitting ? 'Posting...' : 'Post Comment'}
            </Button>
          </div>
        </form>
      ) : (
        <div
          className="mb-6 p-4 rounded-md text-center"
          style={{
            backgroundColor: 'var(--color-muted)',
          }}
        >
          <p
            className="text-sm mb-3"
            style={{ color: 'var(--color-muted-foreground)' }}
          >
            You must be logged in to comment
          </p>
          <Button
            onClick={() => navigate({ to: '/login' })}
            variant="default"
            size="sm"
          >
            Log In
          </Button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div
          className="mb-4 p-3 rounded-md text-sm"
          style={{
            backgroundColor: 'var(--color-destructive-light, #fee2e2)',
            color: 'var(--color-destructive, #dc2626)',
          }}
        >
          {error}
        </div>
      )}

      {/* Comments List */}
      {isLoading ? (
        <div
          className="text-center py-8"
          style={{ color: 'var(--color-muted-foreground)' }}
        >
          Loading comments...
        </div>
      ) : comments.length === 0 ? (
        <div
          className="text-center py-8"
          style={{ color: 'var(--color-muted-foreground)' }}
        >
          <MessageSquare className="size-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">
            No comments yet. Be the first to share your thoughts!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={handleReply}
              replyingTo={replyingTo}
              onCancelReply={handleCancelReply}
              onSubmitReply={handleSubmitReply}
              isSubmitting={isSubmitting}
              visibleRepliesCount={visibleReplies[comment.id] || 2}
              onShowMoreReplies={() => handleShowMoreReplies(comment.id)}
              totalReplies={comment.replies?.length || 0}
              onToggleLike={handleToggleLike}
              quizId={quizId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
