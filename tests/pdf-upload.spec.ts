import { test, expect } from '@playwright/test';
import path from 'path';

// Test data configuration
const TEST_PDFS = [
  {
    fileName: 'CBUAE_EN_5808_VER1 (22).pdf',
    description: 'CBUAE Arabic Standards Document',
    expectedMinItems: 10,
    expectedCategories: ['Regulatory Content', 'Know Your Customer', 'Anti-Money Laundering']
  },
  {
    fileName: 'Typology Report_MVTS Jul 2022.pdf',
    description: 'MVTS Typology Report',
    expectedMinItems: 5,
    expectedCategories: ['Counter Financing of Terrorism', 'General Compliance']
  },
  {
    fileName: 'Circular No. 5 of 2025 - Update of the List High Risk.pdf',
    description: 'High Risk Countries Update',
    expectedMinItems: 1,
    expectedCategories: ['Regulatory Content']
  }
];

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'ar', name: 'Arabic' }
];

test.describe('PDF Upload and Processing', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    
    // Perform login (assuming test user exists)
    await page.fill('[data-testid="email"]', 'test@compliance.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard');
    expect(page.url()).toContain('/dashboard');
  });

  for (const pdf of TEST_PDFS) {
    for (const language of LANGUAGES) {
      test(`Upload and process ${pdf.description} in ${language.name}`, async ({ page }) => {
        // Navigate to upload page
        await page.goto('/upload');
        await page.waitForLoadState('networkidle');

        // Prepare file path
        const filePath = path.join(__dirname, '..', 'pdfs', pdf.fileName);

        // Upload file
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(filePath);

        // Select language
        await page.selectOption('[data-testid="language-select"]', language.code);

        // Click upload button
        await page.click('[data-testid="upload-button"]');

        // Wait for processing to complete
        await page.waitForSelector('[data-testid="upload-success"]', { timeout: 30000 });

        // Verify success message
        const successMessage = await page.textContent('[data-testid="upload-success"]');
        expect(successMessage).toContain('successfully');

        // Get document ID from success message or URL
        const documentId = await page.evaluate(() => {
          const url = new URL(window.location.href);
          return url.searchParams.get('documentId') || 
                 document.querySelector('[data-document-id]')?.getAttribute('data-document-id');
        });

        expect(documentId).toBeTruthy();

        // Navigate to checklist view
        await page.goto(`/checklist/${documentId}`);
        await page.waitForLoadState('networkidle');

        // Verify document title
        const documentTitle = await page.textContent('[data-testid="document-title"]');
        expect(documentTitle).toContain(pdf.fileName.replace('.pdf', ''));

        // Verify language indicator
        const languageIndicator = await page.textContent('[data-testid="document-language"]');
        expect(languageIndicator).toContain(language.name);

        // Verify minimum number of items extracted
        const checklistItems = await page.locator('[data-testid="checklist-item"]').count();
        expect(checklistItems).toBeGreaterThanOrEqual(pdf.expectedMinItems);

        // Verify categories are present
        for (const expectedCategory of pdf.expectedCategories) {
          const categoryElement = page.locator(`[data-category="${expectedCategory}"]`).first();
          await expect(categoryElement).toBeVisible();
        }

        // Verify item content based on language
        const firstItem = page.locator('[data-testid="checklist-item"]').first();
        await expect(firstItem).toBeVisible();

        if (language.code === 'en') {
          // For English, verify English text is present
          const englishText = await firstItem.locator('[data-testid="item-text-en"]').textContent();
          expect(englishText).toBeTruthy();
          expect(englishText!.length).toBeGreaterThan(10);
        } else {
          // For Arabic, verify Arabic text is present
          const arabicText = await firstItem.locator('[data-testid="item-text-ar"]').textContent();
          expect(arabicText).toBeTruthy();
          expect(arabicText!.length).toBeGreaterThan(10);
        }

        // Test item interaction (status change)
        const statusSelect = firstItem.locator('[data-testid="item-status-select"]');
        await statusSelect.selectOption('yes');
        
        // Wait for status update
        await page.waitForTimeout(1000);
        
        // Verify status was saved
        const updatedStatus = await statusSelect.inputValue();
        expect(updatedStatus).toBe('yes');

        // Test filtering by category
        if (pdf.expectedCategories.length > 0) {
          const categoryFilter = page.locator('[data-testid="category-filter"]');
          await categoryFilter.selectOption(pdf.expectedCategories[0]);
          await page.waitForTimeout(500);

          // Verify only items from selected category are visible
          const visibleItems = await page.locator('[data-testid="checklist-item"]:visible').count();
          expect(visibleItems).toBeGreaterThan(0);
          
          // Verify all visible items belong to selected category
          const visibleCategories = await page.locator('[data-testid="checklist-item"]:visible [data-testid="item-category"]').allTextContents();
          for (const category of visibleCategories) {
            expect(category).toBe(pdf.expectedCategories[0]);
          }
        }
      });
    }
  }

  test('Upload validation and error handling', async ({ page }) => {
    await page.goto('/upload');
    await page.waitForLoadState('networkidle');

    // Test file size validation (if applicable)
    await test.step('Test invalid file type', async () => {
      // Try to upload a non-PDF file
      const invalidFilePath = path.join(__dirname, '..', 'package.json');
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(invalidFilePath);
      
      await page.click('[data-testid="upload-button"]');
      
      // Wait for error message
      const errorMessage = await page.locator('[data-testid="upload-error"]').textContent();
      expect(errorMessage).toContain('PDF');
    });

    await test.step('Test missing language selection', async () => {
      // Upload valid file but don't select language
      const validFilePath = path.join(__dirname, '..', 'pdfs', TEST_PDFS[0].fileName);
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(validFilePath);
      
      // Don't select language, just click upload
      await page.click('[data-testid="upload-button"]');
      
      // Verify validation error
      const errorMessage = await page.locator('[data-testid="validation-error"]').textContent();
      expect(errorMessage).toContain('language');
    });
  });

  test('Bilingual document comparison', async ({ page }) => {
    const testPdf = TEST_PDFS[0]; // Use the first PDF for comparison
    
    const documentIds: Record<string, string> = {};
    
    // Upload the same document in both languages
    for (const language of LANGUAGES) {
      await page.goto('/upload');
      await page.waitForLoadState('networkidle');

      const filePath = path.join(__dirname, '..', 'pdfs', testPdf.fileName);
      
      await page.locator('input[type="file"]').setInputFiles(filePath);
      await page.selectOption('[data-testid="language-select"]', language.code);
      await page.click('[data-testid="upload-button"]');
      
      await page.waitForSelector('[data-testid="upload-success"]', { timeout: 30000 });
      
      // Extract document ID
      const docId = await page.evaluate(() => {
        const url = new URL(window.location.href);
        return url.searchParams.get('documentId') || 
               document.querySelector('[data-document-id]')?.getAttribute('data-document-id');
      });
      
      documentIds[language.code] = docId!;
    }

    // Compare the extracted items between languages
    const englishItems = await page.goto(`/checklist/${documentIds.en}`);
    await page.waitForLoadState('networkidle');
    const enItemCount = await page.locator('[data-testid="checklist-item"]').count();

    await page.goto(`/checklist/${documentIds.ar}`);
    await page.waitForLoadState('networkidle');
    const arItemCount = await page.locator('[data-testid="checklist-item"]').count();

    // Items count should be similar (within reasonable range)
    const difference = Math.abs(enItemCount - arItemCount);
    const tolerance = Math.max(1, Math.floor(Math.max(enItemCount, arItemCount) * 0.3)); // 30% tolerance
    expect(difference).toBeLessThanOrEqual(tolerance);
  });

  test('Export functionality', async ({ page }) => {
    // First upload a document
    const testPdf = TEST_PDFS[0];
    await page.goto('/upload');
    await page.waitForLoadState('networkidle');

    const filePath = path.join(__dirname, '..', 'pdfs', testPdf.fileName);
    await page.locator('input[type="file"]').setInputFiles(filePath);
    await page.selectOption('[data-testid="language-select"]', 'en');
    await page.click('[data-testid="upload-button"]');
    
    await page.waitForSelector('[data-testid="upload-success"]', { timeout: 30000 });
    
    const documentId = await page.evaluate(() => {
      const url = new URL(window.location.href);
      return url.searchParams.get('documentId') || 
             document.querySelector('[data-document-id]')?.getAttribute('data-document-id');
    });

    // Navigate to checklist
    await page.goto(`/checklist/${documentId}`);
    await page.waitForLoadState('networkidle');

    // Update some item statuses
    const firstItem = page.locator('[data-testid="checklist-item"]').first();
    await firstItem.locator('[data-testid="item-status-select"]').selectOption('yes');
    await page.waitForTimeout(1000);

    // Test export functionality
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-button"]');
    const download = await downloadPromise;

    // Verify the download
    expect(download.suggestedFilename()).toContain('.xlsx');
    
    // Save the file and verify it exists
    const downloadPath = path.join(__dirname, 'downloads', download.suggestedFilename());
    await download.saveAs(downloadPath);
    
    // Basic file existence check
    const fs = require('fs');
    expect(fs.existsSync(downloadPath)).toBeTruthy();
  });
});

test.describe('Document Management', () => {
  test('Document list view and filtering', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'test@compliance.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');

    // Navigate to dashboard/document list
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Verify document list is present
    const documentList = page.locator('[data-testid="document-list"]');
    await expect(documentList).toBeVisible();

    // Test search functionality if available
    const searchBox = page.locator('[data-testid="document-search"]');
    if (await searchBox.isVisible()) {
      await searchBox.fill('CBUAE');
      await page.waitForTimeout(500);
      
      // Verify filtered results
      const filteredDocs = await page.locator('[data-testid="document-item"]').count();
      expect(filteredDocs).toBeGreaterThan(0);
    }

    // Test document deletion if available
    const firstDocument = page.locator('[data-testid="document-item"]').first();
    if (await firstDocument.locator('[data-testid="delete-document"]').isVisible()) {
      await firstDocument.locator('[data-testid="delete-document"]').click();
      
      // Confirm deletion
      await page.click('[data-testid="confirm-delete"]');
      
      // Verify document was removed
      await page.waitForTimeout(1000);
      const remainingDocs = await page.locator('[data-testid="document-item"]').count();
      // Should have one less document
    }
  });
});