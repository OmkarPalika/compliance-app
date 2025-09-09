import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
  request: NextRequest
) {
  try {
    const { archived } = await request.json();
    // Mock archive operation - replace with actual DB update
    // await updateDocument(documentId, { archived });

    return NextResponse.json({ 
      success: true, 
      message: archived ? 'Document archived' : 'Document restored' 
    });
  } catch {
    return NextResponse.json({ error: 'Archive operation failed' }, { status: 500 });
  }
}