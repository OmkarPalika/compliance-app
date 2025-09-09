'use client';

import { ErrorBoundary } from '@/components/error-boundary';
import { RootProvider } from '@/components/providers/root-provider';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <RootProvider session={null} isErrorPage>
          <ErrorBoundary error={error} reset={reset} context="global" />
        </RootProvider>
      </body>
    </html>
  );
}
