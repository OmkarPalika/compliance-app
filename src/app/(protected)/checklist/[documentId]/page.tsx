import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Document } from "@/lib/db/models/compliance";
import { Checklist } from "@/components/checklist/checklist";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ExportButton } from "@/components/documents/export-button";

interface ChecklistPageProps {
  params: {
    documentId: string;
  };
}

export default async function ChecklistPage({ params }: ChecklistPageProps) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return notFound();
  }

  await connectToDatabase();
  const document = await Document.findById(params.documentId);

  if (!document) {
    return notFound();
  }

  async function updateItemStatus(itemId: string, status: 'yes' | 'no' | 'pending') {
    'use server';
    
    await connectToDatabase();
    await Document.updateOne(
      { _id: params.documentId, "items._id": itemId },
      { $set: { "items.$.status": status } }
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">{document.title}</h1>
          <div className="flex items-center gap-4">
            <ExportButton documentId={params.documentId} />
            <LanguageSwitcher />
          </div>
        </div>

        <Checklist
          items={document.items}
          onUpdateStatus={updateItemStatus}
        />
      </div>
    </div>
  );
}
