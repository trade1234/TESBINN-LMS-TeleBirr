const mongoose = require('mongoose');

// In serverless (Vercel), cache the connection across invocations to avoid
// reconnect storms and cold-start penalties.
const globalForMongoose = globalThis;
if (!globalForMongoose.__mongooseCache) {
  globalForMongoose.__mongooseCache = { conn: null, promise: null };
}

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('MONGODB_URI is not set');
  }

  const cache = globalForMongoose.__mongooseCache;
  if (cache.conn) {
    return cache.conn;
  }

  if (!cache.promise) {
    cache.promise = mongoose.connect(mongoUri).then((mongooseInstance) => mongooseInstance);
  }

  cache.conn = await cache.promise;
  return cache.conn;
};

module.exports = connectDB;
