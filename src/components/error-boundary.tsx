'use client';

import { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/language-context';
import { AlertCircle } from 'lucide-react';

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
  context?: string;
}

export function ErrorBoundary({ error, reset, context }: ErrorBoundaryProps) {
  const { language } = useLanguage();

  useEffect(() => {
    // Log error to your error reporting service
    console.error(`Error in ${context || 'unknown context'}:`, error);
  }, [error, context]);

  return (
    <Card className="p-6">
      <div className="flex flex-col items-center space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        
        <div className="space-y-2 text-center">
          <h3 className="text-lg font-semibold">
            {language === 'en' 
              ? 'Error Loading Content'
              : 'خطأ في تحميل المحتوى'}
          </h3>
          
          <p className="text-sm text-muted-foreground">
            {language === 'en'
              ? 'There was a problem loading this content.'
              : 'حدثت مشكلة أثناء تحميل هذا المحتوى.'}
          </p>

          {process.env.NODE_ENV === 'development' && (
            <div className="mt-2 p-2 bg-destructive/10 rounded text-left">
              <pre className="text-xs overflow-auto max-h-32">
                {error.message}
                {error.stack && '\n' + error.stack}
              </pre>
            </div>
          )}
        </div>

        <Button onClick={() => reset()}>
          {language === 'en' ? 'Try Again' : 'حاول مرة أخرى'}
        </Button>
      </div>
    </Card>
  );
}
