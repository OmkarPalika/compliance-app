'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useLanguage } from '@/contexts/language-context';
import { DocumentActions } from '@/components/documents/document-actions';

interface DocumentCardProps {
  document: {
    _id: string;
    title: string;
    language: 'en' | 'ar';
    uploadDate: string;
    items: Array<{ status: 'yes' | 'no' | 'pending' }>;
    archived?: boolean;
  };
  isSelected?: boolean;
  onSelect?: (documentId: string, selected: boolean) => void;
  onDelete?: () => void;
  onArchive?: () => void;
}

export function DocumentCard({ 
  document, 
  isSelected = false, 
  onSelect, 
  onDelete, 
  onArchive 
}: DocumentCardProps) {
  const { language } = useLanguage();
  
  // Calculate completion percentage
  const totalItems = document.items.length;
  const completedItems = document.items.filter(item => item.status !== 'pending').length;
  const completionPercentage = Math.round((completedItems / totalItems) * 100);

  return (
    <Card className={`hover:shadow-md transition-shadow ${isSelected ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {onSelect && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked: boolean) => onSelect(document._id, checked)}
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
              />
            )}
            <Link href={`/checklist/${document._id}`}>
              <CardTitle className={`text-lg hover:underline ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                {document.title}
              </CardTitle>
            </Link>
          </div>
          <DocumentActions
            documentId={document._id}
            isArchived={document.archived}
            onDelete={onDelete}
            onArchive={onArchive}
          />
        </div>
      </CardHeader>
        <CardContent>
          <div className={`flex flex-col gap-2 ${language === 'ar' ? 'items-end' : 'items-start'}`}>
            <div className="text-sm text-muted-foreground">
              {language === 'en' ? 'Uploaded on: ' : 'تم الرفع في: '}
              {new Date(document.uploadDate).toLocaleDateString(language === 'en' ? 'en-US' : 'ar-AE')}
            </div>
            
            <div className="w-full">
              <div className="flex justify-between text-sm mb-1">
                <span>
                  {language === 'en' 
                    ? `${completedItems}/${totalItems} items` 
                    : `${completedItems}/${totalItems} عنصر`}
                </span>
                <span>{completionPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
  );
}
