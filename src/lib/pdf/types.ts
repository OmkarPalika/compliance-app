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

export interface ParsedDocument {
  title: string;
  language: 'en' | 'ar';
  sections: ParsedSection[];
}

export interface ComplianceItem {
  ruleId: string;
  textEn: string;
  textAr: string;
  status: 'pending' | 'compliant' | 'non-compliant';
  category: string;
  documentRef: string;
}
