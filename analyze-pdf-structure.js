const fs = require('fs');
const path = require('path');
const PDFParser = require('pdf2json');

// List of PDF files to analyze
const pdfFiles = [
  'CBUAE Draft Guidance on CDD_KYC and Recordkeeping for external consultation-2024\'.pdf',
  'CBUAE_EN_5808_VER1 (22).pdf',
  'Circular No. 5 of 2025 - Update of the List High Risk.pdf',
  'federal-decree-law-no-20-of-2018.pdf',
  'Implementation Guide on Customer Risk Assessment CRA.pdf',
  'Notice 4158.2025 re Cyber Security Advisory (1).pdf',
  'Notice No. 5737.2021 re Updated Guidance on Targeted Financial Sanctions and Typologies ExOff IEC.pdf',
  'Registered Hawala Providers Regulation_0.pdf',
  'Typology Report_MVTS Jul 2022.pdf'
];

const pdfsPath = path.join(__dirname, 'pdfs');

function isArabicText(text) {
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
  return arabicRegex.test(text);
}

function isEnglishText(text) {
  const latinRegex = /[A-Za-z]/;
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
  return latinRegex.test(text) && !arabicRegex.test(text);
}

function analyzePDFStructure(filePath) {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();
    
    pdfParser.on("pdfParser_dataReady", (pdfData) => {
      try {
        const analysis = {
          totalPages: pdfData.Pages.length,
          pages: []
        };
        
        pdfData.Pages.forEach((page, pageIndex) => {
          const pageAnalysis = {
            pageNumber: pageIndex + 1,
            totalTexts: page.Texts.length,
            arabicTexts: 0,
            englishTexts: 0,
            numberedItems: 0,
            bulletPoints: 0,
            structurePatterns: {
              mainNumbers: [], // 1.19, 1.20, etc.
              subNumbers: [],  // 1.19.a, 1.20.1, etc.
              articles: [],    // Article references
              listItems: [],   // (a), (b), (i), etc.
              bullets: []      // •, -, *, etc.
            },
            sampleTexts: {
              arabic: [],
              english: [],
              mixed: []
            }
          };
          
          // Sort texts by position for better structure analysis
          const sortedTexts = page.Texts.sort((a, b) => {
            const yDiff = (a.y || 0) - (b.y || 0);
            return yDiff !== 0 ? yDiff : (a.x || 0) - (b.x || 0);
          });
          
          // Group texts by lines
          const lines = [];
          let currentLine = [];
          let lastY = -1;
          
          sortedTexts.forEach(text => {
            const y = text.y || 0;
            if (lastY === -1 || Math.abs(y - lastY) < 0.3) {
              currentLine.push(text);
            } else {
              if (currentLine.length > 0) {
                lines.push(currentLine.map(t => decodeURIComponent(t.R[0].T)).join(' '));
              }
              currentLine = [text];
            }
            lastY = y;
          });
          
          if (currentLine.length > 0) {
            lines.push(currentLine.map(t => decodeURIComponent(t.R[0].T)).join(' '));
          }
          
          // Analyze each line
          lines.forEach(line => {
            const trimmedLine = line.trim();
            if (trimmedLine.length === 0) return;
            
            // Check language
            if (isArabicText(trimmedLine)) {
              pageAnalysis.arabicTexts++;
              if (pageAnalysis.sampleTexts.arabic.length < 5) {
                pageAnalysis.sampleTexts.arabic.push(trimmedLine.substring(0, 100));
              }
            } else if (isEnglishText(trimmedLine)) {
              pageAnalysis.englishTexts++;
              if (pageAnalysis.sampleTexts.english.length < 5) {
                pageAnalysis.sampleTexts.english.push(trimmedLine.substring(0, 100));
              }
            } else {
              if (pageAnalysis.sampleTexts.mixed.length < 5) {
                pageAnalysis.sampleTexts.mixed.push(trimmedLine.substring(0, 100));
              }
            }
            
            // Analyze structure patterns
            
            // Main numbered items (e.g., "1.19", "1.20", "21-2", "21 - 2")
            const mainItemMatch = trimmedLine.match(/^(\d+(?:[\.\s]*[\-\.]\s*\d+)?)[\s\.]+(.+)/);
            if (mainItemMatch) {
              pageAnalysis.structurePatterns.mainNumbers.push({
                ref: mainItemMatch[1],
                text: mainItemMatch[2].substring(0, 50) + '...'
              });
              pageAnalysis.numberedItems++;
            }
            
            // Sub-items (e.g., "1.20.a", "1.20.1", "21-2.1")
            const subItemMatch = trimmedLine.match(/^(\d+[\.\s]*[\-\.]\s*\d+\.(?:[a-z]|\d+))[\s\.]+(.+)/i);
            if (subItemMatch) {
              pageAnalysis.structurePatterns.subNumbers.push({
                ref: subItemMatch[1],
                text: subItemMatch[2].substring(0, 50) + '...'
              });
            }
            
            // Articles (Arabic and English patterns)
            const articleArabicMatch = trimmedLine.match(/^\s*\(\s*ةداملا\s+(\d+)\s*(.+?)\s*\)/);
            const articleEnglishMatch = trimmedLine.match(/^Article\s*\(\s*(\d+)\s*\)\s*(.+)/);
            if (articleArabicMatch) {
              pageAnalysis.structurePatterns.articles.push({
                type: 'arabic',
                number: articleArabicMatch[1],
                title: articleArabicMatch[2].substring(0, 50) + '...'
              });
            } else if (articleEnglishMatch) {
              pageAnalysis.structurePatterns.articles.push({
                type: 'english',
                number: articleEnglishMatch[1],
                title: articleEnglishMatch[2].substring(0, 50) + '...'
              });
            }
            
            // List items (a), (b), (i), (ii), etc.
            const listItemMatch = trimmedLine.match(/^\(([a-z\d]+)\)[\s\.]+(.+)/i);
            if (listItemMatch) {
              pageAnalysis.structurePatterns.listItems.push({
                marker: listItemMatch[1],
                text: listItemMatch[2].substring(0, 50) + '...'
              });
            }
            
            // Bullet points
            const bulletMatch = trimmedLine.match(/^[•\-\*][\s\.]+(.+)/);
            if (bulletMatch) {
              pageAnalysis.structurePatterns.bullets.push(bulletMatch[1].substring(0, 50) + '...');
              pageAnalysis.bulletPoints++;
            }
          });
          
          analysis.pages.push(pageAnalysis);
        });
        
        resolve(analysis);
      } catch (error) {
        reject(error);
      }
    });
    
    pdfParser.on("pdfParser_dataError", (errData) => {
      reject(new Error(`PDF parsing error: ${errData.parserError?.message || errData.message}`));
    });
    
    const buffer = fs.readFileSync(filePath);
    pdfParser.parseBuffer(buffer);
  });
}

