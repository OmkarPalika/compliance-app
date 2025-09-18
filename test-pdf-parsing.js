const fs = require('fs');
const path = require('path');
const { PDFChecklistParser } = require('./src/lib/pdf/pdf-checklist-parser.ts');

// List of PDF files to test
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

async function testPDFParsing() {
  console.log('Starting PDF parsing tests...');
  console.log('='.repeat(80));
  
  const results = {};
  
  for (const fileName of pdfFiles) {
    const filePath = path.join(pdfsPath, fileName);
    
    if (!fs.existsSync(filePath)) {
      console.log(`❌ File not found: ${fileName}`);
      continue;
    }
    
    console.log(`\n📄 Testing: ${fileName}`);
    console.log('-'.repeat(60));
    
    try {
      const buffer = fs.readFileSync(filePath);
      const parser = new PDFChecklistParser(buffer);
      
      // Test English parsing
      console.log('🔤 Testing English parsing...');
      const englishResult = await parser.parse(fileName, 'en');
      
      // Test Arabic parsing
      console.log('🔤 Testing Arabic parsing...');
      const arabicResult = await parser.parse(fileName, 'ar');
      
      results[fileName] = {
        english: {
          totalItems: englishResult.items.length,
          categories: [...new Set(englishResult.items.map(item => item.category))],
          hasTextEn: englishResult.items.filter(item => item.textEn && item.textEn.trim().length > 0).length,
          hasTextAr: englishResult.items.filter(item => item.textAr && item.textAr.trim().length > 0).length,
          sampleItems: englishResult.items.slice(0, 3).map(item => ({
            ruleId: item.ruleId,
            docRef: item.docRef,
            textEn: item.textEn ? item.textEn.substring(0, 100) + '...' : '',
            textAr: item.textAr ? item.textAr.substring(0, 100) + '...' : '',
            category: item.category
          }))
        },
        arabic: {
          totalItems: arabicResult.items.length,
          categories: [...new Set(arabicResult.items.map(item => item.category))],
          hasTextEn: arabicResult.items.filter(item => item.textEn && item.textEn.trim().length > 0).length,
          hasTextAr: arabicResult.items.filter(item => item.textAr && item.textAr.trim().length > 0).length,
          sampleItems: arabicResult.items.slice(0, 3).map(item => ({
            ruleId: item.ruleId,
            docRef: item.docRef,
            textEn: item.textEn ? item.textEn.substring(0, 100) + '...' : '',
            textAr: item.textAr ? item.textAr.substring(0, 100) + '...' : '',
            category: item.category
          }))
        }
      };
      
      console.log(`✅ English: ${englishResult.items.length} items found`);
      console.log(`✅ Arabic: ${arabicResult.items.length} items found`);
      console.log(`📊 Categories: ${results[fileName].english.categories.join(', ')}`);
      
      // Show sample items
      console.log('\n📝 Sample items (English parsing):');
      results[fileName].english.sampleItems.forEach((item, index) => {
        console.log(`   ${index + 1}. [${item.docRef}] ${item.category}: ${item.textEn}`);
        if (item.textAr) {
          console.log(`      Arabic: ${item.textAr}`);
        }
      });
      
      if (results[fileName].arabic.sampleItems.length > 0 && 
          JSON.stringify(results[fileName].arabic.sampleItems) !== JSON.stringify(results[fileName].english.sampleItems)) {
        console.log('\n📝 Sample items (Arabic parsing - different results):');
        results[fileName].arabic.sampleItems.forEach((item, index) => {
          console.log(`   ${index + 1}. [${item.docRef}] ${item.category}: ${item.textAr}`);
          if (item.textEn) {
            console.log(`      English: ${item.textEn}`);
          }
        });
      }
      
    } catch (error) {
      console.log(`❌ Error parsing ${fileName}: ${error.message}`);
      results[fileName] = {
        error: error.message
      };
    }
  }
  
  // Generate summary report
  console.log('\n' + '='.repeat(80));
  console.log('📊 SUMMARY REPORT');
  console.log('='.repeat(80));
  
  Object.entries(results).forEach(([fileName, result]) => {
    console.log(`\n📄 ${fileName}:`);
    if (result.error) {
      console.log(`   ❌ Error: ${result.error}`);
    } else {
      console.log(`   🔤 English: ${result.english.totalItems} items (${result.english.hasTextEn} with English text, ${result.english.hasTextAr} with Arabic text)`);
      console.log(`   🔤 Arabic: ${result.arabic.totalItems} items (${result.arabic.hasTextEn} with English text, ${result.arabic.hasTextAr} with Arabic text)`);
      console.log(`   📂 Categories: ${result.english.categories.length} (${result.english.categories.slice(0, 3).join(', ')}${result.english.categories.length > 3 ? '...' : ''})`);
    }
  });
  
  // Save detailed results to file
  fs.writeFileSync(
    path.join(__dirname, 'pdf-parsing-test-results.json'),
    JSON.stringify(results, null, 2)
  );
  
  console.log(`\n💾 Detailed results saved to: pdf-parsing-test-results.json`);
  console.log('🏁 Testing completed!');
}

// Run the test
testPDFParsing().catch(console.error);