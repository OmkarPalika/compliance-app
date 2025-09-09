'use client';

import { Toaster } from 'sonner';
import { useLanguage } from '@/contexts/language-context';

export function ToastProvider() {
  const { language } = useLanguage();

  return (
    <Toaster
      position="bottom-right"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
      toastOptions={{
        style: {
          direction: language === 'ar' ? 'rtl' : 'ltr',
        },
      }}
    />
  );
}
