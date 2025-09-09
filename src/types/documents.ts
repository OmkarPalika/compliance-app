export interface ComplianceItem {
  _id: string;
  ruleId: string;
  textEn: string;
  textAr: string;
  status: 'yes' | 'no' | 'pending';
  category: string;
  documentRef: string;
}

export interface Document {
  _id: string;
  title: string;
  uploadedBy: string;
  fileName: string;
  language: 'en' | 'ar';
  uploadDate: string;
  items: ComplianceItem[];
}

export interface DocumentWithProgress extends Document {
  progress: {
    total: number;
    completed: number;
    percentage: number;
  };
}

export type FilterStatus = 'all' | 'complete' | 'incomplete';

export interface DocumentQueryResult {
  documents: Document[];
  total: number;
  currentPage: number;
  totalPages: number;
}
