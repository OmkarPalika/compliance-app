import { ParsedDocument, ParsedItem } from './types';
import PDFParser from 'pdf2json';
import type { PDFOutput } from './pdf2json.types';

export class PDFChecklistParser {
  private buffer: Buffer;

  constructor(fileBuffer: Buffer | ArrayBuffer) {
    // Convert ArrayBuffer to Buffer if needed
    if (fileBuffer instanceof ArrayBuffer) {
      this.buffer = Buffer.from(new Uint8Array(fileBuffer));
    } else {
      this.buffer = fileBuffer;
    }
  }

  private async extractText(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      try {
        const pdfParser = new PDFParser();

        pdfParser.on("pdfParser_dataReady", (pdfData: PDFOutput) => {
          try {
            console.log('PDF data ready. Processing pages...');
            
            // Extract text from each page with position information
            const pages = pdfData.Pages.map((page: PDFOutput['Pages'][0], pageIndex: number) => {
              console.log(`Processing page ${pageIndex + 1}`);
              
              // Sort texts by vertical position (y) first, then horizontal (x)
              const sortedTexts = page.Texts.sort((a: PDFOutput['Pages'][0]['Texts'][0], b: PDFOutput['Pages'][0]['Texts'][0]) => {
                const yDiff = (a.y || 0) - (b.y || 0);
                return yDiff !== 0 ? yDiff : (a.x || 0) - (b.x || 0);
              });

              // Group texts by lines based on y-coordinate proximity
              const lines: string[][] = [];
              let currentLine: PDFOutput['Pages'][0]['Texts'] = [];
              let lastY = -1;

              sortedTexts.forEach((text: PDFOutput['Pages'][0]['Texts'][0]) => {
                const y = text.y || 0;
                if (lastY === -1 || Math.abs(y - lastY) < 0.3) { // Adjust threshold as needed
                  currentLine.push(text);
                } else {
                  if (currentLine.length > 0) {
                    lines.push(currentLine.map((t: PDFOutput['Pages'][0]['Texts'][0]) => decodeURIComponent(t.R[0].T)));
                  }
                  currentLine = [text];
                }
                lastY = y;
              });

              if (currentLine.length > 0) {
                lines.push(currentLine.map((t: PDFOutput['Pages'][0]['Texts'][0]) => decodeURIComponent(t.R[0].T)));
              }

              // Join each line with proper spacing
              const pageText = lines
                .map(line => line.join(' '))
                .join('\n');

              console.log(`Page ${pageIndex + 1} text:`, pageText);
              return pageText;
            }).filter((page: string) => page.trim().length > 0);

            if (pages.length === 0) {
              console.error('No text content found in PDF');
              reject(new Error('No text content found in PDF'));
              return;
            }

            resolve(pages);
          } catch (parseError) {
            console.error('Error processing PDF content:', parseError);
            reject(new Error('Failed to process PDF content'));
          }
        });

        pdfParser.on("pdfParser_dataError", (errData: Error | { parserError: Error }) => {
          console.error('PDF Parser error:', errData);
          const errorMessage = errData instanceof Error 
            ? errData.message 
            : errData.parserError.message;
          reject(new Error(`PDF parsing error: ${errorMessage}`));
        });

        // Parse the buffer directly
        console.log('Starting PDF parsing...');
        pdfParser.parseBuffer(this.buffer);
      } catch (error) {
        console.error('Error initializing PDF parser:', error);
        reject(new Error('Failed to initialize PDF parser'));
      }
    });
  }

  private isArabicText(text: string): boolean {
    // Check if text contains Arabic characters
    const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
    return arabicRegex.test(text);
  }

  private isEnglishText(text: string): boolean {
    // Check if text contains primarily Latin characters
    const latinRegex = /[A-Za-z]/;
    const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
    return latinRegex.test(text) && !arabicRegex.test(text);
  }

  private isSectionHeader(line: string, language: 'en' | 'ar'): boolean {
    // Enhanced section header detection
    if (language === 'en') {
      // All caps English headers, chapter titles, section titles
      return line.match(/^[A-Z\d\.\s]{3,}$/) !== null ||
             line.match(/^CHAPTER\s+\d+/i) !== null ||
             line.match(/^SECTION\s+\d+/i) !== null ||
             line.match(/^PART\s+[IVX\d]+/i) !== null ||
             line.match(/^ARTICLE\s+\d+/i) !== null;
    } else {
      // Arabic section headers - look for Arabic text that's standalone and substantial
      return this.isArabicText(line) && 
             line.length > 10 && 
             line.length < 100 &&
             !line.match(/\d+/) &&
             line.split(' ').length < 8;
    }
  }

  private extractNumberedItem(line: string): { ref: string; text: string } | null {
    // More comprehensive numbered item patterns
    const patterns = [
      // Standard numbered items: 1.1, 2.3, 10.15, etc.
      /^(\d+\.\d+)[\s\.:\-]+(.+)/,
      // Chapter/Article numbers: Article 1, Chapter 2, etc.
      /^(?:Article|Chapter|Section)\s+(\d+)[\s\.\-:]*(.+)/i,
      // Dash separated: 21-2, 21-3, etc.
      /^(\d+\-\d+)[\s\.:\-]+(.+)/,
      // Parenthetical numbers: (1), (2), etc.
      /^\((\d+)\)[\s\.:\-]*(.+)/,
      // Simple numbers with content: 1. Content, 2 Content, etc.
      /^(\d+)[\.\s:\-]+(.{10,})/,
      // Sub-items with letters: 1.1.a, 1.1.b, etc.
      /^(\d+\.\d+\.[a-z])[\s\.:\-]*(.+)/i,
      // Complex patterns: 1.19.1, 21.2.3, etc.
      /^(\d+\.\d+\.\d+)[\s\.:\-]*(.+)/,
      // Arabic article patterns
      /ةداملا\s+(\d+)\s*(.+)/,
      // Requirements/obligations indicators
      /^(Requirement\s+\d+|Obligation\s+\d+)[\s\.:\-]*(.+)/i
    ];

    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        const [, ref, text] = match;
        if (text && text.trim().length > 5) {
          return { ref: ref.trim(), text: text.trim() };
        }
      }
    }

    return null;
  }

  private inferCategory(line: string): string {
    // Infer category from content keywords
    const text = line.toLowerCase();
    
    if (text.includes('aml') || text.includes('money laundering') || text.includes('غسل الأموال')) {
      return 'Anti-Money Laundering';
    }
    if (text.includes('cft') || text.includes('terrorism') || text.includes('terrorist financing') || text.includes('إرهاب')) {
      return 'Counter Financing of Terrorism';
    }
    if (text.includes('kyc') || text.includes('know your customer') || text.includes('customer due diligence') || text.includes('اعرف عميلك')) {
      return 'Know Your Customer';
    }
    if (text.includes('record') || text.includes('documentation') || text.includes('سجلات')) {
      return 'Record Keeping';
    }
    if (text.includes('risk') || text.includes('assessment') || text.includes('مخاطر')) {
      return 'Risk Assessment';
    }
    if (text.includes('compliance') || text.includes('امتثال')) {
      return 'Compliance';
    }
    if (text.includes('report') || text.includes('suspicious') || text.includes('مشبوهة')) {
      return 'Reporting';
    }
    if (text.includes('sanction') || text.includes('عقوبات')) {
      return 'Sanctions';
    }
    if (text.includes('cyber') || text.includes('security') || text.includes('أمن سيبراني')) {
      return 'Cybersecurity';
    }
    
    return 'General Compliance';
  }

  private isRegulatoryContent(line: string, language: 'en' | 'ar'): boolean {
    // Check if line contains substantial regulatory content
    if (line.length < 30) return false;
    
    const text = line.toLowerCase();
    const hasRegulatoryTerms = text.includes('must') || text.includes('shall') || text.includes('should') || 
                              text.includes('require') || text.includes('ensure') || text.includes('establish') ||
                              text.includes('implement') || text.includes('maintain') || text.includes('conduct') ||
                              text.includes('comply') || text.includes('obligation') || text.includes('responsibility') ||
                              text.includes('يجب') || text.includes('ينبغي') || text.includes('التزام') || 
                              text.includes('مسؤولية') || text.includes('تطبيق') || text.includes('الامتثال');
    
    const hasComplianceContext = text.includes('financial institution') || text.includes('bank') || 
                                text.includes('customer') || text.includes('transaction') || text.includes('aml') ||
                                text.includes('cft') || text.includes('kyc') || text.includes('cbuae') ||
                                text.includes('مؤسسة مالية') || text.includes('عميل') || text.includes('معاملة');
    
    return hasRegulatoryTerms && hasComplianceContext;
  }

  private extractReference(line: string): string | null {
    // Try to extract any reference numbers from the content
    const patterns = [
      /(\d+\.\d+\.\d+)/,    // 1.2.3
      /(\d+\.\d+)/,         // 1.2
      /Article\s+(\d+)/i,   // Article 5
      /Chapter\s+(\d+)/i,   // Chapter 3
      /Section\s+(\d+)/i,   // Section 2
      /(\d+\-\d+)/,         // 21-2
      /ةداملا\s+(\d+)/       // Arabic article
    ];
    
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        return match[1] || match[0];
      }
    }
    
    return null;
  }

  private extractContentBasedItems(text: string[], targetLanguage: 'en' | 'ar'): ParsedItem[] {
    const items: ParsedItem[] = [];
    let itemCounter = 1;
    
    console.log('Starting content-based extraction...');
    
    for (const pageText of text) {
      const lines = pageText.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 50); // Only substantial content
      
      for (const line of lines) {
        // Skip headers, footers, and page numbers
        if (line.match(/^Page\s+\d+\s+of\s+\d+/) || 
            line.match(/CBUAE Classification/) ||
            line.match(/^\s*\d+\s*$/)) {
          continue;
        }
        
        // Look for sentences that contain regulatory language
        const sentences = line.split(/[.!?]+/).filter(s => s.trim().length > 30);
        
        for (const sentence of sentences) {
          const trimmedSentence = sentence.trim();
          
          // Check if this looks like a regulatory requirement
          if (this.isRegulatoryContent(trimmedSentence, targetLanguage)) {
            const separatedContent = this.cleanAndSeparateLanguages(trimmedSentence);
            const targetText = targetLanguage === 'en' ? separatedContent.en : separatedContent.ar;
            
            if (targetText && targetText.length > 20) {
              const docRef = this.extractReference(trimmedSentence) || `CONTENT-${itemCounter}`;
              
              items.push({
                ruleId: `RULE-${itemCounter}`,
                docRef: docRef,
                textEn: separatedContent.en || '',
                textAr: separatedContent.ar || '',
                category: this.inferCategory(trimmedSentence),
                parent: null
              });
              
              itemCounter++;
              
              // Limit to prevent too many items
              if (items.length >= 50) {
                console.log('Reached maximum items limit for content-based extraction');
                break;
              }
            }
          }
        }
        
        if (items.length >= 50) break;
      }
      
      if (items.length >= 50) break;
    }
    
    console.log(`Content-based extraction found ${items.length} items`);
    return items;
  }

  private cleanAndSeparateLanguages(text: string): { en: string, ar: string } {
    const englishWords: string[] = [];
    const arabicWords: string[] = [];

    // Split by spaces and process each word/phrase
    const words = text.split(/\s+/);
    
    for (const word of words) {
      if (this.isArabicText(word)) {
        arabicWords.push(word);
      } else if (this.isEnglishText(word) || word.match(/^[\d\.\(\):\-,]+$/)) {
        // Include English words, numbers, and basic punctuation
        englishWords.push(word);
      }
    }

    return {
      en: englishWords.join(' ').trim(),
      ar: arabicWords.join(' ').trim()
    };
  }

  private parseChecklist(text: string[], targetLanguage: 'en' | 'ar'): ParsedItem[] {
    const items: ParsedItem[] = [];
    let currentCategory = '';
    let currentParentRef = '';
    let currentParentText = '';
    
    console.log('Starting enhanced checklist parsing for language:', targetLanguage);
    
    const processText = (text: string) => {
      console.log('Processing text block:', text.substring(0, 200) + '...');
      
      // Split text into lines and clean them
      const lines = text.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
      
      console.log('Total lines to process:', lines.length);
      console.log('First 5 lines:', lines.slice(0, 5));

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Skip very short lines and page numbers
        if (line.length < 10 || line.match(/^Page\s+\d+\s+of\s+\d+/)) {
          continue;
        }

        // Enhanced section header detection
        if (this.isSectionHeader(line, targetLanguage)) {
          currentCategory = line.trim();
          console.log('Found category:', currentCategory);
          continue;
        }

        // Enhanced numbered item detection with more flexible patterns
        const numberedItemMatch = this.extractNumberedItem(line);
        if (numberedItemMatch) {
          const { ref, text: rawText } = numberedItemMatch;
          console.log('Found numbered item:', { ref, text: rawText.substring(0, 50) + '...' });
          
          const separatedContent = this.cleanAndSeparateLanguages(rawText);
          const targetText = targetLanguage === 'en' ? separatedContent.en : separatedContent.ar;
          
          if (targetText && targetText.length > 5) {
            currentParentRef = ref;
            currentParentText = targetText;
            
            items.push({
              ruleId: `RULE-${items.length + 1}`,
              docRef: ref,
              textEn: separatedContent.en || '',
              textAr: separatedContent.ar || '',
              category: currentCategory || this.inferCategory(line),
              parent: null
            });
          }
          continue;
        }

        // Check for Article titles with Arabic patterns (e.g., "( ةداملا 22 ماظنلا ريسفت )")
        const articleMatch = line.match(/^\s*\(\s*ةداملا\s+(\d+)\s*(.+?)\s*\)/);
        console.log('DEBUG: Testing article pattern on line:', line.substring(0, 50));
        if (articleMatch) {
          const [, articleNum, title] = articleMatch;
          console.log('DEBUG: Article pattern matched:', { articleNum, title });
          const ref = `Article-${articleNum}`;
          
          // Look for English equivalent on the same or next lines
          let englishTitle = '';
          if (i + 1 < lines.length) {
            const nextLine = lines[i + 1];
            const englishMatch = nextLine.match(/Article\s*\(\s*\d+\s*\)\s*(.+)/);
            if (englishMatch) {
              englishTitle = englishMatch[1].trim();
            }
          }
          
          console.log('Found article:', { ref, arabicTitle: title, englishTitle });
          
          items.push({
            ruleId: `RULE-${items.length + 1}`,
            docRef: ref,
            textEn: englishTitle,
            textAr: title.trim(),
            category: currentCategory || 'Articles',
            parent: null
          });
          continue;
        }

        // Check for sub-items with letters or numbers (e.g., "1.20.a", "1.20.1", "21-2.1", "21-3.a")
        const subItemMatch = line.match(/^(\d+[\.\s]*[\-\.]\s*\d+\.(?:[a-z]|\d+))[\s\.]+(.+)/i);
        if (subItemMatch) {
          const [, ref, rawText] = subItemMatch;
          
          const separatedContent = this.cleanAndSeparateLanguages(rawText);
          const targetText = targetLanguage === 'en' ? separatedContent.en : separatedContent.ar;
          
          if (targetText && targetText.length > 0) {
            console.log('Found sub-item:', { ref, text: targetText });
            
            items.push({
              ruleId: `RULE-${items.length + 1}`,
              docRef: ref,
              textEn: targetLanguage === 'en' ? targetText : '',
              textAr: targetLanguage === 'ar' ? targetText : '',
              category: currentCategory || 'Uncategorized',
              parent: currentParentRef,
              parentText: currentParentText
            });
          }
          continue;
        }

        // Check for list items (a), (b), (i), (ii), etc.
        const listItemMatch = line.match(/^\(([a-z\d]+)\)[\s\.]+(.+)/i);
        if (listItemMatch) {
          const [, marker, rawText] = listItemMatch;
          
          const separatedContent = this.cleanAndSeparateLanguages(rawText);
          const targetText = targetLanguage === 'en' ? separatedContent.en : separatedContent.ar;
          
          if (targetText && targetText.length > 0) {
            console.log('Found list item:', { marker, text: targetText });
            
            items.push({
              ruleId: `RULE-${items.length + 1}`,
              docRef: `${currentParentRef}.${marker}`,
              textEn: targetLanguage === 'en' ? targetText : '',
              textAr: targetLanguage === 'ar' ? targetText : '',
              category: currentCategory || 'Uncategorized',
              parent: currentParentRef,
              parentText: currentParentText
            });
          }
          continue;
        }

        // Check for bullet points or dashes
        const bulletMatch = line.match(/^[•\-\*][\s\.]+(.+)/);
        if (bulletMatch) {
          const [, rawText] = bulletMatch;
          
          const separatedContent = this.cleanAndSeparateLanguages(rawText);
          const targetText = targetLanguage === 'en' ? separatedContent.en : separatedContent.ar;
          
          if (targetText && targetText.length > 0) {
            console.log('Found bullet point:', targetText);
            
            items.push({
              ruleId: `RULE-${items.length + 1}`,
              docRef: `${currentParentRef}.${items.length}`,
              textEn: targetLanguage === 'en' ? targetText : '',
              textAr: targetLanguage === 'ar' ? targetText : '',
              category: currentCategory || 'Uncategorized',
              parent: currentParentRef,
              parentText: currentParentText
            });
          }
          continue;
        }

        // Check for substantial regulatory content (mixed Arabic/English text blocks)
        if (line.length > 50 && (this.isArabicText(line) || line.includes('Article') || line.includes('ةداملا'))) {
          console.log('DEBUG: Testing regulatory content pattern, line length:', line.length);
          const separatedContent = this.cleanAndSeparateLanguages(line);
          const targetText = targetLanguage === 'en' ? separatedContent.en : separatedContent.ar;
          console.log('DEBUG: Separated content:', { en: separatedContent.en.substring(0, 50), ar: separatedContent.ar.substring(0, 50) });
          
          // Only include if target language has substantial content
          if (targetText && targetText.length > 20) {
            console.log('Found regulatory content block:', { text: targetText.substring(0, 100) + '...' });
            
            // Try to extract a reference number from the content
            const refMatch = line.match(/(\d+[\.\-]\d+)/);
            const docRef = refMatch ? refMatch[1] : `REG-${items.length + 1}`;
            
            items.push({
              ruleId: `RULE-${items.length + 1}`,
              docRef: docRef,
              textEn: separatedContent.en,
              textAr: separatedContent.ar,
              category: currentCategory || 'Regulatory Content',
              parent: null
            });
          }
          continue;
        }

        // Enhanced content extraction - look for substantial regulatory requirements
        if (this.isRegulatoryContent(line, targetLanguage)) {
          console.log('Found regulatory content:', line.substring(0, 50) + '...');
          
          const separatedContent = this.cleanAndSeparateLanguages(line);
          const targetText = targetLanguage === 'en' ? separatedContent.en : separatedContent.ar;
          
          if (targetText && targetText.length > 20) {
            // Extract or generate a reference
            const docRef = this.extractReference(line) || `REG-${items.length + 1}`;
            
            items.push({
              ruleId: `RULE-${items.length + 1}`,
              docRef: docRef,
              textEn: separatedContent.en || '',
              textAr: separatedContent.ar || '',
              category: currentCategory || this.inferCategory(line),
              parent: null
            });
          }
          continue;
        }

        // Handle continuation of previous item's text (only if it matches target language)
        if (items.length > 0 && !line.match(/^(?:\d+\.|\(|\s*[•\-\*])/)) {
          const isTargetLanguageText = targetLanguage === 'en' ? this.isEnglishText(line) : this.isArabicText(line);
          
          if (isTargetLanguageText && line.length > 30) {
            console.log('Found continuation text:', line.substring(0, 50) + '...');
            const lastItem = items[items.length - 1];
            if (targetLanguage === 'en') {
              lastItem.textEn += ' ' + line.trim();
            } else {
              lastItem.textAr += ' ' + line.trim();
            }
          }
        }
      }
    };

    // Process each page
    text.forEach((page, index) => {
      console.log(`Processing page ${index + 1}`);
      processText(page);
    });

    console.log('Finished parsing. Found items:', items.length);
    
    // If no items found with structured patterns, try content-based extraction
    if (items.length === 0) {
      console.log('No structured items found, attempting content-based extraction...');
      return this.extractContentBasedItems(text, targetLanguage);
    }
    
    return items;
  }

  public async parse(fileName: string, language: 'en' | 'ar' = 'en'): Promise<ParsedDocument> {
    try {
      const textContent = await this.extractText();
      console.log('Extracted text content:', textContent);
      console.log('Total pages extracted:', textContent.length);
      
      const items = this.parseChecklist(textContent, language);

      if (!items || items.length === 0) {
        console.log('DEBUG: No items found. Raw text content:', JSON.stringify(textContent.slice(0, 2), null, 2));
        
        // Check if this appears to be a compliance document
        const fullText = textContent.join(' ').toLowerCase();
        const isCommercialDoc = fullText.includes('invoice') || fullText.includes('tax invoice') || 
                               fullText.includes('bill of supply') || fullText.includes('gst');
        const isComplianceDoc = fullText.includes('compliance') || fullText.includes('regulation') ||
                               fullText.includes('cbuae') || fullText.includes('aml') || 
                               fullText.includes('kyc') || fullText.includes('suspicious');
        
        if (isCommercialDoc && !isComplianceDoc) {
          throw new Error('This appears to be a commercial document (invoice/bill). Please upload regulatory compliance documents instead.');
        } else if (!isComplianceDoc) {
          throw new Error('No compliance checklist items found. Please ensure this is a regulatory compliance document.');
        } else {
          throw new Error('No checklist items found in the document. The document may have an unsupported format.');
        }
      }

      return {
        title: fileName.replace(/\.[^/.]+$/, ''), // Remove file extension
        fileName,
        language,
        items
      };
    } catch (error) {
      console.error('Error parsing PDF document:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to parse PDF document');
    }
  }

  // Method to check for changes in existing items
  public static compareItems(
    existing: ParsedItem[],
    newItems: ParsedItem[],
    language: 'en' | 'ar' = 'en'
  ): ParsedItem[] {
    return newItems.map(newItem => {
      const existingItem = existing.find(item => 
        item.ruleId === newItem.ruleId || 
        item.textEn === newItem.textEn
      );

      if (existingItem && existingItem.textEn !== newItem.textEn) {
        // Mark item as changed
        return {
          ...newItem,
          version: (existingItem.version || 1) + 1,
          changes: [
            ...(existingItem.changes || []),
            {
              date: new Date(),
              previousText: existingItem.textEn,
              newText: newItem.textEn,
              language
            }
          ]
        };
      }

      return newItem;
    });
  }
}
