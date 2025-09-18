interface PDFText {
  R: Array<{
    T: string;
    S?: number;
    TS?: number[];
  }>;
  x?: number;
  y?: number;
  w?: number;
  sw?: number;
  A?: string;
  R_?: string[];
}

interface PDFLine {
  x: number;
  y: number;
  w: number;
  l: number;
  oc?: string;
}

interface PDFFill {
  x: number;
  y: number;
  w: number;
  h: number;
  oc?: string;
  clr?: number;
}

export interface PDFOutput {
  Pages: Array<{
    Texts: Array<{
      R: Array<{ T: string; S?: number }>;
      x?: number;
      y?: number;
    }>;
    Fields?: Array<{
      id?: { Id: string };
      TI?: number;
      T?: { Name: string };
      x?: number;
      y?: number;
      w?: number;
      h?: number;
      V?: string;
    }>;
  }>;
}

interface PDFField {
  id?: { Id: string };
  TI?: number;
  T?: { Name: string };
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  V?: string;
}

interface PDFBoxset {
  box?: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  boxes?: Array<{
    x: number;
    y: number;
    w: number;
    h: number;
  }>;
}

interface PDFPage {
  Width?: number;
  Height?: number;
  HLines?: PDFLine[];
  VLines?: PDFLine[];
  Fills?: PDFFill[];
  Texts: PDFText[];
  Fields?: PDFField[];
  Boxsets?: PDFBoxset[];
}

interface PDFMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  creator?: string;
  producer?: string;
  creationDate?: string;
  modDate?: string;
  trapped?: string;
}

export interface PDFData {
  Pages: PDFPage[];
  Width?: number;
  Height?: number;
  Meta?: {
    PDFFormatVersion?: string;
    IsAcroFormPresent?: boolean;
    IsXFAPresent?: boolean;
    Creator?: string;
    Producer?: string;
    CreationDate?: string;
    ModDate?: string;
    Metadata?: PDFMetadata;
  };
}

export interface PDFParserError {
  parserError: string;
  code?: string;
  message?: string;
  stack?: string;
}
