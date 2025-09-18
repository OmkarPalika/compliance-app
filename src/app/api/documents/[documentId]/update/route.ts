import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/mongodb";
import { PDFChecklistParser } from "@/lib/pdf/pdf-checklist-parser";
import { DocumentService } from "@/lib/db/services/document.service";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({
        success: false,
        message: "No file provided"
      }, { status: 400 });
    }

    // Read and parse the PDF file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const parser = new PDFChecklistParser(buffer);
    const documentService = new DocumentService();
    
    await connectToDatabase();

    try {
      const resolvedParams = await params;
      const parsedDocument = await parser.parse(file.name);
      await documentService.updateDocument(resolvedParams.documentId, parsedDocument);

      return NextResponse.json({ 
        success: true,
        message: "Document updated successfully",
        summary: {
          totalRules: parsedDocument.items.length,
          fileName: parsedDocument.fileName,
        }
      });
    } catch (parseError) {
      console.error("PDF processing error:", parseError);
      return NextResponse.json({
        success: false,
        message: "Failed to process PDF file",
        error: parseError instanceof Error ? parseError.message : "Unknown error"
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json({ 
      success: false,
      message: "Failed to update document",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
