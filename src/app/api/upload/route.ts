import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Document } from "@/lib/db/models/compliance";
import { parsePDFContent, convertToComplianceItems } from "@/lib/pdf/pdf-parser";
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

    // Read and parse the PDF file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    let parsedDocument;
    try {
      parsedDocument = await parsePDFContent(buffer);
    } catch (parseError) {
      console.error("PDF parsing error:", parseError);
      return NextResponse.json({
        success: false,
        message: "Failed to parse PDF file",
        error: parseError instanceof Error ? parseError.message : "Unknown parsing error"
      }, { status: 400 });
    }

    // Convert parsed content to compliance items
    const items = convertToComplianceItems(parsedDocument);
    
    if (items.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No compliance items found in the document"
      }, { status: 400 });
    }

    await connectToDatabase();
    
    const document = await Document.create({
      title: parsedDocument.title || file.name,
      fileName: file.name,
      language,
      uploadedBy: session.user.id,
      items,
    });

    return NextResponse.json({ 
      success: true,
      documentId: document._id,
      message: "Document uploaded and processed successfully",
      summary: {
        totalRules: items.length,
        sections: parsedDocument.sections.length,
      }
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ 
      success: false,
      message: "Failed to process document",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
