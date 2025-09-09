import { ReactNode } from 'react';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';

interface ProtectedLayoutProps {
  children: ReactNode;
}

export default async function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="border-b">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link 
            href="/dashboard" 
            className="font-semibold text-lg hover:opacity-80"
          >
            Compliance Checklist
          </Link>
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Dashboard
            </Link>
            <Link 
              href="/upload"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Upload
            </Link>
          </div>
        </div>
      </nav>
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
