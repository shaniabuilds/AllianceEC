const mongoose = require('mongoose');

const connectDB = async () => {
  const primaryUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/elearning_db';
  
  try {
    // 1. Try Primary MongoDB URI (MongoDB Atlas or configured database)
    const conn = await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`[MongoDB Core] Connected to MongoDB: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.warn(`[MongoDB Core] Primary MongoDB connection failed (${error.message}).`);
    
    // 2. Try Fallback Local MongoDB Daemon if primaryUri wasn't already local
    const fallbackLocalUri = 'mongodb://127.0.0.1:27017/elearning_db';
    if (primaryUri !== fallbackLocalUri) {
      try {
        console.log(`[MongoDB Core] Trying fallback local daemon (${fallbackLocalUri})...`);
        const localConn = await mongoose.connect(fallbackLocalUri, {
          serverSelectionTimeoutMS: 3000,
        });
        console.log(`[MongoDB Core] Connected to Fallback Local Daemon: ${localConn.connection.host}/${localConn.connection.name}`);
        return localConn;
      } catch (localError) {
        console.warn(`[MongoDB Core] Local daemon offline: ${localError.message}`);
      }
    }

    // 3. Try MongoMemoryServer as last resort
    try {
      console.log(`[MongoDB Core] Initializing MongoMemoryServer fallback...`);
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      const memConn = await mongoose.connect(uri);
      console.log(`[MongoDB Core] Connected to In-Memory Daemon: ${memConn.connection.host}/${memConn.connection.name}`);
      console.warn(`[MongoDB Core ⚠️ WARNING] RUNNING ON IN-MEMORY DATABASE! Data will NOT persist after server restart. Check your internet connection or MongoDB Atlas network access.`);
      return memConn;
    } catch (memError) {
      console.error(`[MongoDB Core Fatal] Failed to establish MongoDB connection: ${memError.message}`);
      console.error(`[MongoDB Core Advice] Please verify your internet connection or install/start local MongoDB daemon (brew services start mongodb-community).`);
    }
  }
};

module.exports = connectDB;

