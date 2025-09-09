import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { documentIds, format, language } = await request.json();

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json({ error: 'Document IDs are required' }, { status: 400 });
    }

    // Mock documents - replace with actual DB query
    const documents = documentIds.map((id: string) => ({
      _id: id,
      title: `Document ${id}`,
      uploadDate: new Date().toISOString(),
      language: language || 'en',
      items: [],
    }));

    let exportData: Buffer | string;
    let contentType: string;
    let filename: string;

    if (format === 'excel') {
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.default.Workbook();

      for (const document of documents) {
        const worksheet = workbook.addWorksheet(document.title.substring(0, 31));
        
        worksheet.columns = [
          { header: language === 'en' ? 'Rule ID' : 'معرف القاعدة', key: 'ruleId', width: 15 },
          { header: language === 'en' ? 'Rule' : 'القاعدة', key: 'text', width: 60 },
          { header: language === 'en' ? 'Status' : 'الحالة', key: 'status', width: 15 },
        ];

        worksheet.getRow(1).font = { bold: true };
      }

      exportData = Buffer.from(await workbook.xlsx.writeBuffer());
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      filename = 'compliance-batch-export.xlsx';
    } else {
      const jsonData = {
        exportDate: new Date().toISOString(),
        language,
        documents: documents.map(doc => ({
          id: doc._id,
          title: doc.title,
          uploadDate: doc.uploadDate,
          items: doc.items,
        })),
      };

      exportData = JSON.stringify(jsonData, null, 2);
      contentType = 'application/json';
      filename = 'compliance-batch-export.json';
    }

    return new NextResponse(exportData as BodyInit, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}