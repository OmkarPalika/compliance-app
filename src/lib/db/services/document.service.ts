import { Document } from '../models/compliance';
import { ObjectId } from 'mongodb';
import { ParsedDocument, ParsedItem } from '../../pdf/types';

interface DocumentItem extends ParsedItem {
  status: 'yes' | 'no' | 'pending';
  documentRef: string;
  version: number;
  changes?: Array<{
    date: Date;
    previousText: string;
    newText: string;
    language: 'en' | 'ar';
  }>;
}

export class DocumentService {
  public async createDocument(parsedDoc: ParsedDocument, userId: string): Promise<string> {
    // Validate Arabic text requirement for Arabic documents
    if (parsedDoc.language === 'ar') {
      const missingArabicItems = parsedDoc.items.filter(item => !item.textAr);
      if (missingArabicItems.length > 0) {
        throw new Error('Arabic text is required for all items in Arabic documents');
      }
    }

    const document = new Document({
      title: parsedDoc.title,
      uploadedBy: new ObjectId(userId),
      fileName: parsedDoc.fileName,
      language: parsedDoc.language,
      items: parsedDoc.items.map(item => ({
        ...item,
        status: 'pending',
        documentRef: parsedDoc.fileName,
        version: 1,
        textAr: item.textAr || '' // Ensure textAr is always at least an empty string
      }))
    });

    await document.save();
    return document._id.toString();
  }

  public async updateDocument(documentId: string, parsedDoc: ParsedDocument): Promise<void> {
    const existingDoc = await Document.findById(documentId);
    if (!existingDoc) {
      throw new Error('Document not found');
    }

    // Compare existing items with new items to detect changes
    const updatedItems = parsedDoc.items.map((newItem: ParsedItem) => {
      const existingItem = existingDoc.items.find((item: DocumentItem) => 
        item.ruleId === newItem.ruleId || 
        (item.textEn === newItem.textEn && (!item.textAr || item.textAr === newItem.textAr))
      );

      if (existingItem) {
        const hasEnglishChanges = existingItem.textEn !== newItem.textEn;
        const hasArabicChanges = newItem.textAr && existingItem.textAr !== newItem.textAr;

        if (hasEnglishChanges || hasArabicChanges) {
          // Item has changed in either language
          const changes = [
            ...(existingItem.changes || [])
          ];

          if (hasEnglishChanges) {
            changes.push({
              date: new Date(),
              previousText: existingItem.textEn,
              newText: newItem.textEn,
              language: 'en'
            });
          }

          if (hasArabicChanges) {
            changes.push({
              date: new Date(),
              previousText: existingItem.textAr || '',
              newText: newItem.textAr || '',
              language: 'ar'
            });
          }

          return {
            ...existingItem.toObject(),
            textEn: newItem.textEn,
            ...(newItem.textAr && { textAr: newItem.textAr }),
            version: (existingItem.version || 1) + 1,
            changes
          };
        }
        return existingItem;
      }

      // New item
      return {
        ...newItem,
        status: 'pending',
        documentRef: parsedDoc.fileName,
        version: 1,
        changes: []
      };
    });

    await Document.findByIdAndUpdate(documentId, {
      $set: {
        items: updatedItems,
        updatedAt: new Date()
      }
    });
  }

  public async getDocument(documentId: string) {
    return Document.findById(documentId).populate('uploadedBy');
  }
}
