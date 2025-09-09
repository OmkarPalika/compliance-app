'use client';

import { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';
import { LanguageProvider } from '@/contexts/language-context';

interface RootProviderProps {
  children: React.ReactNode;
  session: Session | null;
  isErrorPage?: boolean;
}

export function RootProvider({ children, session, isErrorPage }: RootProviderProps) {
  // For error pages, we only need the LanguageProvider
  if (isErrorPage) {
    return (
      <LanguageProvider>
        {children}
      </LanguageProvider>
    );
  }

  // For regular pages, we need both SessionProvider and LanguageProvider
  return (
    <SessionProvider session={session}>
      <LanguageProvider>
        {children}
      </LanguageProvider>
    </SessionProvider>
  );
}
