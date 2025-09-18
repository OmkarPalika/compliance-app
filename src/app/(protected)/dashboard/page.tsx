import { Suspense } from 'react';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { DashboardClient } from '@/components/dashboard/dashboard-client';
import { LanguageSwitcher } from '@/components/language-switcher';
import { authOptions } from '@/lib/auth';
import { getFilteredDocuments } from '@/lib/actions/document-actions';
import type { FilterStatus } from '@/lib/actions/document-actions';

interface SearchParams {
  search?: string;
  status?: FilterStatus;
  page?: string;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  const resolvedSearchParams = await searchParams;

  const { documents, total } = await getFilteredDocuments({
    userId: session.user.id,
    searchTerm: resolvedSearchParams?.search ?? '',
    status: (resolvedSearchParams?.status as FilterStatus) ?? 'all',
    page: resolvedSearchParams?.page ? parseInt(resolvedSearchParams.page) : 1,
  });

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, {session.user.name}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Link href="/upload">
              <Button>
                Upload New Document
              </Button>
            </Link>
          </div>
        </header>

        <Suspense fallback={<DocumentsGridSkeleton />}>
          <DashboardClient 
            initialDocuments={documents} 
            totalDocuments={total}
          />
        </Suspense>
      </div>
    </div>
  );
}

function DocumentsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="h-[200px] rounded-lg bg-gray-100 animate-pulse"
        />
      ))}
    </div>
  );
}
