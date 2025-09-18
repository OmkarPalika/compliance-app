'use client';

import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ComplianceItemProps {
  item: {
    _id: string;
    ruleId: string;
    textEn: string;
    textAr: string;
    status: 'yes' | 'no' | 'pending';
    category: string;
    documentRef: string;
    language: 'en' | 'ar';
  };
  onUpdateStatus: (itemId: string, status: 'yes' | 'no' | 'pending') => Promise<void>;
}

export function ComplianceItem({ item, onUpdateStatus }: ComplianceItemProps) {
  const { language } = useLanguage();
  
  // Show only language-specific content based on document language
  const text = item.language === 'en' ? item.textEn : item.textAr;
  const shouldShowInCurrentLanguage = item.language === language;

  // Generate a consistent random reference number based on item ID
  const generateRefNumber = (id: string): string => {
    const hash = id.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return Math.abs(hash % 90000 + 10000).toString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'yes':
        return 'bg-green-100 border-green-300';
      case 'no':
        return 'bg-red-100 border-red-300';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  // Only render if the item language matches current language
  if (!shouldShowInCurrentLanguage) {
    return null;
  }

  return (
    <Card className={`border-2 ${getStatusColor(item.status)}`}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header with Ref No. and Doc Ref No. */}
          <div className={`flex justify-between items-center text-sm font-medium ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <div className={`${language === 'ar' ? 'text-right' : 'text-left'}`}>
              <span className="text-gray-700">
                {language === 'en' ? 'Ref No.' : 'رقم المرجع'}: {generateRefNumber(item._id)}
              </span>
            </div>
            <div className={`${language === 'ar' ? 'text-left' : 'text-right'}`}>
              <span className="text-gray-700">
                {language === 'en' ? 'Doc Ref No.' : 'رقم مرجع الوثيقة'}: {item.documentRef}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className={`${language === 'ar' ? 'text-right' : 'text-left'}`}>
            <div className="text-sm font-medium text-gray-700 mb-2">
              {language === 'en' ? 'Description:' : 'الوصف:'}
            </div>
            <p className="text-sm text-gray-900 leading-relaxed">{text}</p>
          </div>

          {/* Decision Buttons */}
          <div className={`flex justify-between items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <div className="text-sm font-medium text-gray-700">
              {language === 'en' ? 'Decision:' : 'القرار:'}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={item.status === 'yes' ? 'default' : 'outline'}
                onClick={() => onUpdateStatus(item._id, 'yes')}
                className="w-16"
              >
                {language === 'en' ? 'Yes' : 'نعم'}
              </Button>
              <Button
                size="sm"
                variant={item.status === 'no' ? 'default' : 'outline'}
                onClick={() => onUpdateStatus(item._id, 'no')}
                className="w-16"
              >
                {language === 'en' ? 'No' : 'لا'}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
