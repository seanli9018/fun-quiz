# Quiz Statistics & Popularity Tracking Feature

## Overview

This feature adds comprehensive tracking of quiz completions to show popularity metrics and average scores across all quizzes in the application. When users complete a quiz, their attempt is recorded in the database, enabling real-time statistics that help users discover popular and well-rated quizzes.

### Visual Example

Quiz cards now display popularity indicators:

```
┌─────────────────────────────────────────┐
│ JavaScript Basics Quiz                  │
│ ┌─────┐ ┌────────┐ ┌──────┐            │
│ │ JS  │ │ Beginner│ │ Easy │            │
│ └─────┘ └────────┘ └──────┘            │
│                                         │
│ Test your JavaScript fundamentals...    │
│                                         │
│ ⏱ 10 questions    🏆 100 points        │
│ 👥 1k+ taken      📈 75% avg           │ ← NEW!
│                                         │
│ 👤 Created by John Doe                 │
│ ─────────────────────────────────────  │
│           [Start Quiz]                  │
└─────────────────────────────────────────┘
```

**New Stats Shown:**

- **👥 Completion Count**: "1k+ taken" - Shows how popular the quiz is
- **📈 Average Score**: "75% avg" - Indicates difficulty level

## Features Implemented

### 1. Database Schema

Added a new `quiz_attempt` table to track each quiz completion:

```sql
CREATE TABLE "quiz_attempt" (
  "id" text PRIMARY KEY NOT NULL,
  "quiz_id" text NOT NULL,
  "user_id" text,  -- nullable to support anonymous users
  "score" integer NOT NULL,
  "max_score" integer NOT NULL,
  "percentage" integer NOT NULL,
  "completed_at" timestamp DEFAULT now() NOT NULL
);
```

**Key Design Decisions:**

- `user_id` is nullable to allow anonymous users to take quizzes
- Tracks both raw score and percentage for flexibility
- Uses `completed_at` timestamp for temporal analysis
- Cascading delete when quiz is deleted
- Set null on user deletion to preserve historical data

### 2. Statistics Calculation

Two key metrics are calculated for each quiz:

#### Completion Count

- Number of unique users who have completed the quiz
- Anonymous attempts are counted individually (by attempt ID)
- Prevents duplicate counting of the same user
- Displayed in human-friendly format: "10+", "100+", "1k+", "10k+", etc.

#### Average Score

- Mean percentage score across all attempts
- Rounded to nearest integer for display
- Helps users gauge quiz difficulty

### 3. Repository Functions

#### Quiz Attempts Repository (`src/db/repositories/quiz-attempts.ts`)

```typescript
// Save a quiz completion
saveQuizAttempt(quizId, userId, score, maxScore, percentage);

// Get stats for a single quiz
getQuizStats(quizId); // Returns { completionCount, averageScore }

// Efficiently get stats for multiple quizzes (for listings)
getMultipleQuizStats(quizIds); // Returns Map<quizId, stats>

// Get all attempts for a quiz
getQuizAttempts(quizId);

// Get user's attempt history
getUserAttempts(userId);

// Get user's best score for a quiz
getUserBestAttempt(quizId, userId);

// Format numbers for display
formatCompletionCount(count); // e.g., 1234 → "1k+"
```

#### Updated Quiz Repository

The `getQuizById()` and `getQuizzes()` functions now automatically include statistics:

```typescript
interface QuizWithRelations {
  // ... existing fields
  stats?: {
    completionCount: number;
    averageScore: number;
  };
}
```

### 4. API Integration

The quiz submission endpoint (`/api/quiz/$quizId/submit`) now:

1. Evaluates the quiz submission
2. Saves the attempt to the database
3. Returns results to the user

**Error Handling:** If saving the attempt fails, the user still receives their quiz results. The error is logged but doesn't impact the user experience.

### 5. UI Components

#### Quiz Cards

Quiz cards now display popularity metrics when available:

**Take Quiz Page (`/take-quiz`):**

- Shows completion count with Users icon: "10+ taken"
- Shows average score with TrendingUp icon: "75% avg"

**Dashboard (`/dashboard`):**

- Same statistics displayed for user's own quizzes
- Helps quiz creators see how popular their content is

**Display Logic:**

- Stats only shown if at least one completion exists
- Uses lucide-react icons for visual appeal
- Formatted in a grid layout with other quiz info

### 6. Utility Functions

Added to `src/lib/utils.ts`:

```typescript
formatCompletionCount(count: number): string
```

Converts raw numbers to friendly formats:

