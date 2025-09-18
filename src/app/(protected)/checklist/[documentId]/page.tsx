import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Document } from "@/lib/db/models/compliance";
import { Checklist } from "@/components/checklist/checklist";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ExportButton } from "@/components/documents/export-button";

interface ChecklistPageProps {
  params: Promise<{
    documentId: string;
  }>;
}

export default async function ChecklistPage({ params }: ChecklistPageProps) {
  // In Next.js (App Router) params can be a dynamic API that must be awaited
  const { documentId } = await params;

  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return notFound();
  }

  await connectToDatabase();
  // Use lean() to avoid passing Mongoose Documents (which are not serializable)
  const doc = await Document.findById(documentId).lean();

  if (!doc) {
    return notFound();
  }

  // Type for the lean document result
  interface LeanDocument {
    _id: unknown;
    title: string;
    language: 'en' | 'ar';
    uploadDate: Date;
    items?: Array<{
      _id: unknown;
      ruleId: string;
      docRef: string;
      textEn: string;
      textAr?: string;
      status: 'yes' | 'no' | 'pending';
      category: string;
      parent?: string | null;
      parentText?: string;
      version?: number;
      changes?: Array<{
        date: Date;
        previousText: string;
        newText: string;
      }>;
    }>;
  }

  const typedDoc = doc as unknown as LeanDocument;

  // Normalize data for client components - properly serialize all MongoDB objects
  const safeDocument = {
    title: typedDoc.title,
    language: typedDoc.language,
    items: (typedDoc.items || []).map((item) => ({
      _id: item._id?.toString?.() ?? String(item._id),
      ruleId: item.ruleId,
      textEn: item.textEn,
      textAr: item.textAr ?? "",
      status: item.status,
      category: item.category,
      parent: item.parent || null,
      parentText: item.parentText,
      version: item.version || 1,
      changes: (item.changes || []).map((change) => ({
        date: change.date?.toISOString?.() ?? new Date().toISOString(),
        previousText: change.previousText,
        newText: change.newText,
      })),
      // Map schema field docRef -> UI expected documentRef
      documentRef: item.docRef,
      // Pass document language to each item
      language: typedDoc.language,
    })),
  };

  async function updateItemStatus(itemId: string, status: 'yes' | 'no' | 'pending') {
    'use server';
    
    await connectToDatabase();
    await Document.updateOne(
      { _id: documentId, "items._id": itemId },
      { $set: { "items.$.status": status } }
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">{safeDocument.title}</h1>
          <div className="flex items-center gap-4">
            <ExportButton documentId={documentId} />
            <LanguageSwitcher />
          </div>
        </div>

        <Checklist
          items={safeDocument.items}
          onUpdateStatus={updateItemStatus}
        />
      </div>
    </div>
  );
}