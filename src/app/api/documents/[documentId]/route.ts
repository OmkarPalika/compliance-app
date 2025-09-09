import { NextRequest, NextResponse } from 'next/server';
import { deleteDocument } from '@/lib/db/operations';

interface RouteParams {
  params: {
    documentId: string;
  };
}

export async function DELETE(request: NextRequest, context: RouteParams) {
  try {
    const { documentId } = context.params;
    
    await deleteDocument(documentId);

    return NextResponse.json({ 
      success: true, 
      message: 'Document deleted successfully' 
    });
  } catch (error) {
    console.error('Failed to delete document:', error);
    return NextResponse.json({ error: 'Delete operation failed' }, { status: 500 });
  }
}