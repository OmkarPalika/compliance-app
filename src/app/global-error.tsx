'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/language-context';

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorBoundaryProps) {
  const { language } = useLanguage();

  useEffect(() => {
    // Log error to your error reporting service
    console.error('Global error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-4 text-center">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">
            {language === 'en' 
              ? 'Something went wrong!'
              : 'حدث خطأ ما!'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'en'
              ? 'We apologize for the inconvenience. Please try again.'
              : 'نعتذر عن الإزعاج. يرجى المحاولة مرة أخرى.'}
          </p>
        </div>

        <div className="flex justify-center gap-4">
          <Button onClick={() => reset()}>
            {language === 'en' ? 'Try again' : 'حاول مرة أخرى'}
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/'}>
            {language === 'en' ? 'Go to Homepage' : 'العودة إلى الصفحة الرئيسية'}
          </Button>
        </div>
      </div>
    </div>
  );
}
