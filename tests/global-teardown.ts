import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global test teardown...');
  
  try {
    // Clean up test data
    await cleanupTestData();
    console.log('✅ Test data cleaned up');
    
    // Close database connections if needed
    await cleanupConnections();
    console.log('✅ Connections closed');
    
    console.log('🎉 Global teardown completed successfully');
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw here - teardown failures shouldn't fail the tests
  }
}

async function cleanupTestData() {
  // Clean up test documents, users, etc.
  // This prevents test data from accumulating
  
  try {
    const { Document } = require('../src/lib/db/models/compliance');
    const { User } = require('../src/lib/db/models/user');
    
    // Delete test documents (documents uploaded during tests)
    await Document.deleteMany({ 
      fileName: { 
        $regex: /test|CBUAE|Typology|Circular/i 
      }
    });
    
    // Optionally keep the test user for next run, or delete it
    // await User.deleteOne({ email: 'test@compliance.com' });
    
    console.log('Test data cleanup completed');
  } catch (error) {
    console.error('Error during test data cleanup:', error);
  }
}

async function cleanupConnections() {
  // Close database connections
  try {
    const mongoose = require('mongoose');
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
  }
}

export default globalTeardown;