async function analyzeAllPDFs() {
  console.log('Starting PDF structure analysis...');
  console.log('='.repeat(80));
  
  const analyses = {};
  
  for (const fileName of pdfFiles) {
    const filePath = path.join(pdfsPath, fileName);
    
    if (!fs.existsSync(filePath)) {
      console.log(`❌ File not found: ${fileName}`);
      continue;
    }
    
    console.log(`\n📄 Analyzing: ${fileName}`);
    console.log('-'.repeat(60));
    
    try {
      const analysis = await analyzePDFStructure(filePath);
      analyses[fileName] = analysis;
      
      console.log(`📊 Pages: ${analysis.totalPages}`);
      
      // Summary statistics
      const totalTexts = analysis.pages.reduce((sum, page) => sum + page.totalTexts, 0);
      const totalArabic = analysis.pages.reduce((sum, page) => sum + page.arabicTexts, 0);
      const totalEnglish = analysis.pages.reduce((sum, page) => sum + page.englishTexts, 0);
      const totalNumbered = analysis.pages.reduce((sum, page) => sum + page.numberedItems, 0);
      const totalBullets = analysis.pages.reduce((sum, page) => sum + page.bulletPoints, 0);
      
      console.log(`📝 Total texts: ${totalTexts} (${totalEnglish} English, ${totalArabic} Arabic)`);
      console.log(`🔢 Numbered items: ${totalNumbered}`);
      console.log(`• Bullet points: ${totalBullets}`);
      
      // Show structure patterns from first few pages
      const firstPage = analysis.pages[0];
      if (firstPage) {
        console.log('\n🔍 Structure patterns (first page):');
        
        if (firstPage.structurePatterns.mainNumbers.length > 0) {
          console.log(`   Main numbers (${firstPage.structurePatterns.mainNumbers.length}):`, 
                     firstPage.structurePatterns.mainNumbers.slice(0, 3).map(item => `${item.ref}: ${item.text}`));
        }
        
        if (firstPage.structurePatterns.articles.length > 0) {
          console.log(`   Articles (${firstPage.structurePatterns.articles.length}):`, 
                     firstPage.structurePatterns.articles.slice(0, 3).map(item => `${item.type} ${item.number}: ${item.title}`));
        }
        
        if (firstPage.structurePatterns.listItems.length > 0) {
          console.log(`   List items (${firstPage.structurePatterns.listItems.length}):`, 
                     firstPage.structurePatterns.listItems.slice(0, 3).map(item => `(${item.marker}): ${item.text}`));
        }
        
        console.log('\n📄 Sample content:');
        if (firstPage.sampleTexts.english.length > 0) {
          console.log(`   English: "${firstPage.sampleTexts.english[0]}"`);
        }
        if (firstPage.sampleTexts.arabic.length > 0) {
          console.log(`   Arabic: "${firstPage.sampleTexts.arabic[0]}"`);
        }
        if (firstPage.sampleTexts.mixed.length > 0) {
          console.log(`   Mixed: "${firstPage.sampleTexts.mixed[0]}"`);
        }
      }
      
    } catch (error) {
      console.log(`❌ Error analyzing ${fileName}: ${error.message}`);
      analyses[fileName] = { error: error.message };
    }
  }
  
  // Save detailed analysis
  fs.writeFileSync(
    path.join(__dirname, 'pdf-structure-analysis.json'),
    JSON.stringify(analyses, null, 2)
  );
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 STRUCTURE ANALYSIS COMPLETE');
  console.log('='.repeat(80));
  console.log('💾 Detailed analysis saved to: pdf-structure-analysis.json');
  
  return analyses;
}

// Run the analysis
analyzeAllPDFs().catch(console.error);