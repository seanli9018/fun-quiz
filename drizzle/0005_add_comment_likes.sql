-- Add comment_like table for storing user likes on comments
CREATE TABLE IF NOT EXISTS "comment_like" (
	"id" text PRIMARY KEY NOT NULL,
	"comment_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Add foreign key constraints
ALTER TABLE "comment_like" ADD CONSTRAINT "comment_like_comment_id_quiz_comment_id_fk" FOREIGN KEY ("comment_id") REFERENCES "quiz_comment"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "comment_like" ADD CONSTRAINT "comment_like_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;

-- Add unique constraint to prevent duplicate likes
CREATE UNIQUE INDEX IF NOT EXISTS "comment_like_user_comment_idx" ON "comment_like" ("user_id", "comment_id");
