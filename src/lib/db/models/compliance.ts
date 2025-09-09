import mongoose from 'mongoose';

const complianceItemSchema = new mongoose.Schema({
  ruleId: { type: String, required: true },
  textEn: { type: String, required: true },
  textAr: { type: String, required: true },
  status: { type: String, enum: ['yes', 'no', 'pending'], default: 'pending' },
  category: { type: String, required: true },
  documentRef: { type: String, required: true },
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
