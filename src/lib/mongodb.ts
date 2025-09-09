import { MongoClient, MongoClientOptions } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your MongoDB URI to .env.local');
}

const uri = process.env.MONGODB_URI;
const options: MongoClientOptions = {
  maxPoolSize: 10,
  minPoolSize: 5,
};

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

class Singleton {
  private static _instance: Promise<MongoClient>;

  public static get instance(): Promise<MongoClient> {
    if (!this._instance) {
      this._instance = MongoClient.connect(uri, options);
    }
    return this._instance;
  }
}

const clientPromise = process.env.NODE_ENV === 'development' 
  ? global._mongoClientPromise || (global._mongoClientPromise = Singleton.instance)
  : Singleton.instance;

export default clientPromise;
