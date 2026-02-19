import { createFileRoute, Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/Button';

export const Route = createFileRoute('/')({ component: App });

function App() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      <div className="text-center max-w-2xl">
        <h1
          className="text-5xl md:text-6xl font-bold mb-6"
          style={{ color: 'var(--color-foreground)' }}
        >
          Welcome to{' '}
          <span style={{ color: 'var(--color-primary)' }}>Fun Quiz</span>
        </h1>

        <p
          className="text-xl mb-4"
          style={{ color: 'var(--color-foreground)' }}
        >
          Test your knowledge and challenge your friends!
        </p>

        <p
          className="text-lg mb-12"
          style={{ color: 'var(--color-muted-foreground)' }}
        >
          Create your own custom quizzes and share them with the community, or
          take quizzes created by other users and see how you stack up.
        </p>

        <div className="flex flex-row gap-4 justify-center">
          <Link to="/create-quiz">
            <Button variant="default" size="sm">
              Create Quiz
            </Button>
          </Link>
          <Button variant="outline" size="sm">
            Take Quiz
          </Button>
        </div>
      </div>
    </div>
  );
}
