export interface PDFMetadata {
  PDFFormatVersion: string;
  IsAcroFormPresent: boolean;
  IsXFAPresent: boolean;
  Title?: string;
  Author?: string;
  Subject?: string;
  Keywords?: string;
  Creator?: string;
  Producer?: string;
  CreationDate?: string;
  ModDate?: string;
  [key: string]: string | boolean | undefined;
}

export interface PDFInfo {
  Title?: string;
  Author?: string;
  Subject?: string;
  Keywords?: string;
  Creator?: string;
  Producer?: string;
  CreationDate?: string;
  ModDate?: string;
  [key: string]: string | undefined;
}

export interface PDFData {
  text: string;
  info: PDFInfo;
  metadata: PDFMetadata; 
  version: string;
  numpages: number;
}

export interface ParsedSection {
  id: string;
  title: string;
  content: string[];
  subsections: ParsedSection[];
}

export interface ParsedItem {
  ruleId: string;
  docRef: string;
  textEn: string;
  textAr?: string;
  category: string;
  parent: string | null;
  parentText?: string;
  version?: number;
  changes?: Array<{
    date: Date;
    previousText: string;
    newText: string;
    language: 'en' | 'ar';
  }>;
}

export interface ParsedDocument {
  title: string;
  fileName: string;
  language: 'en' | 'ar';
  items: ParsedItem[];
}

export interface ComplianceItem extends ParsedItem {
  status: 'pending' | 'compliant' | 'non-compliant';
  documentRef: string;
  version: number;
}
