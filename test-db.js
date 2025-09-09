import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function testConnection() {
  try {
    console.log('Environment variables:');
    console.log('MONGODB_URI:', process.env.MONGODB_URI);
    
    console.log('\nAttempting to connect to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/compliance-checklist');
    console.log('Successfully connected to MongoDB!');
    
    // Create a simple test document
    const Test = mongoose.model('Test', new mongoose.Schema({ name: String }));
    await Test.create({ name: 'test' });
    console.log('Successfully created test document!');
    
    const count = await Test.countDocuments();
    console.log('Number of test documents:', count);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

testConnection();
