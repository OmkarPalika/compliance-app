'use server';

import { connectToDatabase } from '@/lib/db/mongodb';
import { Document } from '@/lib/db/models/compliance';
import { Types } from 'mongoose';

export type FilterStatus = 'all' | 'complete' | 'incomplete';

interface DocumentType {
  _id: string;
  title: string;
  language: 'en' | 'ar';
  uploadDate: string;
  items: Array<{
    ruleId: string;
    docRef: string;
    textEn: string;
    textAr: string;
    status: 'yes' | 'no' | 'pending';
    category: string;
    parent: string | null;
    parentText?: string;
    version: number;
    changes: Array<{
      date: string;
      previousText: string;
      newText: string;
    }>;
  }>;
  archived?: boolean;
}

interface GetDocumentsOptions {
  userId: string;
  searchTerm?: string;
  status?: FilterStatus;
  page?: number;
  limit?: number;
}

export async function getFilteredDocuments({
  userId,
  searchTerm = '',
  status = 'all',
  page = 1,
  limit = 10
}: GetDocumentsOptions) {
  await connectToDatabase();

  const skip = (page - 1) * limit;
  
  // Base query
  const query: Record<string, unknown> = { uploadedBy: userId };

  // Add search condition if searchTerm is provided
  if (searchTerm) {
    query.title = { $regex: searchTerm, $options: 'i' };
  }

  // Add status condition
  if (status === 'complete') {
    query['items.status'] = { $not: { $eq: 'pending' } };
  } else if (status === 'incomplete') {
    query['items.status'] = 'pending';
  }

  // Execute query with pagination
  const rawDocuments = await Document
    .find(query)
    .sort({ uploadDate: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  // Transform documents to match expected type and serialize all nested objects
  const documents: DocumentType[] = rawDocuments.map(doc => ({
    _id: (doc._id as Types.ObjectId).toString(),
    title: doc.title,
    language: doc.language,
    uploadDate: doc.uploadDate.toISOString(),
    items: doc.items.map((item: any) => ({
      ruleId: item.ruleId,
      docRef: item.docRef,
      textEn: item.textEn,
      textAr: item.textAr || '',
      status: item.status,
      category: item.category,
      parent: item.parent,
      parentText: item.parentText,
      version: item.version,
      changes: item.changes?.map((change: any) => ({
        date: change.date?.toISOString(),
        previousText: change.previousText,
        newText: change.newText
      })) || []
    })),
    archived: doc.archived
  }));

  // Get total count for pagination
  const total = await Document.countDocuments(query);

  return {
    documents,
    total,
    currentPage: page,
    totalPages: Math.ceil(total / limit)
  };
}
