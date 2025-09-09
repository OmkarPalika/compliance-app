'use client';

import { useCallback, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/language-context';
import { ArrowUpDown, Download } from 'lucide-react';

interface SearchAndFilterProps {
  onSearch: (search: string) => void;
  onFilterChange: (filter: string) => void;
  onSortChange: (sort: string) => void;
  onBatchExport?: (documentIds: string[]) => void;
  totalDocuments: number;
  selectedDocuments?: string[];
}

export function SearchAndFilter({ 
  onSearch, 
  onFilterChange, 
  onSortChange,
  onBatchExport,
  totalDocuments,
  selectedDocuments = []
}: SearchAndFilterProps) {
  const { language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value);
  }, [onSearch]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">
          {language === 'en' 
            ? `${totalDocuments} Documents`
            : `${totalDocuments} مستند`}
        </h2>
        
        {selectedDocuments.length > 0 && onBatchExport && (
          <Button 
            onClick={() => onBatchExport(selectedDocuments)}
            variant="outline"
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            {language === 'en' 
              ? `Export ${selectedDocuments.length} selected`
              : `تصدير ${selectedDocuments.length} محدد`}
          </Button>
        )}
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder={language === 'en' ? "Search documents..." : "البحث في المستندات..."}
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full"
          />
        </div>
        
        <Select onValueChange={onFilterChange} defaultValue="all">
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder={language === 'en' ? "Filter by status" : "تصفية حسب الحالة"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {language === 'en' ? "All Documents" : "جميع المستندات"}
            </SelectItem>
            <SelectItem value="complete">
              {language === 'en' ? "Completed" : "مكتمل"}
            </SelectItem>
            <SelectItem value="incomplete">
              {language === 'en' ? "In Progress" : "قيد التنفيذ"}
            </SelectItem>
            <SelectItem value="archived">
              {language === 'en' ? "Archived" : "مؤرشف"}
            </SelectItem>
          </SelectContent>
        </Select>
        
        <Select onValueChange={onSortChange} defaultValue="date-desc">
          <SelectTrigger className="w-full sm:w-[180px]">
            <ArrowUpDown className="h-4 w-4 mr-2" />
            <SelectValue placeholder={language === 'en' ? "Sort by" : "ترتيب حسب"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date-desc">
              {language === 'en' ? "Newest first" : "الأحدث أولاً"}
            </SelectItem>
            <SelectItem value="date-asc">
              {language === 'en' ? "Oldest first" : "الأقدم أولاً"}
            </SelectItem>
            <SelectItem value="title-asc">
              {language === 'en' ? "Title A-Z" : "العنوان أ-ي"}
            </SelectItem>
            <SelectItem value="title-desc">
              {language === 'en' ? "Title Z-A" : "العنوان ي-أ"}
            </SelectItem>
            <SelectItem value="progress-desc">
              {language === 'en' ? "Progress high-low" : "التقدم عالي-منخفض"}
            </SelectItem>
            <SelectItem value="progress-asc">
              {language === 'en' ? "Progress low-high" : "التقدم منخفض-عالي"}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
