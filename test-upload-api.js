const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:3000'; // Adjust if different
const TEST_USER_TOKEN = process.env.TEST_USER_TOKEN; // Will need to be set

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

async function testUploadAPI() {
  console.log('Starting API upload tests...');
  console.log('='.repeat(80));
  
  const results = {
    successful: [],
    failed: [],
    summary: {
      english: { total: 0, successful: 0, failed: 0 },
      arabic: { total: 0, successful: 0, failed: 0 }
    }
  };
  
  for (const fileName of pdfFiles) {
    const filePath = path.join(pdfsPath, fileName);
    
    if (!fs.existsSync(filePath)) {
      console.log(`❌ File not found: ${fileName}`);
      results.failed.push({ fileName, error: 'File not found' });
      continue;
    }
    
    console.log(`\n📄 Testing upload: ${fileName}`);
    console.log('-'.repeat(60));
    
    // Test both languages
    for (const language of ['en', 'ar']) {
      console.log(`🔤 Testing ${language === 'en' ? 'English' : 'Arabic'} upload...`);
      results.summary[language].total++;
      
      try {
        const formData = new FormData();
        formData.append('file', fs.createReadStream(filePath));
        formData.append('language', language);
        
        const response = await axios.post(`${API_BASE_URL}/api/upload`, formData, {
          headers: {
            ...formData.getHeaders(),
            // Add authentication header if available
            ...(TEST_USER_TOKEN && { 'Authorization': `Bearer ${TEST_USER_TOKEN}` })
          },
          timeout: 30000 // 30 second timeout
        });
        
        if (response.data.success) {
          console.log(`✅ ${language.toUpperCase()} upload successful!`);
          console.log(`   Document ID: ${response.data.documentId}`);
          console.log(`   Total rules: ${response.data.summary?.totalRules || 'N/A'}`);
          
          results.successful.push({
            fileName,
            language,
            documentId: response.data.documentId,
            totalRules: response.data.summary?.totalRules,
            message: response.data.message
          });
          results.summary[language].successful++;
        } else {
          throw new Error(response.data.message || 'Upload failed');
        }
        
      } catch (error) {
        console.log(`❌ ${language.toUpperCase()} upload failed: ${error.message}`);
        
        let errorDetails = error.message;
        if (error.response?.data) {
          errorDetails = error.response.data.message || error.response.data.error || error.message;
        }
        
        results.failed.push({
          fileName,
          language,
          error: errorDetails,
          statusCode: error.response?.status
        });
        results.summary[language].failed++;
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Delay between files
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Generate summary report
  console.log('\n' + '='.repeat(80));
  console.log('📊 API UPLOAD TEST SUMMARY');
  console.log('='.repeat(80));
  
  console.log(`\n📈 Overall Statistics:`);
  console.log(`   English uploads: ${results.summary.english.successful}/${results.summary.english.total} successful`);
  console.log(`   Arabic uploads: ${results.summary.arabic.successful}/${results.summary.arabic.total} successful`);
  console.log(`   Total successful: ${results.successful.length}`);
  console.log(`   Total failed: ${results.failed.length}`);
  
  if (results.successful.length > 0) {
    console.log(`\n✅ Successful uploads:`);
    results.successful.forEach(result => {
      console.log(`   ${result.fileName} (${result.language.toUpperCase()}): ${result.totalRules} rules - ID: ${result.documentId}`);
    });
  }
  
  if (results.failed.length > 0) {
    console.log(`\n❌ Failed uploads:`);
    results.failed.forEach(result => {
      console.log(`   ${result.fileName} (${result.language.toUpperCase()}): ${result.error}`);
    });
  }
  
  // Save detailed results
  fs.writeFileSync(
    path.join(__dirname, 'api-upload-test-results.json'),
    JSON.stringify(results, null, 2)
  );
  
  console.log(`\n💾 Detailed results saved to: api-upload-test-results.json`);
  console.log('🏁 API testing completed!');
  
  return results;
}

// Test without API (direct parser testing)
async function testDirectParsing() {
  console.log('Starting direct parser tests (without API)...');
  console.log('='.repeat(80));
  
  // Dynamic import for TypeScript files
  const { PDFChecklistParser } = await import('./src/lib/pdf/pdf-checklist-parser.ts');
  
  const results = {};
  
  for (const fileName of pdfFiles.slice(0, 3)) { // Test first 3 files
    const filePath = path.join(pdfsPath, fileName);
    
    if (!fs.existsSync(filePath)) {
      console.log(`❌ File not found: ${fileName}`);
      continue;
    }
    
    console.log(`\n📄 Testing direct parsing: ${fileName}`);
    console.log('-'.repeat(60));
    
    try {
      const buffer = fs.readFileSync(filePath);
      const parser = new PDFChecklistParser(buffer);
      
      // Test both languages
      const englishResult = await parser.parse(fileName, 'en');
      const arabicResult = await parser.parse(fileName, 'ar');
      
      results[fileName] = {
        english: {
          totalItems: englishResult.items.length,
          categories: [...new Set(englishResult.items.map(item => item.category))],
          hasEnglish: englishResult.items.filter(item => item.textEn && item.textEn.trim().length > 0).length,
          hasArabic: englishResult.items.filter(item => item.textAr && item.textAr.trim().length > 0).length
        },
        arabic: {
          totalItems: arabicResult.items.length,
          categories: [...new Set(arabicResult.items.map(item => item.category))],
          hasEnglish: arabicResult.items.filter(item => item.textEn && item.textEn.trim().length > 0).length,
          hasArabic: arabicResult.items.filter(item => item.textAr && item.textAr.trim().length > 0).length
        }
      };
      
      console.log(`✅ English parsing: ${englishResult.items.length} items (${results[fileName].english.hasEnglish} EN, ${results[fileName].english.hasArabic} AR)`);
      console.log(`✅ Arabic parsing: ${arabicResult.items.length} items (${results[fileName].arabic.hasEnglish} EN, ${results[fileName].arabic.hasArabic} AR)`);
      console.log(`📂 Categories: ${results[fileName].english.categories.join(', ')}`);
      
    } catch (error) {
      console.log(`❌ Direct parsing failed: ${error.message}`);
      results[fileName] = { error: error.message };
    }
  }
  
  return results;
}

// Main function to run tests
async function runTests() {
  console.log('🚀 Starting comprehensive PDF upload and parsing tests...\n');
  
  // Check if server is running
  try {
    await axios.get(`${API_BASE_URL}/api/health`);
    console.log('✅ Server is running, will test API uploads');
    await testUploadAPI();
  } catch (error) {
    console.log('⚠️  Server not running or no health endpoint, skipping API tests');
    console.log('📋 Running direct parser tests instead...\n');
    await testDirectParsing();
  }
}

if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testUploadAPI,
  testDirectParsing,
  runTests
};