declare module 'pdf-parse' {
  interface PDFData {
    numpages: number;
    numrender: number;
    info: {
      PDFFormatVersion: string;
      IsAcroFormPresent: boolean;
      IsXFAPresent: boolean;
      [key: string]: unknown;
    };
    metadata: {
      [key: string]: unknown;
    };
    text: string;
    version: string;
  }

  interface PageData {
    pageIndex: number;
    pageInfo: unknown;
    textContent: unknown;
  }

  function PDFParse(dataBuffer: Buffer, options?: {
    pagerender?: (pageData: PageData) => string;
    max?: number;
  }): Promise<PDFData>;

  export = PDFParse;
}
