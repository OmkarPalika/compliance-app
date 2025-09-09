import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Document } from "@/lib/db/models/compliance";
import { generateExcelExport, generateJSONExport } from "@/lib/export/document-export";
import { Types } from "mongoose";

interface DocumentType {
  _id: Types.ObjectId;
  title: string;
  uploadedBy: Types.ObjectId;
  fileName: string;
  language: 'en' | 'ar';
  uploadDate: Date;
  items: Array<{
    _id: Types.ObjectId;
    ruleId: string;
    textEn: string;
    textAr: string;
    status: 'yes' | 'no' | 'pending';
    category: string;
    documentRef: string;
  }>;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { format, language, includeMetadata } = await request.json();

    if (!format || !language) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const { documentId } = await params;
    await connectToDatabase();
    const document = await Document.findById(documentId).lean() as DocumentType | null;

    if (!document) {
      return new NextResponse("Document not found", { status: 404 });
    }

    // Check if user has access to this document
    if (document.uploadedBy.toString() !== session.user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    let exportData: Buffer | string;
    let fileName: string;
    let contentType: string;

    // Transform document to match export function expectations
    const exportDocument = {
      _id: document._id.toString(),
      title: document.title,
      uploadedBy: document.uploadedBy.toString(),
      fileName: document.fileName,
      language: document.language,
      uploadDate: document.uploadDate.toISOString(),
      items: document.items.map(item => ({
        _id: item._id?.toString() || '',
        ruleId: item.ruleId,
        textEn: item.textEn,
        textAr: item.textAr,
        status: item.status,
        category: item.category,
        documentRef: item.documentRef
      }))
    };

    switch (format) {
      case 'excel':
        exportData = await generateExcelExport(exportDocument, { format, language, includeMetadata });
        fileName = `compliance-checklist-${document._id}.xlsx`;
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;

      case 'json':
        exportData = await generateJSONExport(exportDocument, { format, language, includeMetadata });
        fileName = `compliance-checklist-${document._id}.json`;
        contentType = 'application/json';
        break;

      default:
        return new NextResponse("Unsupported format", { status: 400 });
    }

    // Set response headers for file download
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Disposition', `attachment; filename="${fileName}"`);

    return new NextResponse(exportData as BodyInit, { headers });
  } catch (error) {
    console.error("Export error:", error);
    return new NextResponse(
      JSON.stringify({ 
        success: false, 
        message: "Failed to export document",
        error: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