- 0 → "0"
- 1-9 → "1", "2", etc.
- 10-99 → "10+"
- 100-999 → "100+"
- 1,000-9,999 → "1k+"
- 10,000-99,999 → "10k+"
- 100,000-999,999 → "100k+"
- 1,000,000+ → "1M+"

## Database Migration

Migration file: `drizzle/0001_motionless_firelord.sql`

To apply:

```bash
npm run db:push
```

Or in production:

```bash
npm run db:migrate
```

## Usage Examples

### Getting Statistics for a Quiz

```typescript
import { getQuizStats } from '@/db/repositories/quiz-attempts';

const stats = await getQuizStats('quiz-id-123');
console.log(`${stats.completionCount} users completed this quiz`);
console.log(`Average score: ${stats.averageScore}%`);
```

### Bulk Stats for Quiz Listings

```typescript
import { getMultipleQuizStats } from '@/db/repositories/quiz-attempts';

const quizIds = ['id1', 'id2', 'id3'];
const statsMap = await getMultipleQuizStats(quizIds);

quizIds.forEach((id) => {
  const stats = statsMap.get(id);
  console.log(`Quiz ${id}: ${stats.completionCount} completions`);
});
```

### Formatting for Display

```typescript
import { formatCompletionCount } from '@/lib/utils';

console.log(formatCompletionCount(5)); // "5"
console.log(formatCompletionCount(42)); // "10+"
console.log(formatCompletionCount(750)); // "100+"
console.log(formatCompletionCount(5000)); // "1k+"
console.log(formatCompletionCount(50000)); // "10k+"
```

## Performance Considerations

### Efficient Bulk Queries

When fetching multiple quizzes (e.g., in listings), statistics are retrieved in a single database query using `getMultipleQuizStats()` instead of individual queries per quiz.

### Query Optimization

- Uses `COUNT(DISTINCT ...)` to efficiently count unique users
- Groups results by `quiz_id` for batch processing
- Indexes on foreign keys (quiz_id, user_id) for fast lookups

### Caching Strategy (Future Enhancement)

Currently stats are calculated on-demand. For high-traffic sites, consider:

- Redis caching with TTL
- Periodic background job to pre-calculate stats
- CDN caching for public quiz listings

## Type Safety

All new functionality is fully typed:

```typescript
// src/db/types.ts
export type QuizAttempt = InferSelectModel<typeof quizAttempt>;
export type QuizAttemptInsert = InferInsertModel<typeof quizAttempt>;

export type QuizStats = {
  completionCount: number;
  averageScore: number;
};

export type QuizWithRelations = Quiz & {
  // ... other fields
  stats?: QuizStats;
};
```

## Testing

A test script is provided at `src/db/test-quiz-stats.ts` to demonstrate the functionality:

```bash
npx tsx src/db/test-quiz-stats.ts
```

The script:

1. Creates a test quiz
2. Simulates multiple user attempts with different scores
3. Retrieves and displays statistics
4. Shows how stats appear in quiz listings
5. Tests the formatting functions

**Note:** You'll need to update the `testUserId` in the script with a valid user ID from your database.

## Security Considerations

### Anonymous Users

- Anonymous users can complete quizzes
- Their attempts are tracked without user_id
- No personal data is collected for anonymous attempts

### Data Privacy

- Only aggregated statistics are shown publicly
- Individual user attempts are not exposed in the UI
- Quiz creators can see aggregated stats but not individual user scores

### Rate Limiting (Recommended)

Consider adding rate limiting to prevent:

- Quiz attempt spam
- Artificial inflation of completion counts
- Database performance issues

## Future Enhancements

### Potential Additions

1. **Leaderboards**
   - Top scorers for each quiz
   - Global leaderboards across all quizzes
   - Time-based rankings (weekly, monthly)

2. **Detailed Analytics**
   - Completion rates over time
   - Question-level difficulty analysis
   - Drop-off points in quizzes

3. **User Achievements**
   - Badges for completing popular quizzes
   - Streak tracking
   - Perfect score achievements

4. **Advanced Filtering**
   - Sort by popularity
   - Filter by difficulty (based on avg score)
   - "Trending" quizzes (recent popularity spikes)

5. **Performance Metrics**
   - Time taken to complete quiz
   - Percentile rankings
   - Improvement tracking over multiple attempts

## Documentation Updates

Updated files:

- `src/db/README.md` - Added quiz_attempt table documentation
- `src/db/types.ts` - Added QuizAttempt and QuizStats types
- `src/db/schema.ts` - Added quiz_attempt table and relations

## Summary

This feature successfully tracks quiz completions and provides meaningful statistics to users. The implementation:

✅ Uses efficient database queries
✅ Supports both authenticated and anonymous users
✅ Provides human-friendly display formats
✅ Integrates seamlessly with existing codebase
✅ Maintains type safety throughout
✅ Includes comprehensive documentation

