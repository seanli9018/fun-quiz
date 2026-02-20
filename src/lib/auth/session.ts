import { createServerFn } from '@tanstack/react-start';
import { getRequestHeaders } from '@tanstack/react-start/server';
import { auth } from '@/lib/auth/server';

/**
 * Returns the current session or null if not authenticated.
 * Use this when you want to read the session without enforcing auth.
 */
export const getSession = createServerFn({ method: 'GET' }).handler(
  async () => {
    const headers = getRequestHeaders();
    const session = await auth.api.getSession({ headers });
    return session;
  },
);

/**
 * Returns the current session or throws if not authenticated.
 * Use this to protect server functions that require a logged-in user.
 */
export const ensureSession = createServerFn({ method: 'GET' }).handler(
  async () => {
    const headers = getRequestHeaders();
    const session = await auth.api.getSession({ headers });

    if (!session) {
      throw new Error('Unauthorized');
    }

    return session;
  },
);
