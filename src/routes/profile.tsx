import { createFileRoute, Navigate } from '@tanstack/react-router';
import { useSession } from '@/lib/auth/client';

export const Route = createFileRoute('/profile')({
  component: Profile,
});

function Profile() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--color-background)' }}
      >
        <div style={{ color: 'var(--color-foreground)' }}>Loading...</div>
      </div>
    );
  }

  // Redirect to user profile page
  if (session?.user?.id) {
    return <Navigate to="/user/$userId" params={{ userId: session.user.id }} />;
  }

  // If not logged in, redirect to login
  return <Navigate to="/login" />;
}

export default Profile;
