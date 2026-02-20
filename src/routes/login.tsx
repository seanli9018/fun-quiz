import { createFileRoute, Link, useRouter } from '@tanstack/react-router';
import { useState } from 'react';
import { signIn } from '@/lib/auth/client';
import { Button } from '@/components/ui/Button';

export const Route = createFileRoute('/login')({
  component: LoginPage,
});

function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signInError } = await signIn.email({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message ?? 'Invalid email or password.');
      return;
    }

    await router.navigate({ to: '/' });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-sm">
        <h1
          className="text-2xl font-bold mb-1"
          style={{ color: 'var(--color-foreground)' }}
        >
          Welcome back
        </h1>
        <p
          className="text-sm mb-6"
          style={{ color: 'var(--color-muted-foreground)' }}
        >
          Sign in to your FunQuiz account
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label
              htmlFor="email"
              className="block text-sm font-medium"
              style={{ color: 'var(--color-foreground)' }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="password"
              className="block text-sm font-medium"
              style={{ color: 'var(--color-foreground)' }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button
            type="submit"
            variant="default"
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <p
          className="mt-6 text-center text-sm"
          style={{ color: 'var(--color-muted-foreground)' }}
        >
          Don't have an account?{' '}
          <Link
            to="/signup"
            className="font-medium hover:underline"
            style={{ color: 'var(--color-primary)' }}
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
