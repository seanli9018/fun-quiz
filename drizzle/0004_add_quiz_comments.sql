CREATE TABLE "quiz_comment" (
	"id" text PRIMARY KEY NOT NULL,
	"quiz_id" text NOT NULL,
	"user_id" text NOT NULL,
	"content" text NOT NULL,
	"parent_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "quiz_comment" ADD CONSTRAINT "quiz_comment_quiz_id_quiz_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."quiz"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_comment" ADD CONSTRAINT "quiz_comment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_comment" ADD CONSTRAINT "quiz_comment_parent_id_quiz_comment_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."quiz_comment"("id") ON DELETE cascade ON UPDATE no action;
