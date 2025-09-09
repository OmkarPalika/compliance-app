'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/language-context';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorRecoveryProps {
  error: Error;
  reset: () => void;
  context?: string;
  maxRetries?: number;
}

export function ErrorRecovery({ reset, maxRetries = 3 }: ErrorRecoveryProps) {
  const { language } = useLanguage();
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    if (retryCount >= maxRetries) return;
    
    setIsRetrying(true);
    setRetryCount(prev => prev + 1);
    
    // Add delay for better UX
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      reset();
    } finally {
      setIsRetrying(false);
    }
  };

  const canRetry = retryCount < maxRetries;

  return (
    <Card className="p-6">
      <div className="flex flex-col items-center space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        
        <div className="space-y-2 text-center">
          <h3 className="text-lg font-semibold">
            {language === 'en' ? 'Something went wrong' : 'حدث خطأ ما'}
          </h3>
          
          <p className="text-sm text-muted-foreground">
            {language === 'en'
              ? 'We encountered an error while loading this content.'
              : 'واجهنا خطأ أثناء تحميل هذا المحتوى.'}
          </p>

          {retryCount > 0 && (
            <p className="text-xs text-muted-foreground">
              {language === 'en' 
                ? `Retry attempt ${retryCount}/${maxRetries}`
                : `محاولة إعادة ${retryCount}/${maxRetries}`}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          {canRetry && (
            <Button 
              onClick={handleRetry} 
              disabled={isRetrying}
              variant="default"
            >
              {isRetrying && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
              {language === 'en' ? 'Try Again' : 'حاول مرة أخرى'}
            </Button>
          )}
          
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline"
          >
            {language === 'en' ? 'Reload Page' : 'إعادة تحميل الصفحة'}
          </Button>
        </div>
      </div>
    </Card>
  );
}