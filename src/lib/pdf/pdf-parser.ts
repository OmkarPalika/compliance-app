import type { PDFData, PDFInfo, PDFMetadata } from './types';
import type { Buffer } from 'buffer';

// Type for pdf-parse module result
interface RawPDFParseResult {
  numpages: number;
  numrender: number;
  info: Record<string, unknown>;
  metadata: Record<string, unknown>;
  text: string;
  version: string;
}

// Type for the pdf-parse module
type PDFParseModule = {
  default: (buffer: Buffer) => Promise<RawPDFParseResult>;
};

let pdfParseModule: PDFParseModule['default'] | null = null;

async function loadPdfParse(): Promise<PDFParseModule['default']> {
  if (!pdfParseModule) {
    try {
      const imported = await import('pdf-parse') as PDFParseModule;
      pdfParseModule = imported.default;
    } catch (error) {
      console.error('Error loading pdf-parse:', error);
      throw new Error('Failed to load PDF parsing module');
    }
  }
  if (!pdfParseModule) {
    throw new Error('PDF parse module failed to load');
  }
  return pdfParseModule;
}

// Helper function to safely convert unknown values to string | undefined
function asStringOrUndefined(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (value === undefined || value === null) return undefined;
  return String(value);
}

// Convert raw PDF result to our typed PDFData format
function convertToPDFData(rawResult: RawPDFParseResult): PDFData {
  const info: PDFInfo = {
    Title: asStringOrUndefined(rawResult.info['Title']),
    Author: asStringOrUndefined(rawResult.info['Author']),
    Subject: asStringOrUndefined(rawResult.info['Subject']),
    Keywords: asStringOrUndefined(rawResult.info['Keywords']),
    Creator: asStringOrUndefined(rawResult.info['Creator']),
    Producer: asStringOrUndefined(rawResult.info['Producer']),
    CreationDate: asStringOrUndefined(rawResult.info['CreationDate']),
    ModDate: asStringOrUndefined(rawResult.info['ModDate'])
  };

  const metadata: PDFMetadata = {
    PDFFormatVersion: String(rawResult.metadata['PDFFormatVersion'] || ''),
    IsAcroFormPresent: Boolean(rawResult.metadata['IsAcroFormPresent']),
    IsXFAPresent: Boolean(rawResult.metadata['IsXFAPresent']),
    Title: asStringOrUndefined(rawResult.metadata['Title']),
    Author: asStringOrUndefined(rawResult.metadata['Author']),
    Subject: asStringOrUndefined(rawResult.metadata['Subject']),
    Keywords: asStringOrUndefined(rawResult.metadata['Keywords']),
    Creator: asStringOrUndefined(rawResult.metadata['Creator']),
    Producer: asStringOrUndefined(rawResult.metadata['Producer']),
    CreationDate: asStringOrUndefined(rawResult.metadata['CreationDate']),
    ModDate: asStringOrUndefined(rawResult.metadata['ModDate'])
  };

  return {
    text: rawResult.text,
    info,
    metadata,
    version: rawResult.version,
    numpages: rawResult.numpages
  };
}

export async function parsePDF(buffer: Buffer): Promise<PDFData> {
  const parse = await loadPdfParse();
  const rawResult = await parse(buffer);
  return convertToPDFData(rawResult);
}

interface ParsedSection {
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

// Regular expressions for section and rule identification
const sectionPatterns = {
  en: {
    section: /^(?:Section|Article|Chapter)\s+(\d+(?:\.\d+)?)\s*[:.-]?\s*(.+)$/i,
    rule: /^(?:\d+(?:\.\d+)*\s*[:.-])?\s*(.+)$/,
  },
  ar: {
    section: /^(?:القسم|المادة|الفصل)\s+(\d+(?:\.\d+)?)\s*[:.-]?\s*(.+)$/i,
    rule: /^(?:\d+(?:\.\d+)*\s*[:.-])?\s*(.+)$/,
  },
};

const stripExtraWhitespace = (text: string): string => {
  return text.replace(/\s+/g, ' ').trim();
};

const isNumberedLine = (line: string): boolean => {
  return /^\d+(?:\.\d+)*\s*[:.)-]/.test(line);
};

const detectLanguage = (text: string): 'en' | 'ar' => {
  // Check for Arabic characters
  const arabicPattern = /[\u0600-\u06FF]/;
  const arabicCount = (text.match(arabicPattern) || []).length;
  const totalLength = text.length;
  
  return arabicCount / totalLength > 0.3 ? 'ar' : 'en';
};

export async function parsePDFContent(buffer: Buffer): Promise<ParsedDocument> {
  try {
    const data = await parsePDF(buffer);
    const lines = data.text.split('\n')
      .map((line: string) => stripExtraWhitespace(line))
      .filter((line: string) => line.length > 0);

    const language = detectLanguage(data.text);
    const patterns = sectionPatterns[language];

    let currentSection: ParsedSection | null = null;
    const sections: ParsedSection[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const sectionMatch = line.match(patterns.section);

      if (sectionMatch) {
        // New section found
        const [, id, title] = sectionMatch;
        currentSection = {
          id: id || `S${sections.length + 1}`,
          title: stripExtraWhitespace(title),
          content: [],
          subsections: [],
        };
        sections.push(currentSection);
      } else if (currentSection) {
        // Check if this is a rule
        const ruleMatch = line.match(patterns.rule);
        if (ruleMatch && (isNumberedLine(line) || line.length > 20)) {
          const ruleContent = stripExtraWhitespace(ruleMatch[1]);
          if (ruleContent) {
            currentSection.content.push(ruleContent);
          }
        }
      }
    }

    return {
      title: extractTitle(data, lines, language),
      language,
      sections,
    };
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error('Failed to parse PDF file');
  }
}

function extractTitle(data: PDFData, lines: string[], language: 'en' | 'ar'): string {
  // First try to get title from PDF metadata
  if (data.info?.Title) {
    return data.info.Title;
  }

  // Then try to find a meaningful title from the first few lines
  const titleCandidates = lines.slice(0, 5).filter(line => 
    line.length > 10 && 
    line.length < 100 &&
    !line.match(/page|copyright|confidential/i)
  );

  return titleCandidates[0] || (language === 'en' ? 'Untitled Document' : 'مستند بدون عنوان');
}

export function convertToComplianceItems(parsed: ParsedDocument) {
  const items = [];
  let itemId = 1;

  for (const section of parsed.sections) {
    // Add section title as a category item if it exists
    if (section.title) {
      items.push({
        ruleId: `RULE-${itemId++}`,
        textEn: parsed.language === 'en' ? section.title : '',
        textAr: parsed.language === 'ar' ? section.title : '',
        status: 'pending',
        category: section.id,
        documentRef: `Section ${section.id}`,
      });
    }

    // Add individual rules
    for (const content of section.content) {
      items.push({
        ruleId: `RULE-${itemId++}`,
        textEn: parsed.language === 'en' ? content : '',
        textAr: parsed.language === 'ar' ? content : '',
        status: 'pending',
        category: section.id,
        documentRef: `Section ${section.id}`,
      });
    }
  }

  return items;
}
