import { createFileRoute } from '@tanstack/react-router';
import { auth } from '@/lib/auth/server';
import { db } from '@/db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const Route = createFileRoute('/api/user/update-bio')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          // Get the session from the request
          const session = await auth.api.getSession({ headers: request.headers });

          if (!session) {
            return new Response(
              JSON.stringify({
                success: false,
                error: 'Unauthorized',
              }),
              {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
              }
            );
          }

          const body = await request.json();
          const { bio } = body;

          // Validation
          if (typeof bio !== 'string') {
            return new Response(
              JSON.stringify({
                success: false,
                error: 'Bio must be a string',
              }),
              {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
              }
            );
          }

          if (bio.length > 500) {
            return new Response(
              JSON.stringify({
                success: false,
                error: 'Bio must be less than 500 characters',
              }),
              {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
              }
            );
          }

          // Update bio in database
          await db
            .update(user)
            .set({
              bio: bio.trim() || null,
              updatedAt: new Date(),
            })
            .where(eq(user.id, session.user.id));

          return new Response(
            JSON.stringify({
              success: true,
              message: 'Bio updated successfully',
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        } catch (error) {
          console.error('Error updating bio:', error);
          return new Response(
            JSON.stringify({
              success: false,
              error:
                error instanceof Error
                  ? error.message
                  : 'Failed to update bio',
            }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }
      },
    },
  },
});
