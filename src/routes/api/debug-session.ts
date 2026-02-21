import { createFileRoute } from '@tanstack/react-router';
import { getRequestHeaders } from '@tanstack/react-start/server';
import { auth } from '@/lib/auth/server';

export const Route = createFileRoute('/api/debug-session')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        try {
          // Get current user session
          const headers = getRequestHeaders();
          const session = await auth.api.getSession({ headers });

          if (!session || !session.user) {
            return new Response(
              JSON.stringify({
                authenticated: false,
                message: 'No active session',
                session: null,
              }),
              {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
              }
            );
          }

          return new Response(
            JSON.stringify({
              authenticated: true,
              session: {
                user: {
                  id: session.user.id,
                  name: session.user.name,
                  email: session.user.email,
                  emailVerified: session.user.emailVerified,
                },
                sessionId: session.session?.id,
                expiresAt: session.session?.expiresAt,
              },
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        } catch (error) {
          return new Response(
            JSON.stringify({
              error: 'Failed to get session',
              details: error instanceof Error ? error.message : 'Unknown error',
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
