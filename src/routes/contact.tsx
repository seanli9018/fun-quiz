import { createFileRoute, Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/Card';
import { Mail, Coffee, Code, Sparkles, Heart, ArrowLeft } from 'lucide-react';

export const Route = createFileRoute('/contact')({ component: Contact });

function Contact() {
  return (
    <div
      className="min-h-screen px-4 py-12"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      <div className="max-w-3xl mx-auto">
        {/* Page heading */}
        <div className="text-center mb-10">
          <h1
            className="text-4xl md:text-5xl font-bold mb-3"
            style={{ color: 'var(--color-foreground)' }}
          >
            Get in touch <span className="inline-block animate-bounce">👋</span>
          </h1>
          <p
            className="text-lg"
            style={{ color: 'var(--color-muted-foreground)' }}
          >
            Have a question, feedback, or want to collaborate? I'd love to hear
            from you.
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Creator card — spans full width */}
          <Card className="md:col-span-2">
            <CardContent>
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                {/* Avatar — object-[50%_15%] keeps the head visible */}
                <div className="shrink-0">
                  <img
                    src="/author-avatar.png"
                    alt="Author avatar"
                    className="size-24 rounded-2xl object-cover object-[50%_15%] border-2 border-border shadow-md"
                  />
                </div>
                <div className="text-center sm:text-left">
                  <h2
                    className="text-xl font-bold mb-1"
                    style={{ color: 'var(--color-foreground)' }}
                  >
                    Sean 🐍
                  </h2>
                  <p
                    className="text-sm mb-3"
                    style={{ color: 'var(--color-muted-foreground)' }}
                  >
                    UI-focused full-stack developer who loves crafting
                    delightful, fast interfaces and clean APIs. This little
                    product was built with an emphasis on usability,
                    performance, and a sprinkle of fun.
                  </p>
                  <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
                    <Badge variant="secondary">
                      <Code className="size-3 mr-0.5" />
                      Full-Stack
                    </Badge>
                    <Badge variant="secondary">
                      <Sparkles className="size-3 mr-0.5" />
                      AI-Assisted
                    </Badge>
                    <Badge variant="secondary">
                      <Heart className="size-3 mr-0.5" />
                      UI / UX
                    </Badge>
                    <Badge variant="outline">React</Badge>
                    <Badge variant="outline">TypeScript</Badge>
                    <Badge variant="outline">TanStack</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail
                  className="size-4"
                  style={{ color: 'var(--color-primary)' }}
                />
                Reach out
              </CardTitle>
              <CardDescription>
                Drop me a line anytime — I read every message.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <a
                  href="mailto:example@funquiz.com"
                  className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 hover:bg-muted transition-colors group"
                >
                  <span className="text-xl">📧</span>
                  <div>
                    <div
                      className="text-sm font-medium group-hover:underline"
                      style={{ color: 'var(--color-primary)' }}
                    >
                      example@funquiz.com
                    </div>
                    <div
                      className="text-xs"
                      style={{ color: 'var(--color-muted-foreground)' }}
                    >
                      General inquiries & feedback
                    </div>
                  </div>
                </a>
                <a
                  href="mailto:example@funquiz.com?subject=Bug%20Report"
                  className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 hover:bg-muted transition-colors group"
                >
                  <span className="text-xl">🐛</span>
                  <div>
                    <div
                      className="text-sm font-medium group-hover:underline"
                      style={{ color: 'var(--color-primary)' }}
                    >
                      Report a bug
                    </div>
                    <div
                      className="text-xs"
                      style={{ color: 'var(--color-muted-foreground)' }}
                    >
                      Found something broken? Let me know!
                    </div>
                  </div>
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Support card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coffee
                  className="size-4"
                  style={{ color: 'var(--color-primary)' }}
                />
                Support the project
              </CardTitle>
              <CardDescription>
                Every cup fuels more features and fewer late-night bugs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border p-4 text-center space-y-3">
                <div className="text-4xl">☕</div>
                <p
                  className="text-sm"
                  style={{ color: 'var(--color-muted-foreground)' }}
                >
                  If Fun Quiz made you smile, consider buying me a coffee. It
                  keeps the code flowing and the snake happy.
                </p>
                <a href="mailto:example@funquiz.com?subject=Support%20for%20Fun%20Quiz">
                  <Button variant="default" className="w-full">
                    Buy me a coffee ☕
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Fun facts card — full width */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles
                  className="size-4"
                  style={{ color: 'var(--color-primary)' }}
                />
                Fun facts about this project
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="rounded-lg border border-border p-3">
                  <div className="text-2xl mb-1">🧠</div>
                  <div
                    className="text-xs font-medium"
                    style={{ color: 'var(--color-foreground)' }}
                  >
                    AI-Assisted
                  </div>
                  <div
                    className="text-xs"
                    style={{ color: 'var(--color-muted-foreground)' }}
                  >
                    Design & dev
                  </div>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <div className="text-2xl mb-1">⚡</div>
                  <div
                    className="text-xs font-medium"
                    style={{ color: 'var(--color-foreground)' }}
                  >
                    Blazing Fast
                  </div>
                  <div
                    className="text-xs"
                    style={{ color: 'var(--color-muted-foreground)' }}
                  >
                    TanStack powered
                  </div>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <div className="text-2xl mb-1">🎨</div>
                  <div
                    className="text-xs font-medium"
                    style={{ color: 'var(--color-foreground)' }}
                  >
                    Pixel Perfect
                  </div>
                  <div
                    className="text-xs"
                    style={{ color: 'var(--color-muted-foreground)' }}
                  >
                    Crafted with care
                  </div>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <div className="text-2xl mb-1">🐍</div>
                  <div
                    className="text-xs font-medium"
                    style={{ color: 'var(--color-foreground)' }}
                  >
                    Snake Approved
                  </div>
                  <div
                    className="text-xs"
                    style={{ color: 'var(--color-muted-foreground)' }}
                  >
                    100% certified
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-between">
              <p
                className="text-xs"
                style={{ color: 'var(--color-muted-foreground)' }}
              >
                Fun Quiz — learning, accessibility, and a dash of fun.
              </p>
              <Link to="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="size-3.5 mr-1" />
                  Home
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Contact;
