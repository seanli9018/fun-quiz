import { db } from '../index';
import { user } from '../schema';
import { eq } from 'drizzle-orm';

/**
 * Get user by ID
 */
export async function getUserById(userId: string) {
  const result = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      bio: user.bio,
      createdAt: user.createdAt,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  return result[0] || null;
}
