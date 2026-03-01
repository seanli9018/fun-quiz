import { Link, useRouter } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import {
  Moon,
  Sun,
  PenLine,
  BookOpen,
  LogOut,
  LogIn,
  LayoutDashboard,
  Settings,
} from 'lucide-react';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/NavigationMenu';
import { Avatar, AvatarFallback } from '@/components/ui/Avatar';
import { useSession, signOut } from '@/lib/auth/client';

export default function Header() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    const stored = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const preferred =
      stored ??
      (window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light');
    setTheme(preferred);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme, mounted]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));

  const handleSignOut = async () => {
    await signOut();
    await router.navigate({ to: '/' });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex h-14 items-center px-4 gap-2">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 mr-2 font-bold text-lg text-foreground hover:text-primary transition-colors"
        >
          FunQuiz
        </Link>

        {/* Navigation */}
        <NavigationMenu>
          <NavigationMenuList>
            {/* Quiz dropdown */}
            <NavigationMenuItem>
              <NavigationMenuTrigger>Quiz</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid gap-1 p-2 w-52">
                  <li>
                    <NavigationMenuLink
                      render={<Link to="/create-quiz" />}
                      className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
                    >
                      <PenLine className="size-4 text-muted-foreground shrink-0" />
                      <div>
                        <div className="font-medium">Create Quiz</div>
                        <div className="text-xs text-muted-foreground">
                          Build a new quiz
                        </div>
                      </div>
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink
                      render={<Link to="/take-quiz" />}
                      className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
                    >
                      <BookOpen className="size-4 text-muted-foreground shrink-0" />
                      <div>
                        <div className="font-medium">Take Quiz</div>
                        <div className="text-xs text-muted-foreground">
                          Browse and play quizzes
                        </div>
                      </div>
                    </NavigationMenuLink>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Contact */}
            <NavigationMenuItem>
              <NavigationMenuLink
                render={<Link to="/contact" />}
                className={navigationMenuTriggerStyle()}
              >
                Contact
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-1">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="inline-flex items-center justify-center size-9 rounded-lg hover:bg-muted text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Toggle theme"
          >
            {mounted ? (
              theme === 'light' ? (
                <Moon className="size-4.5" />
              ) : (
                <Sun className="size-4.5" />
              )
            ) : (
              <span className="size-4.5" />
            )}
          </button>

          {/* Auth area */}
          {!isPending && (
            <>
              {session ? (
                /* Logged-in user menu */
                <NavigationMenu>
                  <NavigationMenuList>
                    <NavigationMenuItem>
                      <NavigationMenuTrigger className="gap-2 pl-2">
                        <Avatar size="sm">
                          <AvatarFallback>
                            {session.user.name?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium max-w-28 truncate">
                          {session.user.name}
                        </span>
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <ul className="grid gap-1 p-2 w-44">
                          <li>
                            <div className="px-3 py-2 text-xs text-muted-foreground truncate border-b border-border mb-1">
                              {session.user.email}
                            </div>
                          </li>
                          <li>
                            <NavigationMenuLink
                              render={
                                <Link
                                  to="/user/$userId"
                                  params={{ userId: session.user.id }}
                                />
                              }
                              className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
                            >
                              <LayoutDashboard className="size-4 text-muted-foreground shrink-0" />
                              My Profile
                            </NavigationMenuLink>
                          </li>
                          <li>
                            <NavigationMenuLink
                              render={<Link to="/settings" />}
                              className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
                            >
                              <Settings className="size-4 text-muted-foreground shrink-0" />
                              Settings
                            </NavigationMenuLink>
                          </li>
                          <li>
                            <button
                              onClick={handleSignOut}
                              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted transition-colors text-foreground"
                            >
                              <LogOut className="size-4 text-muted-foreground shrink-0" />
                              Sign out
                            </button>
                          </li>
                        </ul>
                      </NavigationMenuContent>
                    </NavigationMenuItem>
                  </NavigationMenuList>
                </NavigationMenu>
              ) : (
                /* Logged-out: show login + signup links */
                <div className="flex items-center gap-1">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    <LogIn className="size-4" />
                    Sign in
                  </Link>
                  <Link
                    to="/signup"
                    className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
