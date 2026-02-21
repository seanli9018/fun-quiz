# Database Schema Documentation

This document describes the database schema for the Fun Quiz application.

## Overview

The database consists of the following main entities:
- **Users** - Authentication and user management
- **Quizzes** - Quiz content and metadata
- **Questions** - Individual questions within quizzes
- **Answers** - Answer options for questions
- **Tags** - Categories/tags for organizing quizzes
- **Quiz Tags** - Many-to-many relationship between quizzes and tags

## Tables

### User Tables (Authentication)

#### `user`
Stores user account information.

| Column | Type | Description |
|--------|------|-------------|
| id | text | Primary key |
| name | text | User's display name |
| email | text | User's email (unique) |
| email_verified | boolean | Email verification status |
| image | text | Profile image URL |
| created_at | timestamp | Account creation timestamp |
| updated_at | timestamp | Last update timestamp |

#### `session`
Manages user authentication sessions.

| Column | Type | Description |
|--------|------|-------------|
| id | text | Primary key |
| expires_at | timestamp | Session expiration time |
| token | text | Session token (unique) |
| created_at | timestamp | Session creation timestamp |
| updated_at | timestamp | Last update timestamp |
| ip_address | text | IP address of session |
| user_agent | text | Browser/client user agent |
| user_id | text | Foreign key to `user` |

#### `account`
Stores OAuth provider account information.

| Column | Type | Description |
|--------|------|-------------|
| id | text | Primary key |
| account_id | text | Provider account ID |
| provider_id | text | OAuth provider identifier |
| user_id | text | Foreign key to `user` |
| access_token | text | OAuth access token |
| refresh_token | text | OAuth refresh token |
| id_token | text | OAuth ID token |
| access_token_expires_at | timestamp | Access token expiration |
| refresh_token_expires_at | timestamp | Refresh token expiration |
| scope | text | OAuth scope |
| password | text | Hashed password (for email/password auth) |
| created_at | timestamp | Account creation timestamp |
| updated_at | timestamp | Last update timestamp |

#### `verification`
Stores verification tokens for email verification, password reset, etc.

| Column | Type | Description |
|--------|------|-------------|
| id | text | Primary key |
| identifier | text | Email or user identifier |
| value | text | Verification token |
| expires_at | timestamp | Token expiration time |
| created_at | timestamp | Token creation timestamp |
| updated_at | timestamp | Last update timestamp |

### Quiz Tables

#### `quiz`
Main quiz entity containing quiz metadata.

| Column | Type | Description |
|--------|------|-------------|
| id | text | Primary key |
| title | text | Quiz title |
| description | text | Quiz description (optional) |
| user_id | text | Foreign key to `user` (creator) |
| is_public | boolean | Whether quiz is publicly accessible |
| created_at | timestamp | Quiz creation timestamp |
| updated_at | timestamp | Last update timestamp |

**Relations:**
- Belongs to one `user` (creator)
- Has many `questions`
- Has many `tags` through `quiz_tag`

#### `question`
Individual questions within a quiz.

| Column | Type | Description |
|--------|------|-------------|
| id | text | Primary key |
| quiz_id | text | Foreign key to `quiz` |
| text | text | Question text |
| order | integer | Display order within quiz |
| points | integer | Points awarded for correct answer |
| created_at | timestamp | Question creation timestamp |
| updated_at | timestamp | Last update timestamp |

**Relations:**
- Belongs to one `quiz`
- Has many `answers`

#### `answer`
Answer options for questions (multiple choice).

| Column | Type | Description |
|--------|------|-------------|
| id | text | Primary key |
| question_id | text | Foreign key to `question` |
| text | text | Answer text |
| is_correct | boolean | Whether this is the correct answer |
| order | integer | Display order within question |
| created_at | timestamp | Answer creation timestamp |
| updated_at | timestamp | Last update timestamp |

**Relations:**
- Belongs to one `question`

#### `tag`
Categories/tags for organizing quizzes.

| Column | Type | Description |
|--------|------|-------------|
| id | text | Primary key |
| name | text | Tag name (unique) |
| created_at | timestamp | Tag creation timestamp |

**Relations:**
- Has many `quizzes` through `quiz_tag`

#### `quiz_tag`
Junction table for many-to-many relationship between quizzes and tags.

| Column | Type | Description |
|--------|------|-------------|
| id | text | Primary key |
| quiz_id | text | Foreign key to `quiz` |
| tag_id | text | Foreign key to `tag` |
| created_at | timestamp | Association creation timestamp |

**Relations:**
- Belongs to one `quiz`
- Belongs to one `tag`

## Entity Relationships

```
user (1) ──< (N) quiz (1) ──< (N) question (1) ──< (N) answer
                  │
                  └──< (N) quiz_tag (N) ──< (1) tag
```

## Repository Functions

### Quiz Operations (`src/db/repositories/quiz.ts`)

- **`createQuiz(userId, input)`** - Create a new quiz with questions and tags
- **`getQuizById(quizId)`** - Get a quiz with all relations (user, tags, questions, answers)
- **`getQuizzes(filters, pagination)`** - Get quizzes with filters and pagination
- **`updateQuiz(quizId, userId, input)`** - Update an existing quiz
- **`deleteQuiz(quizId, userId)`** - Delete a quiz
- **`getAllTags()`** - Get all available tags
- **`userOwnsQuiz(quizId, userId)`** - Check if a user owns a quiz

### Quiz Evaluation (`src/db/repositories/quiz-evaluation.ts`)

- **`evaluateQuizSubmission(submission)`** - Evaluate a quiz submission and calculate score
- **`getQuizForTaking(quizId)`** - Get quiz questions without revealing correct answers
- **`canAccessQuiz(quizId, userId?)`** - Check if a user can access a quiz

## TypeScript Types

All TypeScript types are defined in `src/db/types.ts`:

- **Entity Types**: `Quiz`, `Question`, `Answer`, `Tag`, `QuizTag`
- **Insert Types**: `QuizInsert`, `QuestionInsert`, etc.
- **Extended Types**: `QuizWithRelations`, `QuestionWithAnswers`, etc.
- **Input Types**: `CreateQuizInput`, `UpdateQuizInput`
- **Submission Types**: `QuizSubmission`, `QuizResult`
- **Filter Types**: `QuizFilters`, `PaginationParams`, `PaginatedResponse`

## Seeding

Initial tags can be seeded using:

```bash
npm run db:seed
```

This will populate the `tag` table with common quiz categories like Science, History, Geography, etc.

## Database Commands

- **`npm run db:generate`** - Generate migrations from schema changes
- **`npm run db:push`** - Push schema changes directly to database (development)
- **`npm run db:migrate`** - Apply migrations to database
- **`npm run db:studio`** - Open Drizzle Studio for database management
- **`npm run db:seed`** - Seed initial data (tags)

## Notes

- All IDs use `nanoid` for generation
- Cascade deletes are configured on foreign keys
- The `quiz.is_public` field controls access: public quizzes can be viewed by anyone, private quizzes only by the creator
- Questions and answers have `order` fields to maintain consistent display order
- The `question.points` field allows different point values for different questions
