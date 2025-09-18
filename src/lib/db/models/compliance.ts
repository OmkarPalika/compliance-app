import mongoose from 'mongoose';

const changeHistorySchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  previousText: { type: String, required: true },
  newText: { type: String, required: true }
});

const complianceItemSchema = new mongoose.Schema({
  ruleId: { type: String, required: true },
  docRef: { type: String, required: true },
  textEn: { type: String, required: true },
  textAr: { type: String, default: '', required: false },
  status: { type: String, enum: ['yes', 'no', 'pending'], default: 'pending' },
  category: { type: String, required: true },
  parent: { type: String, default: null },
  parentText: { type: String },
  version: { type: Number, default: 1 },
  changes: [changeHistorySchema]
}, { 
  strict: false // Allow flexible document structure
});

const documentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fileName: { type: String, required: true },
  language: { type: String, enum: ['en', 'ar'], required: true },
  uploadDate: { type: Date, default: Date.now },
  archived: { type: Boolean, default: false },
  items: [complianceItemSchema],
});

// Clear existing models to prevent duplicate model errors
if (mongoose.models.Document) {
  delete mongoose.models.Document;
}
if (mongoose.models.User) {
  delete mongoose.models.User;
}

// Interface for compliance item in the document
interface IComplianceItem {
  ruleId: string;
  docRef: string;
  textEn: string;
  textAr?: string;
  status: 'yes' | 'no' | 'pending';
  category: string;
  parent: string | null;
  parentText?: string;
  version: number;
  changes?: Array<{
    date: Date;
    previousText: string;
    newText: string;
    language: 'en' | 'ar';
  }>;
}

// Interface for document instance
interface IDocument extends mongoose.Document {
  language: 'en' | 'ar';
  title: string;
  uploadedBy: mongoose.Types.ObjectId;
  fileName: string;
  uploadDate: Date;
  archived: boolean;
  items: IComplianceItem[];
}

// Pre-save middleware to handle document validation
documentSchema.pre('save', function(this: IDocument, next) {
  // For English documents, ensure textAr exists but can be empty
  if (this.language === 'en') {
    this.items = this.items.map(item => ({
      ...item,
      textAr: item.textAr || ''
    }));
  }
  
  next();
});

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['admin', 'user', 'viewer'], default: 'user' },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  lastLogin: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

// Export models if they don't already exist
export const User = mongoose.models.User || mongoose.model('User', userSchema);
export const Document = mongoose.models.Document || mongoose.model('Document', documentSchema);
