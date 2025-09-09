'use client';

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <Button
      variant="ghost"
      onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
      className="w-16"
    >
      {language === 'en' ? 'عربي' : 'ENG'}
    </Button>
  );
}
