import mongoose, { Model, Schema } from 'mongoose';
import { IUser } from './user.model';

interface MultilingualText {
  en: string;
  ar: string;
}

export interface IComplianceItem {
  _id: mongoose.Types.ObjectId;
  ruleId: string;
  text: MultilingualText;
  status: 'yes' | 'no' | 'pending';
  category: string;
  section: string;
  priority: 'high' | 'medium' | 'low';
  notes?: MultilingualText;
  evidence?: string[];
  updatedBy?: mongoose.Types.ObjectId | IUser;
  updatedAt?: Date;
}

export interface IMetadata {
  totalItems: number;
  completedItems: number;
  progress: number;
  itemsByCategory: Record<string, number>;
  itemsByStatus: {
    yes: number;
    no: number;
    pending: number;
  };
  itemsByPriority: {
    high: number;
    medium: number;
    low: number;
  };
}

export interface IDocument {
  _id: mongoose.Types.ObjectId;
  title: MultilingualText;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedBy: mongoose.Types.ObjectId | IUser;
  uploadDate: Date;
  items: IComplianceItem[];
  status: 'active' | 'archived';
  metadata: IMetadata;
  lastModified: Date;
  lastModifiedBy: mongoose.Types.ObjectId | IUser;
  version: number;
  hash: string;
}

const multilingualTextSchema = new Schema<MultilingualText>({
  en: {
    type: String,
    required: true,
  },
  ar: {
    type: String,
    required: true,
  },
}, { _id: false });

const metadataSchema = new Schema<IMetadata>({
  totalItems: {
    type: Number,
    default: 0,
  },
  completedItems: {
    type: Number,
    default: 0,
  },
  progress: {
    type: Number,
    default: 0,
  },
  itemsByCategory: {
    type: Map,
    of: Number,
    default: {},
  },
  itemsByStatus: {
    yes: { type: Number, default: 0 },
    no: { type: Number, default: 0 },
    pending: { type: Number, default: 0 },
  },
  itemsByPriority: {
    high: { type: Number, default: 0 },
    medium: { type: Number, default: 0 },
    low: { type: Number, default: 0 },
  },
}, { _id: false });

const complianceItemSchema = new Schema<IComplianceItem>({
  ruleId: {
    type: String,
    required: true,
  },
  text: {
    type: multilingualTextSchema,
    required: true,
  },
  status: {
    type: String,
    enum: ['yes', 'no', 'pending'],
    default: 'pending',
  },
  category: {
    type: String,
    required: true,
  },
  section: {
    type: String,
    required: true,
  },
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium',
  },
  notes: multilingualTextSchema,
  evidence: [String],
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  updatedAt: Date,
});

const documentSchema = new Schema<IDocument>({
  title: {
    type: multilingualTextSchema,
    required: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  fileType: {
    type: String,
    required: true,
  },
  fileSize: {
    type: Number,
    required: true,
  },
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  uploadDate: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
  items: [complianceItemSchema],
  status: {
    type: String,
    enum: ['active', 'archived'],
    default: 'active',
  },
  metadata: {
    type: metadataSchema,
    default: () => ({}),
  },
  lastModified: {
    type: Date,
    default: Date.now,
  },
  lastModifiedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  version: {
    type: Number,
    default: 1,
  },
  hash: {
    type: String,
    required: true,
  },
});

// Middleware to update metadata and lastModified
documentSchema.pre('save', function(next) {
  // Update lastModified date
  this.lastModified = new Date();

  // Skip metadata update if items haven't changed
  if (!this.isModified('items')) {
    return next();
  }

  // Calculate metadata
  const totalItems = this.items.length;
  const completedItems = this.items.filter(item => item.status !== 'pending').length;
  const itemsByCategory: Record<string, number> = {};
  const itemsByStatus = { yes: 0, no: 0, pending: 0 };
  const itemsByPriority = { high: 0, medium: 0, low: 0 };

  this.items.forEach(item => {
    // Count by category
    itemsByCategory[item.category] = (itemsByCategory[item.category] || 0) + 1;
    
    // Count by status
    itemsByStatus[item.status]++;
    
    // Count by priority
    itemsByPriority[item.priority]++;
  });

  this.metadata = {
    totalItems,
    completedItems,
    progress: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
    itemsByCategory,
    itemsByStatus,
    itemsByPriority,
  };

  // Increment version number
  this.version++;

  next();
});

// Ensure ruleIds are unique within a document
documentSchema.path('items').validate(function(items: IComplianceItem[]) {
  const ruleIds = new Set();
  return items.every(item => {
    if (ruleIds.has(item.ruleId)) return false;
    ruleIds.add(item.ruleId);
    return true;
  });
}, 'Rule IDs must be unique within a document');

// Add text indexes for search in both languages
documentSchema.index({
  'title.en': 'text',
  'title.ar': 'text',
  'items.text.en': 'text',
  'items.text.ar': 'text',
  'items.notes.en': 'text',
  'items.notes.ar': 'text',
}, {
  weights: {
    'title.en': 10,
    'title.ar': 10,
    'items.text.en': 5,
    'items.text.ar': 5,
    'items.notes.en': 1,
    'items.notes.ar': 1,
  },
  default_language: 'none',
});

// Add indexes for common queries
documentSchema.index({ status: 1, uploadedBy: 1 });
documentSchema.index({ 'items.category': 1 });
documentSchema.index({ 'items.status': 1 });
documentSchema.index({ uploadDate: -1 });
documentSchema.index({ hash: 1 });

export type DocumentModel = Model<IDocument>;
export const Document = (mongoose.models.Document || mongoose.model<IDocument>('Document', documentSchema)) as DocumentModel;
