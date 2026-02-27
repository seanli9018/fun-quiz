import { createFileRoute, useRouter } from '@tanstack/react-router';
import { useSession } from '@/lib/auth/client';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { Lock, User, Loader2, Edit2, X } from 'lucide-react';

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
});

function SettingsPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Bio form state
  const [bio, setBio] = useState('');
  const [bioLoading, setBioLoading] = useState(false);
  const [bioError, setBioError] = useState('');
  const [bioSuccess, setBioSuccess] = useState('');
  const [bioEditMode, setBioEditMode] = useState(false);

  // Password edit mode state
  const [passwordEditMode, setPasswordEditMode] = useState(false);

  // Load bio from session when available
  useEffect(() => {
    if (session?.user) {
      const userBio = (session.user as any).bio || '';
      setBio(userBio);
    }
  }, [session?.user]);

  // Redirect if not logged in
  if (!isPending && !session) {
    router.navigate({ to: '/login' });
    return null;
  }

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }

    setPasswordLoading(true);

    try {
      const response = await fetch('/api/user/update-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update password');
      }

      setPasswordSuccess('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Exit edit mode after successful update
      setTimeout(() => {
        setPasswordEditMode(false);
        setPasswordSuccess('');
      }, 2000);
    } catch (error) {
      setPasswordError(
        error instanceof Error ? error.message : 'Failed to update password',
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleBioUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setBioError('');
    setBioSuccess('');

    if (bio.length > 500) {
      setBioError('Bio must be less than 500 characters');
      return;
    }

    setBioLoading(true);

    try {
      const response = await fetch('/api/user/update-bio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bio,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update bio');
      }

      setBioSuccess('Bio updated successfully');

      // Exit edit mode after successful update
      setTimeout(() => {
        setBioEditMode(false);
        setBioSuccess('');
      }, 2000);
    } catch (error) {
      setBioError(
        error instanceof Error ? error.message : 'Failed to update bio',
      );
    } finally {
      setBioLoading(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* User Info Section */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <User className="size-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">
              Profile Information
            </h2>
          </div>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">
                Name
              </Label>
              <p className="mt-1 text-foreground">{session?.user.name}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">
                Email
              </Label>
              <p className="mt-1 text-foreground">{session?.user.email}</p>
            </div>
          </div>
        </Card>

        {/* Bio Section */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <User className="size-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Bio</h2>
            </div>
            {!bioEditMode && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setBioEditMode(true)}
              >
                <Edit2 className="size-4 mr-2" />
                Edit
              </Button>
            )}
          </div>

          {!bioEditMode ? (
            <div>
              <p className="text-foreground whitespace-pre-wrap">
                {bio || (
                  <span className="text-muted-foreground italic">
                    No bio added yet
                  </span>
                )}
              </p>
            </div>
          ) : (
            <form onSubmit={handleBioUpdate} className="space-y-4">
              <div>
                <Label htmlFor="bio" className="mb-2">
                  About you
                </Label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us a bit about yourself..."
                  className="w-full min-h-30 px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y mt-2"
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {bio.length}/500 characters
                </p>
              </div>

              {bioError && (
                <div className="text-sm text-red-600 dark:text-red-400">
                  {bioError}
                </div>
              )}

              {bioSuccess && (
                <div className="text-sm text-green-600 dark:text-green-400">
                  {bioSuccess}
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={bioLoading}>
                  {bioLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    'Save Bio'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setBioEditMode(false);
                    setBioError('');
                    setBioSuccess('');
                    // Reset to original value
                    const userBio = (session?.user as any).bio || '';
                    setBio(userBio);
                  }}
                  disabled={bioLoading}
                >
                  <X className="size-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </Card>

        {/* Password Section */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Lock className="size-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">
                Change Password
              </h2>
            </div>
            {!passwordEditMode && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPasswordEditMode(true)}
              >
                <Edit2 className="size-4 mr-2" />
                Edit
              </Button>
            )}
          </div>

          {!passwordEditMode ? (
            <div>
              <p className="text-muted-foreground">
                Click "Edit" to change your password
              </p>
            </div>
          ) : (
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div>
                <Label htmlFor="current-password" className="mb-2">
                  Current Password
                </Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="new-password" className="mb-2">
                  New Password
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="confirm-password" className="mb-2">
                  Confirm New Password
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="mt-2"
                />
              </div>

              {passwordError && (
                <div className="text-sm text-red-600 dark:text-red-400">
                  {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div className="text-sm text-green-600 dark:text-green-400">
                  {passwordSuccess}
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={passwordLoading}>
                  {passwordLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-2" />
                      Updating...
                    </>
                  ) : (
                    'Update Password'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setPasswordEditMode(false);
                    setPasswordError('');
                    setPasswordSuccess('');
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  disabled={passwordLoading}
                >
                  <X className="size-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