The statistics help users discover popular and well-rated quizzes, while giving quiz creators insights into their content's performance.

## Quick Start Guide

### For Users

After completing a quiz, your score is automatically saved and contributes to:

1. The quiz's completion count (shown as "10+", "100+", "1k+", etc.)
2. The quiz's average score percentage

No action needed - it happens automatically!

### For Developers

#### 1. Run the migration

```bash
npm run db:push
```

#### 2. That's it!

The feature is fully integrated. Quiz submissions automatically save attempts, and quiz listings automatically include statistics.

#### 3. Test the feature (optional)

```bash
npx tsx src/db/test-quiz-stats.ts
```

## Files Modified/Added

### New Files

- `src/db/repositories/quiz-attempts.ts` - Repository functions for quiz attempts
- `src/db/test-quiz-stats.ts` - Test script for the feature
- `drizzle/0001_motionless_firelord.sql` - Database migration
- `QUIZ_STATISTICS_FEATURE.md` - This documentation

### Modified Files

- `src/db/schema.ts` - Added quiz_attempt table and relations
- `src/db/types.ts` - Added QuizAttempt, QuizAttemptInsert, and QuizStats types
- `src/db/repositories/index.ts` - Export quiz-attempts functions
- `src/db/repositories/quiz.ts` - Include stats in quiz queries
- `src/routes/api/quiz/$quizId.submit.ts` - Save attempts on submission
- `src/routes/take-quiz.tsx` - Display stats on quiz cards
- `src/routes/dashboard.tsx` - Display stats on user's quizzes
- `src/lib/utils.ts` - Added formatCompletionCount function
- `src/db/README.md` - Updated documentation

## Key Implementation Details

### Counting Unique Users

The system counts unique users while also supporting anonymous attempts:

```typescript
COUNT(DISTINCT CASE
  WHEN user_id IS NOT NULL THEN user_id
  ELSE id
END)
```

This ensures:

- Logged-in users are counted once (even if they retake)
- Anonymous attempts are each counted separately
- No duplicate counting

### Performance: Bulk Loading

When displaying multiple quizzes, stats are loaded efficiently in one query:

```typescript
// ❌ Bad: N+1 queries
for (const quiz of quizzes) {
  quiz.stats = await getQuizStats(quiz.id);
}

// ✅ Good: Single query
const statsMap = await getMultipleQuizStats(quizIds);
quizzes.forEach((quiz) => {
  quiz.stats = statsMap.get(quiz.id);
});
```

### Display Logic

Stats are only shown when available:

```typescript
{completionCount > 0 && (
  <div>
    <Users /> {formatCompletionCount(completionCount)} taken
    <TrendingUp /> {averageScore}% avg
  </div>
)}
```

## Common Questions

### Q: What if a user retakes a quiz?

**A:** All attempts are saved, but the completion count only counts each user once (using DISTINCT). The average score includes all attempts.

### Q: Can anonymous users take quizzes?

**A:** Yes! Their attempts are tracked without a user_id and count toward the total.

### Q: How are the "10+", "1k+" numbers calculated?

**A:** The `formatCompletionCount()` function rounds down to the nearest threshold for privacy and simplicity.

### Q: Are individual scores visible to others?

**A:** No, only aggregated statistics (count and average) are shown publicly.

### Q: Does this impact performance?

**A:** Minimal impact. Stats are calculated on-demand but use efficient SQL queries with proper indexing.

### Q: Can quiz creators see who took their quiz?

**A:** Currently no. Only aggregated statistics are shown. Individual user data is private.

## Troubleshooting

### Stats not showing

1. Check if the migration was applied: `npm run db:push`
2. Verify attempts are being saved by checking the `quiz_attempt` table
3. Ensure quizzes are public (stats only show on public quiz listings)

### Stats seem incorrect

1. Check for database consistency
2. Verify the quiz has completed attempts
3. Test with the provided script: `npx tsx src/db/test-quiz-stats.ts`

### Performance issues

1. Ensure database indexes exist on `quiz_attempt.quiz_id` and `quiz_attempt.user_id`
2. Consider implementing caching for high-traffic quizzes
3. Monitor query execution time in production

## Contributing

To extend this feature:

1. **Add new metrics**: Extend `QuizStats` type and update SQL queries
2. **Add caching**: Implement Redis/memory cache in `getQuizStats()`
3. **Add filtering**: Use stats in quiz listing filters (e.g., "Most Popular")
4. **Add time ranges**: Track completions by date for trending analysis

The statistics help users discover popular and well-rated quizzes, while giving quiz creators insights into their content's performance.
