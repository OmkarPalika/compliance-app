import { connectToDatabase } from './mongodb';
import { Document, User } from './models/compliance';
import { ObjectId } from 'mongodb';

// Document operations
export async function getDocuments(filters: {
  search?: string;
  status?: string;
  sort?: string;
  archived?: boolean;
} = {}) {
  await connectToDatabase();
  
  let query: any = {};
  
  if (filters.archived !== undefined) {
    query.archived = filters.archived;
  }
  
  if (filters.search) {
    query.title = { $regex: filters.search, $options: 'i' };
  }
  
  let sortQuery: any = {};
  switch (filters.sort) {
    case 'date-asc': sortQuery = { uploadDate: 1 }; break;
    case 'title-asc': sortQuery = { title: 1 }; break;
    case 'title-desc': sortQuery = { title: -1 }; break;
    default: sortQuery = { uploadDate: -1 };
  }
  
  return await Document.find(query).sort(sortQuery).populate('uploadedBy', 'name email');
}

export async function getDocumentById(id: string) {
  await connectToDatabase();
  return await Document.findById(id).populate('uploadedBy', 'name email');
}

export async function deleteDocument(id: string) {
  await connectToDatabase();
  return await Document.findByIdAndDelete(id);
}

export async function archiveDocument(id: string, archived: boolean) {
  await connectToDatabase();
  return await Document.findByIdAndUpdate(id, { archived }, { new: true });
}

export async function updateItemStatus(documentId: string, itemId: string, status: string) {
  await connectToDatabase();
  return await Document.findOneAndUpdate(
    { _id: documentId, 'items._id': itemId },
    { $set: { 'items.$.status': status } },
    { new: true }
  );
}

// User operations
export async function getUsers(filters: { search?: string; role?: string } = {}) {
  await connectToDatabase();
  
  let query: any = {};
  
  if (filters.search) {
    query.$or = [
      { name: { $regex: filters.search, $options: 'i' } },
      { email: { $regex: filters.search, $options: 'i' } }
    ];
  }
  
  if (filters.role && filters.role !== 'all') {
    query.role = filters.role;
  }
  
  return await User.find(query).sort({ createdAt: -1 });
}

export async function createUser(userData: {
  email: string;
  name: string;
  role: 'admin' | 'user' | 'viewer';
  status: 'active' | 'inactive';
}) {
  await connectToDatabase();
  return await User.create(userData);
}

export async function updateUser(id: string, updates: any) {
  await connectToDatabase();
  return await User.findByIdAndUpdate(id, updates, { new: true });
}

export async function deleteUser(id: string) {
  await connectToDatabase();
  return await User.findByIdAndDelete(id);
}