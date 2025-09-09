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
  };
  onUpdateStatus: (itemId: string, status: 'yes' | 'no' | 'pending') => Promise<void>;
}

export function ComplianceItem({ item, onUpdateStatus }: ComplianceItemProps) {
  const { language } = useLanguage();
  const text = language === 'en' ? item.textEn : item.textAr;

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

  return (
    <Card className={`border-2 ${getStatusColor(item.status)}`}>
      <CardContent className="p-4">
        <div className={`flex justify-between items-start gap-4 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
          <div className={`flex-1 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
            <div className="font-medium mb-1">{item.ruleId}</div>
            <p className="text-sm text-gray-600">{text}</p>
            <div className="text-xs text-gray-400 mt-1">{item.documentRef}</div>
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
      </CardContent>
    </Card>
  );
}
