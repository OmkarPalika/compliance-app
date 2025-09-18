'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/language-context';
import { ComplianceItem } from '@/components/checklist/compliance-item';

interface ChecklistProps {
  items: Array<{
    _id: string;
    ruleId: string;
    textEn: string;
    textAr: string;
    status: 'yes' | 'no' | 'pending';
    category: string;
    documentRef: string;
    language: 'en' | 'ar';
  }>;
  onUpdateStatus: (itemId: string, status: 'yes' | 'no' | 'pending') => Promise<void>;
}

export function Checklist({ items, onUpdateStatus }: ChecklistProps) {
  const { language } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filter items by language first
  const languageFilteredItems = items.filter(item => item.language === language);
  
  // Get unique categories from language-filtered items
  const categories = ['all', ...new Set(languageFilteredItems.map(item => item.category))];

  // Filter by category
  const filteredItems = selectedCategory === 'all'
    ? languageFilteredItems
    : languageFilteredItems.filter(item => item.category === selectedCategory);

  // Calculate progress based on language-filtered items
  const completedItems = languageFilteredItems.filter(item => item.status !== 'pending').length;
  const progress = languageFilteredItems.length > 0 ? (completedItems / languageFilteredItems.length) * 100 : 0;

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader className="space-y-4">
        <CardTitle className={language === 'ar' ? 'text-right' : 'text-left'}>
          {language === 'en' ? 'Compliance Checklist' : 'قائمة التحقق من الامتثال'}
        </CardTitle>
        
        <div className="flex justify-between items-center">
          <div className="w-64">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder={language === 'en' ? "Filter by category" : "تصفية حسب الفئة"} />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="text-sm text-muted-foreground">
            {language === 'en' 
              ? `Progress: ${completedItems}/${languageFilteredItems.length} (${Math.round(progress)}%)`
              : `التقدم: ${completedItems}/${languageFilteredItems.length} (${Math.round(progress)}%)`
            }
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {filteredItems.map(item => (
          <ComplianceItem
            key={item._id}
            item={item}
            onUpdateStatus={onUpdateStatus}
          />
        ))}
      </CardContent>
    </Card>
  );
}
