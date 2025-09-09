'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/components/ui/use-toast';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';

interface BatchExportProps {
  documentIds: string[];
  onExportComplete?: () => void;
}

export function BatchExport({ documentIds, onExportComplete }: BatchExportProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [format, setFormat] = useState<'excel' | 'json'>('excel');
  const [options, setOptions] = useState({
    includeMetadata: true,
    includeProgress: true,
    separateSheets: false,
  });

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/documents/batch-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentIds,
          format,
          language,
          options,
        }),
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `compliance-batch-export.${format === 'excel' ? 'xlsx' : 'json'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: language === 'en' ? 'Export completed' : 'تم التصدير',
        description: language === 'en' 
          ? `${documentIds.length} documents exported successfully`
          : `تم تصدير ${documentIds.length} مستند بنجاح`,
      });

      setIsOpen(false);
      onExportComplete?.();
    } catch {
      toast({
        title: language === 'en' ? 'Export failed' : 'فشل التصدير',
        description: language === 'en' ? 'Failed to export documents' : 'فشل في تصدير المستندات',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={documentIds.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          {language === 'en' 
            ? `Export ${documentIds.length} selected`
            : `تصدير ${documentIds.length} محدد`}
        </Button>
      </DialogTrigger>
      
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {language === 'en' ? 'Batch Export Options' : 'خيارات التصدير المجمع'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium mb-2 block">
              {language === 'en' ? 'Export Format' : 'تنسيق التصدير'}
            </label>
            <Select value={format} onValueChange={(value: 'excel' | 'json') => setFormat(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excel">
                  <div className="flex items-center">
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    {language === 'en' ? 'Excel (.xlsx)' : 'إكسل (.xlsx)'}
                  </div>
                </SelectItem>
                <SelectItem value="json">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    {language === 'en' ? 'JSON (.json)' : 'جيسون (.json)'}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium">
              {language === 'en' ? 'Export Options' : 'خيارات التصدير'}
            </label>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="metadata"
                checked={options.includeMetadata}
                onCheckedChange={(checked) => 
                  setOptions(prev => ({ ...prev, includeMetadata: !!checked }))
                }
              />
              <label htmlFor="metadata" className="text-sm">
                {language === 'en' ? 'Include metadata' : 'تضمين البيانات الوصفية'}
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="progress"
                checked={options.includeProgress}
                onCheckedChange={(checked) => 
                  setOptions(prev => ({ ...prev, includeProgress: !!checked }))
                }
              />
              <label htmlFor="progress" className="text-sm">
                {language === 'en' ? 'Include progress statistics' : 'تضمين إحصائيات التقدم'}
              </label>
            </div>
            
            {format === 'excel' && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sheets"
                  checked={options.separateSheets}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, separateSheets: !!checked }))
                  }
                />
                <label htmlFor="sheets" className="text-sm">
                  {language === 'en' ? 'Separate sheets per document' : 'أوراق منفصلة لكل مستند'}
                </label>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              {language === 'en' ? 'Cancel' : 'إلغاء'}
            </Button>
            <Button onClick={handleExport} disabled={isExporting}>
              {isExporting ? (
                language === 'en' ? 'Exporting...' : 'جاري التصدير...'
              ) : (
                language === 'en' ? 'Export' : 'تصدير'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}