const colors = require('colors');
const app = require('./app');

const PORT = process.env.PORT || 5000;
const isRecoverableMongoDnsError = (err) =>
  process.env.NODE_ENV === 'development' &&
  err &&
  (err.code === 'ETIMEOUT' || err.code === 'ENOTFOUND') &&
  err.syscall === 'querySrv';

const server = app.listen(
  PORT,
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold
  )
);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`.red);

  if (isRecoverableMongoDnsError(err)) {
    console.log('Server kept alive because this MongoDB DNS failure is recoverable during local development.'.yellow);
    return;
  }

  // Close server & exit process
  server.close(() => process.exit(1));
});
