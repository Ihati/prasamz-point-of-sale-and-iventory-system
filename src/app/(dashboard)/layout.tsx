
'use client';
import Link from 'next/link';
import {
  TooltipProvider,
} from '@/components/ui/tooltip';
import { Header } from '@/components/layout/header';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { useUser } from '@/hooks/use-user';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen w-full">
        <aside className="fixed inset-y-0 left-0 z-10 hidden w-60 flex-col border-r bg-background sm:flex p-4 sm:py-5">
           <Skeleton className="h-9 w-24 mb-4" />
           <div className="flex flex-col gap-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
           </div>
        </aside>
        <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-60 flex-1">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
            <div className="relative ml-auto flex-1 md:grow-0">
               <Skeleton className="h-9 w-full md:w-[200px] lg:w-[336px]" />
            </div>
            <Skeleton className="h-9 w-9 rounded-full" />
          </header>
          <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
             <div className="flex h-[calc(100vh-100px)] items-center justify-center">
              <p>Authenticating...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <aside className="fixed inset-y-0 left-0 z-10 hidden w-60 flex-col border-r bg-background sm:flex">
          <nav className="flex flex-col gap-4 p-4 sm:py-5">
            <Link
              href="/dashboard"
              className="group flex h-9 w-full shrink-0 items-center justify-start gap-2 rounded-full text-lg font-semibold text-primary md:text-base"
            >
              <span className="font-bold">prasamz</span>
            </Link>
            <SidebarNav />
          </nav>
        </aside>
        <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-60">
          <Header onLogout={logout} user={user} />
          <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
