import mongoose, { FilterQuery } from 'mongoose';
import { Document, IDocument } from '@/lib/db/models/document.model';
import { User, IUser } from '@/lib/db/models/user.model';
import connectDB from '@/lib/db/connect';

interface DocumentQuery extends FilterQuery<IDocument> {
  uploadedBy: mongoose.Types.ObjectId | string;
  status?: string;
  language?: string;
  'items.category'?: string;
  $text?: { $search: string };
}

export class DatabaseService {
  private static instance: DatabaseService;

  private constructor() {}

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  // Initialize database connection
  async connect() {
    await connectDB();
  }

  // Document Operations
  async createDocument(data: Partial<IDocument>): Promise<IDocument> {
    await this.connect();
    const document = new Document({
      ...data,
      lastModified: new Date(),
      lastModifiedBy: data.uploadedBy,
    });
    return await document.save();
  }

  async getDocument(id: string): Promise<IDocument | null> {
    await this.connect();
    return await Document.findById(id)
      .populate('uploadedBy', 'name email')
      .populate('lastModifiedBy', 'name email')
      .populate('items.updatedBy', 'name email');
  }

  async getDocuments(userId: string, options: {
    search?: string;
    status?: string;
    language?: 'en' | 'ar';
    category?: string;
    page?: number;
    limit?: number;
    sort?: Record<string, 1 | -1>;
  }): Promise<{ documents: IDocument[]; total: number }> {
    await this.connect();
    
    const {
      search,
      status = 'active',
      language,
      category,
      page = 1,
      limit = 10,
      sort = { uploadDate: -1 }
    } = options;

    const query: DocumentQuery = {
      uploadedBy: new mongoose.Types.ObjectId(userId),
      status,
    };

    if (language) {
      query.language = language;
    }

    if (category) {
      query['items.category'] = category;
    }

    if (search) {
      query.$text = { $search: search };
    }

    const [documents, total] = await Promise.all([
      Document.find(query)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('uploadedBy', 'name email')
        .populate('lastModifiedBy', 'name email')
        .populate('items.updatedBy', 'name email'),
      Document.countDocuments(query),
    ]);

    return { documents, total };
  }

  async updateDocument(id: string, data: Partial<IDocument>, userId: string): Promise<IDocument | null> {
    await this.connect();
    return await Document.findByIdAndUpdate(
      id,
      { 
        ...data, 
        lastModified: new Date(),
        lastModifiedBy: userId
      },
      { new: true }
    ).populate('uploadedBy', 'name email')
     .populate('lastModifiedBy', 'name email')
     .populate('items.updatedBy', 'name email');
  }

  async updateComplianceItems(
    documentId: string,
    updates: Array<{
      itemId: string;
      status: 'yes' | 'no' | 'pending';
      notes?: string;
    }>,
    userId: string
  ): Promise<IDocument | null> {
    await this.connect();
    
    const document = await Document.findById(documentId);
    if (!document) return null;

    updates.forEach(update => {
      const item = document.items.find(item => item._id.toString() === update.itemId);
      if (item) {
        item.status = update.status;
        if (update.notes) item.notes = { en: update.notes, ar: update.notes };
        item.updatedBy = new mongoose.Types.ObjectId(userId);
        item.updatedAt = new Date();
      }
    });

    document.lastModified = new Date();
    document.lastModifiedBy = new mongoose.Types.ObjectId(userId);

    return await document.save();
  }

  async archiveDocument(id: string, userId: string): Promise<IDocument | null> {
    await this.connect();
    return await Document.findByIdAndUpdate(
      id,
      {
        status: 'archived',
        lastModified: new Date(),
        lastModifiedBy: userId,
      },
      { new: true }
    );
  }

  async getDocumentCategories(userId: string): Promise<string[]> {
    await this.connect();
    const categories = await Document.distinct('items.category', {
      uploadedBy: userId,
      status: 'active'
    });
    return categories;
  }

  // User Operations
  async createUser(data: Omit<IUser, 'createdAt' | 'comparePassword'>): Promise<IUser> {
    await this.connect();
    return await User.create(data);
  }

  async getUserByEmail(email: string, includePassword = false): Promise<IUser | null> {
    await this.connect();
    const query = User.findOne({ email });
    return includePassword ? query : query.select('-password');
  }

  async getUserById(id: string): Promise<IUser | null> {
    await this.connect();
    return await User.findById(id).select('-password');
  }

  async updateUser(id: string, data: Partial<IUser>): Promise<IUser | null> {
    await this.connect();
    return await User.findByIdAndUpdate(id, data, { new: true }).select('-password');
  }

  async changeUserPassword(id: string, newPassword: string): Promise<boolean> {
    await this.connect();
    const user = await User.findById(id);
    if (!user) return false;

    user.password = newPassword;
    await user.save();
    return true;
  }

  // Statistics and Analytics
  async getDocumentStats(userId: string): Promise<{
    total: number;
    completed: number;
    inProgress: number;
    archived: number;
    byLanguage: Record<string, number>;
    byCategory: Record<string, number>;
  }> {
    await this.connect();
    
    const [documents, archived] = await Promise.all([
      Document.find({ uploadedBy: userId, status: 'active' }),
      Document.countDocuments({ uploadedBy: userId, status: 'archived' })
    ]);

    interface StatsAccumulator {
      total: number;
      completed: number;
      inProgress: number;
      archived: number;
      byLanguage: Record<string, number>;
      byCategory: Record<string, number>;
    }

    const stats = documents.reduce<StatsAccumulator>(
      (acc, doc) => {
        const totalItems = doc.items.length;
        const completedItems = doc.items.filter(
          (item: { status: string }) => item.status !== 'pending'
        ).length;

        // Update completion stats
        if (completedItems === totalItems) {
          acc.completed++;
        } else if (completedItems > 0) {
          acc.inProgress++;
        }

        // Update language stats based on title languages
        if (doc.title.en) acc.byLanguage['en'] = (acc.byLanguage['en'] || 0) + 1;
        if (doc.title.ar) acc.byLanguage['ar'] = (acc.byLanguage['ar'] || 0) + 1;

        // Update category stats
        doc.items.forEach((item) => {
          acc.byCategory[item.category] = (acc.byCategory[item.category] || 0) + 1;
        });

        return acc;
      },
      {
        total: documents.length,
        completed: 0,
        inProgress: 0,
        archived,
        byLanguage: {},
        byCategory: {}
      }
    );

    return stats;
  }

  async getComplianceStats(documentId: string): Promise<{
    total: number;
    yes: number;
    no: number;
    pending: number;
    byCategory: Record<string, { total: number; completed: number }>;
  }> {
    await this.connect();
    
    const document = await Document.findById(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    interface ComplianceStatsAccumulator {
      total: number;
      yes: number;
      no: number;
      pending: number;
      byCategory: Record<string, { total: number; completed: number }>;
    }

    const stats = document.items.reduce<ComplianceStatsAccumulator>(
      (acc, item: { status: 'yes' | 'no' | 'pending'; category: string }) => {
        // Update status counts
        acc[item.status]++;

        // Update category stats
        if (!acc.byCategory[item.category]) {
          acc.byCategory[item.category] = { total: 0, completed: 0 };
        }
        acc.byCategory[item.category].total++;
        if (item.status !== 'pending') {
          acc.byCategory[item.category].completed++;
        }

        return acc;
      },
      {
        total: document.items.length,
        yes: 0,
        no: 0,
        pending: 0,
        byCategory: {}
      }
    );

    return stats;
  }
}

// Export a singleton instance
export const dbService = DatabaseService.getInstance();
