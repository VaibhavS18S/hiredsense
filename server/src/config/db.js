const mongoose = require('mongoose');

let mongodInstance = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (uri && uri.trim() !== '') {
    try {
      console.log('Connecting to configured MongoDB URI...');
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`Connected to MongoDB Atlas / Remote: ${conn.connection.host}`);
      return conn;
    } catch (err) {
      console.warn(`Failed to connect to configured MongoDB URI (${err.message}). Trying fallback options...`);
    }
  }

  // Next, try local default MongoDB instance
  try {
    const localUri = 'mongodb://127.0.0.1:27017/hiresense';
    console.log(`Attempting local MongoDB connection at ${localUri}...`);
    const conn = await mongoose.connect(localUri, {
      serverSelectionTimeoutMS: 2000,
    });
    console.log(`Connected to local MongoDB instance: ${conn.connection.host}`);
    return conn;
  } catch (localErr) {
    console.log('Local MongoDB not running or unreachable. Starting in-memory MongoDB server...');
  }

  // Fallback to MongoMemoryServer
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongodInstance = await MongoMemoryServer.create();
    const memUri = mongodInstance.getUri();
    const conn = await mongoose.connect(memUri);
    console.log(`Connected to In-Memory MongoDB Server at: ${memUri}`);
    return conn;
  } catch (memErr) {
    console.error('Fatal: Could not connect to any MongoDB instance or In-Memory server:', memErr.message);
    throw memErr;
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongodInstance) {
      await mongodInstance.stop();
    }
  } catch (e) {
    console.error('Error during DB disconnect:', e);
  }
};

module.exports = { connectDB, disconnectDB };
