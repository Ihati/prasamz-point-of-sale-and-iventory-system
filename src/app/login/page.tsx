
'use client';

import { useUser } from '@/hooks/use-user';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
       <div className="flex h-screen items-center justify-center">
          <div>Loading...</div>
        </div>
    );
  }

  // If user is already logged in (from sessionStorage), this will redirect them.
  // We keep the login form rendered briefly to avoid layout shifts.
  if (user) {
    return (
       <div className="flex h-screen items-center justify-center">
          <div>Redirecting to dashboard...</div>
        </div>
    );
  }

  return (
     <div className="flex h-screen items-center justify-center bg-muted/40">
        <LoginForm />
      </div>
  );
}
