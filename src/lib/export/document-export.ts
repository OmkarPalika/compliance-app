import ExcelJS from 'exceljs';
import { Document, ComplianceItem } from '@/types/documents';

interface ExportOptions {
  format: 'excel' | 'pdf' | 'json';
  language: 'en' | 'ar';
  includeMetadata?: boolean;
}

export async function generateExcelExport(
  document: Document, 
  options: ExportOptions
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Compliance Checklist');

  // Set RTL if Arabic
  if (options.language === 'ar') {
    worksheet.views = [{ rightToLeft: true }];
  }

  // Add headers
  worksheet.columns = [
    { header: options.language === 'en' ? 'Rule ID' : 'معرف القاعدة', key: 'ruleId', width: 15 },
    { header: options.language === 'en' ? 'Rule' : 'القاعدة', key: 'text', width: 60 },
    { header: options.language === 'en' ? 'Status' : 'الحالة', key: 'status', width: 15 },
    { header: options.language === 'en' ? 'Category' : 'الفئة', key: 'category', width: 20 },
    { header: options.language === 'en' ? 'Reference' : 'المرجع', key: 'reference', width: 20 },
  ];

  // Style the header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // Add data rows
  document.items.forEach((item: ComplianceItem) => {
    worksheet.addRow({
      ruleId: item.ruleId,
      text: options.language === 'en' ? item.textEn : item.textAr,
      status: translateStatus(item.status, options.language),
      category: item.category,
      reference: item.documentRef,
    });
  });

  // Add metadata if requested
  if (options.includeMetadata) {
    const metadataSheet = workbook.addWorksheet('Metadata');
    metadataSheet.columns = [
      { header: options.language === 'en' ? 'Property' : 'الخاصية', key: 'property', width: 20 },
      { header: options.language === 'en' ? 'Value' : 'القيمة', key: 'value', width: 40 },
    ];

    const totalItems = document.items.length;
    const completedItems = document.items.filter(item => item.status !== 'pending').length;
    const completionRate = ((completedItems / totalItems) * 100).toFixed(1);

    metadataSheet.addRows([
      { property: options.language === 'en' ? 'Document Title' : 'عنوان المستند', value: document.title },
      { property: options.language === 'en' ? 'Upload Date' : 'تاريخ الرفع', value: new Date(document.uploadDate).toLocaleDateString() },
      { property: options.language === 'en' ? 'Total Rules' : 'إجمالي القواعد', value: totalItems },
      { property: options.language === 'en' ? 'Completed Rules' : 'القواعد المكتملة', value: completedItems },
      { property: options.language === 'en' ? 'Completion Rate' : 'معدل الإنجاز', value: `${completionRate}%` },
    ]);
  }

  // Generate buffer
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

function translateStatus(status: string, language: 'en' | 'ar'): string {
  const statusMap: Record<string, { en: string; ar: string }> = {
    'yes': { en: 'Compliant', ar: 'متوافق' },
    'no': { en: 'Non-Compliant', ar: 'غير متوافق' },
    'pending': { en: 'Pending', ar: 'قيد المراجعة' },
  };

  return statusMap[status]?.[language] || status;
}

export async function generateJSONExport(
  document: Document, 
  options: ExportOptions
): Promise<string> {
  const exportData = {
    title: document.title,
    uploadDate: document.uploadDate,
    language: document.language,
    items: document.items.map(item => ({
      ruleId: item.ruleId,
      text: options.language === 'en' ? item.textEn : item.textAr,
      status: item.status,
      category: item.category,
      reference: item.documentRef,
    })),
    metadata: options.includeMetadata ? {
      totalItems: document.items.length,
      completedItems: document.items.filter(item => item.status !== 'pending').length,
      language: options.language,
    } : undefined,
  };

  return JSON.stringify(exportData, null, 2);
}
