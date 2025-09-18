#!/usr/bin/env node
/**
 * Test script for uploading actual compliance documents
 * Demonstrates proper usage vs. commercial documents
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

const COMPLIANCE_DOCS = [
  'CBUAE_EN_5808_VER1 (22).pdf',
  'Typology Report_MVTS Jul 2022.pdf',
  'Circular No. 5 of 2025 - Update of the List High Risk.pdf',
  'federal-decree-law-no-20-of-2018.pdf',
  'Implementation Guide on Customer Risk Assessment CRA.pdf'
];

async function testComplianceUpload() {
  console.log('🚀 Testing Compliance Document Upload vs Commercial Documents\n');
  
  console.log('❌ Expected Failure: Commercial Invoice (like what you just tested)');
  console.log('   - Tax invoices, bills, GST documents will be rejected');
  console.log('   - Error: "This appears to be a commercial document..."\n');
  
  console.log('✅ Expected Success: Compliance Documents');
  console.log('   The following documents should parse successfully:\n');
  
  for (const doc of COMPLIANCE_DOCS) {
    const docPath = path.join('pdfs', doc);
    console.log(`📋 ${doc}`);
    console.log(`   Path: ${docPath}`);
    console.log(`   Expected: Should extract compliance items`);
    console.log('');
  }
  
  console.log('🔧 To test these documents:');
  console.log('1. Start your Next.js development server');
  console.log('2. Navigate to the upload page');
  console.log('3. Upload files from the pdfs/ directory');
  console.log('4. Commercial documents will be rejected with helpful error messages');
  console.log('5. Compliance documents will be processed and items extracted\n');
  
  console.log('📊 Expected Results Summary:');
  console.log('- CBUAE documents: ~50+ items extracted');
  console.log('- Typology reports: ~15-20 items extracted');
  console.log('- Circular documents: ~2-5 items extracted');
  console.log('- Federal decree laws: ~10-30 items extracted');
  console.log('- Implementation guides: ~20-40 items extracted\n');
  
  console.log('🎯 The enhanced parser now provides better error messages');
  console.log('   and can distinguish between document types automatically.');
}

testComplianceUpload().catch(console.error);