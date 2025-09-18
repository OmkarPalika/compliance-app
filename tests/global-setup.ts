import { chromium, FullConfig } from '@playwright/test';
import { connectToDatabase } from '../src/lib/db/mongodb';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global test setup...');
  
  try {
    // Connect to database
    await connectToDatabase();
    console.log('✅ Database connection established');
    
    // Seed test data if needed
    await seedTestData();
    console.log('✅ Test data seeded');
    
    // Create test user for authentication
    await createTestUser();
    console.log('✅ Test user created');
    
    console.log('🎉 Global setup completed successfully');
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  }
}

async function seedTestData() {
  // Add any test data seeding logic here
  // For example, create test documents, users, etc.
  
  // This is just a placeholder - implement based on your needs
  console.log('Seeding test data...');
}

async function createTestUser() {
  // Create a test user for authentication
  // This should use your existing user creation logic
  
  const bcrypt = require('bcrypt');
  const { User } = require('../src/lib/db/models/user');
  
  try {
    // Check if test user already exists
    const existingUser = await User.findOne({ email: 'test@compliance.com' });
    
    if (!existingUser) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      const testUser = new User({
        email: 'test@compliance.com',
        password: hashedPassword,
        name: 'Test User',
        role: 'admin'
      });
      
      await testUser.save();
      console.log('Test user created successfully');
    } else {
      console.log('Test user already exists');
    }
  } catch (error) {
    console.error('Error creating test user:', error);
    // Don't throw here - user might already exist
  }
}

export default globalSetup;