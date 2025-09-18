import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/mongodb";
import { PDFChecklistParser } from "@/lib/pdf/pdf-checklist-parser";
import { DocumentService } from "@/lib/db/services/document.service";
import { isValidFileType, isValidFileSize, isValidFileExtension } from "@/lib/upload-config";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const language = formData.get("language") as "en" | "ar";

    if (!file || !language) {
      return NextResponse.json({
        success: false,
        message: "Missing required fields"
      }, { status: 400 });
    }

    if (!isValidFileType(file)) {
      return NextResponse.json({
        success: false,
        message: "Invalid file type. Only PDF files are supported."
      }, { status: 400 });
    }

    if (!isValidFileSize(file)) {
      return NextResponse.json({
        success: false,
        message: "File size exceeds the maximum limit of 10MB"
      }, { status: 400 });
    }

    if (!isValidFileExtension(file.name)) {
      return NextResponse.json({
        success: false,
        message: "Invalid file extension. Only .pdf files are supported."
      }, { status: 400 });
    }

    let buffer: Buffer;
    try {
      // Read the file into a buffer
      const bytes = await file.arrayBuffer();
      buffer = Buffer.from(new Uint8Array(bytes));
    } catch (error) {
      console.error('Error reading file:', error);
      return NextResponse.json({
        success: false,
        message: 'Failed to read the uploaded file',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 400 });
    }
    
    // Connect to database before parsing to ensure connection is ready
    await connectToDatabase();
    const documentService = new DocumentService();
    
    const parser = new PDFChecklistParser(buffer);
    
    try {
      const parsedDocument = await parser.parse(file.name, language);
      
      // Always ensure textAr is present (empty string for English)
      parsedDocument.items = parsedDocument.items.map(item => ({
        ...item,
        textAr: item.textAr || ''
      }));
      
      const documentId = await documentService.createDocument(parsedDocument, session.user.id);
      
      if (!parsedDocument.items || parsedDocument.items.length === 0) {
        return NextResponse.json({
          success: false,
          message: "No compliance items found in the document"
        }, { status: 400 });
      }

      return NextResponse.json({ 
        success: true,
        documentId,
        message: "Document uploaded and processed successfully",
        summary: {
          totalRules: parsedDocument.items.length,
          fileName: parsedDocument.fileName,
        }
      });
    } catch (error) {
      console.error("PDF processing error:", error);
      return NextResponse.json({
        success: false,
        message: "Failed to process PDF file",
        error: error instanceof Error ? error.message : "Unknown error"
      }, { status: 500 });
    }

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ 
      success: false,
      message: "Failed to process document",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
