import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/language-context';
import { Loader2 } from 'lucide-react';

interface LoadingProps {
  message?: string;
}

export function Loading({ message }: LoadingProps) {
  const { language } = useLanguage();

  return (
    <Card className="p-6">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          {message || (language === 'en' ? 'Loading...' : 'جاري التحميل...')}
        </p>
      </div>
    </Card>
  );
}
