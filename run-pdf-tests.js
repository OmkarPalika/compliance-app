const fs = require('fs');
const path = require('path');

// Dynamic import function for TypeScript modules
async function importModule(modulePath) {
  try {
    // Use dynamic import for TypeScript files
    return await import(modulePath);
  } catch (error) {
    console.error(`Failed to import ${modulePath}:`, error);
    return null;
  }
}

// List of PDF files to test comprehensively
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

async function testPDFProcessingComprehensive() {
  console.log('🚀 Starting comprehensive PDF processing tests...');
  console.log('='.repeat(80));
  
  // Import the parser
  const parserModule = await importModule('./src/lib/pdf/pdf-checklist-parser.ts');
  if (!parserModule) {
    console.error('❌ Failed to import PDF parser module');
    return;
  }
  
  const { PDFChecklistParser } = parserModule;
  
  const results = {
    totalFiles: pdfFiles.length,
    successful: { en: 0, ar: 0 },
    failed: { en: 0, ar: 0 },
    details: {},
    summary: {
      totalItemsExtracted: { en: 0, ar: 0 },
      categoriesFound: new Set(),
      averageItemsPerDoc: { en: 0, ar: 0 }
    }
  };
  
  for (const fileName of pdfFiles) {
    const filePath = path.join(pdfsPath, fileName);
    
    if (!fs.existsSync(filePath)) {
      console.log(`❌ File not found: ${fileName}`);
      results.details[fileName] = { error: 'File not found' };
      continue;
    }
    
    console.log(`\n📄 Testing comprehensive parsing: ${fileName}`);
    console.log('-'.repeat(60));
    
    results.details[fileName] = {
      fileName,
      fileSize: fs.statSync(filePath).size,
      languages: {}
    };
    
    try {
      const buffer = fs.readFileSync(filePath);
      const parser = new PDFChecklistParser(buffer);
      
      // Test both languages
      for (const language of ['en', 'ar']) {
        console.log(`🔤 Testing ${language === 'en' ? 'English' : 'Arabic'} parsing...`);
        
        try {
          const startTime = Date.now();
          const result = await parser.parse(fileName, language);
          const endTime = Date.now();
          const processingTime = endTime - startTime;
          
          const languageResult = {
            success: true,
            processingTime,
            totalItems: result.items.length,
            categories: [...new Set(result.items.map(item => item.category))],
            itemsWithEnglishText: result.items.filter(item => item.textEn && item.textEn.trim().length > 0).length,
            itemsWithArabicText: result.items.filter(item => item.textAr && item.textAr.trim().length > 0).length,
            sampleItems: result.items.slice(0, 3).map(item => ({
              ruleId: item.ruleId,
              docRef: item.docRef,
              textEn: item.textEn ? item.textEn.substring(0, 80) + '...' : '',
              textAr: item.textAr ? item.textAr.substring(0, 80) + '...' : '',
              category: item.category
            }))
          };
          
          results.details[fileName].languages[language] = languageResult;
          results.successful[language]++;
          results.summary.totalItemsExtracted[language] += languageResult.totalItems;
          
          // Add categories to summary
          languageResult.categories.forEach(cat => results.summary.categoriesFound.add(cat));
          
          console.log(`✅ ${language.toUpperCase()}: ${languageResult.totalItems} items in ${processingTime}ms`);
          console.log(`   📊 Categories (${languageResult.categories.length}): ${languageResult.categories.slice(0, 3).join(', ')}${languageResult.categories.length > 3 ? '...' : ''}`);
          console.log(`   📝 Text distribution: ${languageResult.itemsWithEnglishText} EN, ${languageResult.itemsWithArabicText} AR`);
          
          // Show sample items
          if (languageResult.sampleItems.length > 0) {
            console.log(`   🔍 Sample items:`);
            languageResult.sampleItems.forEach((item, idx) => {
              console.log(`      ${idx + 1}. [${item.docRef}] ${item.category}:`);
              if (item.textEn) console.log(`         EN: ${item.textEn}`);
              if (item.textAr) console.log(`         AR: ${item.textAr}`);
            });
          }
          
        } catch (parseError) {
          console.log(`❌ ${language.toUpperCase()} parsing failed: ${parseError.message}`);
          results.details[fileName].languages[language] = {
            success: false,
            error: parseError.message
          };
          results.failed[language]++;
        }
      }
      
      // Analyze bilingual consistency
      const enResult = results.details[fileName].languages.en;
      const arResult = results.details[fileName].languages.ar;
      
      if (enResult?.success && arResult?.success) {
        const itemCountDiff = Math.abs(enResult.totalItems - arResult.totalItems);
        const maxItems = Math.max(enResult.totalItems, arResult.totalItems);
        const consistencyPercentage = maxItems > 0 ? ((maxItems - itemCountDiff) / maxItems * 100).toFixed(1) : 0;
        
        results.details[fileName].bilingualConsistency = {
          itemCountDifference: itemCountDiff,
          consistencyPercentage: parseFloat(consistencyPercentage),
          sharedCategories: enResult.categories.filter(cat => arResult.categories.includes(cat))
        };
        
        console.log(`🔄 Bilingual consistency: ${consistencyPercentage}% (${itemCountDiff} item difference)`);
      }
      
    } catch (error) {
      console.log(`❌ Error processing ${fileName}: ${error.message}`);
      results.details[fileName].error = error.message;
      results.failed.en++;
      results.failed.ar++;
    }
  }
  
  // Calculate averages
  if (results.successful.en > 0) {
    results.summary.averageItemsPerDoc.en = (results.summary.totalItemsExtracted.en / results.successful.en).toFixed(1);
  }
  if (results.successful.ar > 0) {
    results.summary.averageItemsPerDoc.ar = (results.summary.totalItemsExtracted.ar / results.successful.ar).toFixed(1);
  }
  
  // Generate comprehensive report
  console.log('\n' + '='.repeat(80));
  console.log('📊 COMPREHENSIVE TEST REPORT');
  console.log('='.repeat(80));
  
  console.log(`\n📈 Overall Statistics:`);
  console.log(`   Files processed: ${results.totalFiles}`);
  console.log(`   English parsing: ${results.successful.en}/${results.totalFiles} successful (${(results.successful.en/results.totalFiles*100).toFixed(1)}%)`);
  console.log(`   Arabic parsing: ${results.successful.ar}/${results.totalFiles} successful (${(results.successful.ar/results.totalFiles*100).toFixed(1)}%)`);
  console.log(`   Total items extracted: ${results.summary.totalItemsExtracted.en + results.summary.totalItemsExtracted.ar}`);
  console.log(`   Average items per document: ${results.summary.averageItemsPerDoc.en} EN, ${results.summary.averageItemsPerDoc.ar} AR`);
  console.log(`   Categories discovered: ${results.summary.categoriesFound.size}`);
  
  console.log(`\n📂 Categories found: ${Array.from(results.summary.categoriesFound).join(', ')}`);
  
  // Success stories
  const successfulFiles = Object.entries(results.details).filter(([, details]) => 
    details.languages?.en?.success || details.languages?.ar?.success
  );
  
  if (successfulFiles.length > 0) {
    console.log(`\n✅ Successfully processed files:`);
    successfulFiles.forEach(([fileName, details]) => {
      const enSuccess = details.languages?.en?.success ? `EN: ${details.languages.en.totalItems} items` : 'EN: failed';
      const arSuccess = details.languages?.ar?.success ? `AR: ${details.languages.ar.totalItems} items` : 'AR: failed';
      console.log(`   📄 ${fileName}: ${enSuccess}, ${arSuccess}`);
      if (details.bilingualConsistency) {
        console.log(`      🔄 Consistency: ${details.bilingualConsistency.consistencyPercentage}%`);
      }
    });
  }
  
  // Failures
  const failedFiles = Object.entries(results.details).filter(([, details]) => 
    details.error || (!details.languages?.en?.success && !details.languages?.ar?.success)
  );
  
  if (failedFiles.length > 0) {
    console.log(`\n❌ Failed files:`);
    failedFiles.forEach(([fileName, details]) => {
      if (details.error) {
        console.log(`   📄 ${fileName}: ${details.error}`);
      } else {
        const enError = details.languages?.en?.error || 'Unknown error';
        const arError = details.languages?.ar?.error || 'Unknown error';
        console.log(`   📄 ${fileName}: EN: ${enError}, AR: ${arError}`);
      }
    });
  }
  
  // Recommendations
  console.log(`\n💡 Recommendations:`);
  
  if (results.failed.en > results.successful.en || results.failed.ar > results.successful.ar) {
    console.log(`   🔧 Parser improvements needed - high failure rate`);
  }
  
  if (results.summary.totalItemsExtracted.en === 0 && results.summary.totalItemsExtracted.ar === 0) {
    console.log(`   📝 No items extracted - review content extraction patterns`);
  }
  
  if (results.summary.categoriesFound.size < 5) {
    console.log(`   📂 Few categories detected - enhance category inference`);
  }
  
  const avgConsistency = successfulFiles
    .filter(([, details]) => details.bilingualConsistency)
    .map(([, details]) => details.bilingualConsistency.consistencyPercentage)
    .reduce((sum, val) => sum + val, 0) / successfulFiles.length;
  
  if (avgConsistency < 80) {
    console.log(`   🔄 Bilingual consistency low (${avgConsistency.toFixed(1)}%) - review language separation`);
  }
  
  // Save detailed results
  const reportPath = path.join(__dirname, 'comprehensive-pdf-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    ...results
  }, null, 2));
  
  console.log(`\n💾 Comprehensive report saved to: comprehensive-pdf-test-report.json`);
  console.log('🏁 Comprehensive testing completed!');
  
  return results;
}

// Run the comprehensive test
if (require.main === module) {
  testPDFProcessingComprehensive().catch(console.error);
}

module.exports = { testPDFProcessingComprehensive };