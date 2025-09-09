import { hash } from "bcrypt";
import { config } from 'dotenv';
import { connectToDatabase } from "./mongodb";
import { User } from "./models/compliance";

// Load environment variables
config();

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    console.log('MongoDB URI:', process.env.MONGODB_URI);
    
    await connectToDatabase();
    console.log('Connected to MongoDB successfully');

    // Check if admin already exists
    console.log('Checking for existing admin user...');
    const existingAdmin = await User.findOne({ email: "admin@example.com" });
    if (existingAdmin) {
      console.log("Admin user already exists");
      return;
    }

    // Create admin user
    console.log('Creating admin user...');
    const hashedPassword = await hash("Admin@123", 12);
    const adminUser = await User.create({
      email: "admin@example.com",
      password: hashedPassword,
      name: "Admin User",
      role: "admin",
      status: "active",
    });

    console.log("Admin user created successfully:", adminUser);
  } catch (error) {
    console.error("Error seeding database:", error);
    console.error("Full error:", JSON.stringify(error, null, 2));
  } finally {
    // Give time for the operation to complete before exiting
    setTimeout(() => process.exit(), 1000);
  }
}

seed();
