import {
  AlertCircle,
  WifiOff,
  ServerCrash,
  AlertTriangle,
  RefreshCw,
  Home,
  XCircle,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export type ErrorType =
  | 'network'
  | 'server'
  | 'not-found'
  | 'unauthorized'
  | 'forbidden'
  | 'validation'
  | 'timeout'
  | 'generic';

interface ErrorCardProps {
  /**
   * Type of error to display
   */
  type?: ErrorType;
  /**
   * Custom title for the error
   */
  title?: string;
  /**
   * Custom description/message for the error
   */
  message?: string;
  /**
   * Error object (optional, for development details)
   */
  error?: Error;
  /**
   * Show technical error details (useful for development)
   */
  showDetails?: boolean;
  /**
   * Callback for retry action
   */
  onRetry?: () => void;
  /**
   * Callback for home/back navigation
   */
  onGoHome?: () => void;
  /**
   * Custom action buttons
   */
  actions?: React.ReactNode;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Size variant
   */
  size?: 'default' | 'sm';
}

const errorConfig: Record<
  ErrorType,
  {
    icon: React.ComponentType<{ className?: string }>;
    defaultTitle: string;
    defaultMessage: string;
    iconColor: string;
  }
> = {
  network: {
    icon: WifiOff,
    defaultTitle: 'Oops! Lost in Cyberspace 🛸',
    defaultMessage:
      "Looks like your internet took a coffee break. Check your connection and let's get this quiz party started!",
    iconColor: 'text-orange-500',
  },
  server: {
    icon: ServerCrash,
    defaultTitle: 'Our Hamsters Need a Break 🐹',
    defaultMessage:
      "The hamsters powering our servers are taking a nap. We're waking them up! Try again in a moment.",
    iconColor: 'text-red-500',
  },
  'not-found': {
    icon: AlertCircle,
    defaultTitle: '404: Quiz Playing Hide and Seek 🙈',
    defaultMessage:
      "We searched high and low, but this page decided to play hide and seek. Spoiler: It's winning!",
    iconColor: 'text-blue-500',
  },
  unauthorized: {
    icon: XCircle,
    defaultTitle: 'Whoa There, Mystery Guest! 🕵️',
    defaultMessage:
      'You need to sign in first! No anonymous quiz ninjas allowed here.',
    iconColor: 'text-yellow-500',
  },
  forbidden: {
    icon: AlertTriangle,
    defaultTitle: 'Access Denied (Sorry!) 🚫',
    defaultMessage:
      "This area is VIP only! Looks like you don't have the golden ticket for this one.",
    iconColor: 'text-red-500',
  },
  validation: {
    icon: AlertCircle,
    defaultTitle: 'Houston, We Have a Data Problem 🚀',
    defaultMessage:
      "Something looks a bit wonky with the data. Double-check and let's give it another shot!",
    iconColor: 'text-amber-500',
  },
  timeout: {
    icon: AlertCircle,
    defaultTitle: 'Time Flies... Too Fast! ⏰',
    defaultMessage:
      'That took longer than watching paint dry. Our patience ran out. Want to try again?',
    iconColor: 'text-orange-500',
  },
  generic: {
    icon: AlertCircle,
    defaultTitle: 'Well, This is Awkward... 😅',
    defaultMessage:
      "Something went sideways. Even we're not sure what happened. Let's pretend this never happened and try again?",
    iconColor: 'text-destructive',
  },
};

export function ErrorCard({
  type = 'generic',
  title,
  message,
  error,
  showDetails = false,
  onRetry,
  onGoHome,
  actions,
  className,
  size = 'default',
}: ErrorCardProps) {
  const config = errorConfig[type];
  const Icon = config.icon;

  const displayTitle = title || config.defaultTitle;
  const displayMessage = message || config.defaultMessage;

  return (
    <Card className={cn('border-destructive/20 w-full', className)} size={size}>
      <CardHeader className="text-center">
        <div className="flex justify-center mb-3">
          <div
            className={cn(
              'rounded-full p-3 bg-muted',
              size === 'sm' ? 'p-2' : 'p-3',
            )}
          >
            <Icon
              className={cn(
                config.iconColor,
                size === 'sm' ? 'size-5' : 'size-6',
              )}
            />
          </div>
        </div>
        <CardTitle className={size === 'sm' ? 'text-base' : 'text-lg'}>
          {displayTitle}
        </CardTitle>
        <CardDescription className="mt-2">{displayMessage}</CardDescription>
      </CardHeader>

      {showDetails && error && (
        <CardContent>
          <div className="rounded-lg bg-muted p-3 text-xs font-mono">
            <div className="text-destructive font-semibold mb-1">
              Error Details:
            </div>
            <div className="text-muted-foreground break-all">
              {error.message}
            </div>
            {error.stack && (
              <details className="mt-2">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                  Stack Trace
                </summary>
                <pre className="mt-2 text-[10px] overflow-auto max-h-40">
                  {error.stack}
                </pre>
              </details>
            )}
          </div>
        </CardContent>
      )}

      {(onRetry || onGoHome || actions) && (
        <CardFooter className="justify-center gap-2 flex-wrap">
          {actions || (
            <>
              {onRetry && (
                <Button
                  onClick={onRetry}
                  variant="default"
                  size={size === 'sm' ? 'sm' : 'default'}
                  className="gap-2"
                >
                  <RefreshCw className="size-4" />
                  Try Again
                </Button>
              )}
              {onGoHome && (
                <Button
                  onClick={onGoHome}
                  variant="outline"
                  size={size === 'sm' ? 'sm' : 'default'}
                  className="gap-2"
                >
                  <Home className="size-4" />
                  Go Home
                </Button>
              )}
            </>
          )}
        </CardFooter>
      )}
    </Card>
  );
}

// Convenience components for common error scenarios
export function NetworkErrorCard(props: Omit<ErrorCardProps, 'type'>) {
  return <ErrorCard {...props} type="network" />;
}

export function ServerErrorCard(props: Omit<ErrorCardProps, 'type'>) {
  return <ErrorCard {...props} type="server" />;
}

export function NotFoundErrorCard(props: Omit<ErrorCardProps, 'type'>) {
  return <ErrorCard {...props} type="not-found" />;
}

export function UnauthorizedErrorCard(props: Omit<ErrorCardProps, 'type'>) {
  return <ErrorCard {...props} type="unauthorized" />;
}
