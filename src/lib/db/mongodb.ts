import mongoose from 'mongoose';
import { config } from 'dotenv';
import path from 'path';

// Load environment variables from the root .env file
config({ path: path.resolve(process.cwd(), '.env') });

let MONGODB_URI = process.env.MONGODB_URI as string;

// Ensure the URI includes the database name
if (MONGODB_URI && MONGODB_URI.endsWith('/')) {
  MONGODB_URI = `${MONGODB_URI}compliance-checklist`;
}

console.log('Current working directory:', process.cwd());
console.log('Environment variables loaded:', process.env.MONGODB_URI ? 'Yes' : 'No');
console.log('MONGODB_URI:', MONGODB_URI);

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

interface GlobalMongoose {
  mongoose: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

declare global {
  var mongoose: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  } | undefined;
}

let cached = (global as GlobalMongoose).mongoose;

if (!cached) {
  cached = (global as GlobalMongoose).mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}
