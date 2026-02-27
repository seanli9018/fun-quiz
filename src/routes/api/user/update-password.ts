import { createFileRoute } from '@tanstack/react-router';
import { auth } from '@/lib/auth/server';
import { db } from '@/db';
import { account } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export const Route = createFileRoute('/api/user/update-password')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          // Get the session from the request
          const session = await auth.api.getSession({
            headers: request.headers,
          });

          if (!session) {
            return new Response(
              JSON.stringify({
                success: false,
                error: 'Unauthorized',
              }),
              {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
              },
            );
          }

          const body = await request.json();
          const { currentPassword, newPassword } = body;

          // Validation
          if (!currentPassword || !newPassword) {
            return new Response(
              JSON.stringify({
                success: false,
                error: 'Current password and new password are required',
              }),
              {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
              },
            );
          }

          if (newPassword.length < 8) {
            return new Response(
              JSON.stringify({
                success: false,
                error: 'New password must be at least 8 characters',
              }),
              {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
              },
            );
          }

          // Get the user's account with password
          const [userAccount] = await db
            .select()
            .from(account)
            .where(
              and(
                eq(account.userId, session.user.id),
                eq(account.providerId, 'credential'),
              ),
            );

          if (!userAccount || !userAccount.password) {
            return new Response(
              JSON.stringify({
                success: false,
                error: 'Password authentication not set up for this account',
              }),
              {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
              },
            );
          }

          // Verify current password by comparing hashes
          // We'll use better-auth's password verification
          const { verifyPassword, hashPassword } =
            await import('better-auth/crypto');

          const isValidPassword = await verifyPassword({
            password: currentPassword,
            hash: userAccount.password,
          });

          if (!isValidPassword) {
            return new Response(
              JSON.stringify({
                success: false,
                error: 'Current password is incorrect',
              }),
              {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
              },
            );
          }

          // Hash new password
          const hashedPassword = await hashPassword(newPassword);

          // Update password in database
          await db
            .update(account)
            .set({
              password: hashedPassword,
              updatedAt: new Date(),
            })
            .where(eq(account.id, userAccount.id));

          return new Response(
            JSON.stringify({
              success: true,
              message: 'Password updated successfully',
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            },
          );
        } catch (error) {
          console.error('Error updating password:', error);
          return new Response(
            JSON.stringify({
              success: false,
              error:
                error instanceof Error
                  ? error.message
                  : 'Failed to update password',
            }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            },
          );
        }
      },
    },
  },
});
