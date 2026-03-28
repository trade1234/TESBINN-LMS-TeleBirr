const mongoose = require('mongoose');

// In serverless (Vercel), cache the connection across invocations to avoid
// reconnect storms and cold-start penalties.
const globalForMongoose = globalThis;
if (!globalForMongoose.__mongooseCache) {
  globalForMongoose.__mongooseCache = { conn: null, promise: null };
}

const isSrvDnsFailure = (error) =>
  error &&
  (error.code === 'ETIMEOUT' || error.code === 'ENOTFOUND') &&
  error.syscall === 'querySrv';

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_DIRECT_URI || process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('MongoDB connection string is not set. Define MONGODB_URI or MONGODB_DIRECT_URI.');
  }

  const cache = globalForMongoose.__mongooseCache;
  if (cache.conn) {
    return cache.conn;
  }

  if (!cache.promise) {
    cache.promise = mongoose
      .connect(mongoUri)
      .then((mongooseInstance) => mongooseInstance)
      .catch((error) => {
        cache.promise = null;

        if (isSrvDnsFailure(error)) {
          error.message =
            `MongoDB SRV lookup failed for "${error.hostname}". ` +
            'Your machine could not resolve the Atlas DNS record. ' +
            'Set MONGODB_DIRECT_URI to a non-SRV mongodb:// connection string or fix local DNS/network access.';
        }

        throw error;
      });
  }

  cache.conn = await cache.promise;
  return cache.conn;
};

module.exports = connectDB;
