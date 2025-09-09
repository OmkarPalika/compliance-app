'use client';

import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useLanguage } from '@/contexts/language-context';
import { Download } from 'lucide-react';

interface ExportButtonProps {
  documentId: string;
}

export function ExportButton({ documentId }: ExportButtonProps) {
  const { language } = useLanguage();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: 'excel' | 'json') => {
    try {
      setIsExporting(true);

      const response = await fetch(`/api/documents/${documentId}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format,
          language,
          includeMetadata: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Get the filename from the Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const fileName = contentDisposition
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : `compliance-checklist-${documentId}.${format === 'excel' ? 'xlsx' : 'json'}`;

      // Create a blob from the response and download it
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
      // You might want to show an error toast here
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting}>
          <Download className="h-4 w-4 mr-2" />
          {language === 'en' ? 'Export' : 'تصدير'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('excel')}>
          {language === 'en' ? 'Export as Excel' : 'تصدير كملف Excel'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('json')}>
          {language === 'en' ? 'Export as JSON' : 'تصدير كملف JSON'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
