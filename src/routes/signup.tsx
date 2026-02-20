import { createFileRoute, Link, useRouter } from '@tanstack/react-router';
import { useState } from 'react';
import { signUp } from '@/lib/auth/client';
import { Button } from '@/components/ui/Button';

export const Route = createFileRoute('/signup')({
  component: SignupPage,
});

function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);

    const { error: signUpError } = await signUp.email({
      name,
      email,
      password,
    });

    setLoading(false);

    if (signUpError) {
      setError(
        signUpError.message ?? 'Something went wrong. Please try again.',
      );
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
          Create an account
        </h1>
        <p
          className="text-sm mb-6"
          style={{ color: 'var(--color-muted-foreground)' }}
        >
          Join FunQuiz and start creating quizzes
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label
              htmlFor="name"
              className="block text-sm font-medium"
              style={{ color: 'var(--color-foreground)' }}
            >
              Name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
              placeholder="Your name"
            />
          </div>

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
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
              placeholder="Min. 8 characters"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="confirm-password"
              className="block text-sm font-medium"
              style={{ color: 'var(--color-foreground)' }}
            >
              Confirm password
            </label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            {loading ? 'Creating account…' : 'Create account'}
          </Button>
        </form>

        <p
          className="mt-6 text-center text-sm"
          style={{ color: 'var(--color-muted-foreground)' }}
        >
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-medium hover:underline"
            style={{ color: 'var(--color-primary)' }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
