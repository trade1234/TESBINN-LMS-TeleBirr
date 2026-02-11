const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const path = require('path');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');

// Load env vars (local/dev)
dotenv.config({ path: './.env' });

// Route files
const auth = require('./routes/auth');
const users = require('./routes/users');
const courses = require('./routes/courses');
const modules = require('./routes/modules');
const lessons = require('./routes/lessons');
const enrollments = require('./routes/enrollments');
const categories = require('./routes/categories');
const files = require('./routes/files');
const certificates = require('./routes/certificates');
const adverts = require('./routes/adverts');
const schedules = require('./routes/schedules');
const payments = require('./routes/payments');
const notifications = require('./routes/notifications');
const announcements = require('./routes/announcements');
const dashboard = require('./routes/dashboard');
const analytics = require('./routes/analytics');
const blog = require('./routes/blog');
const youtube = require('./routes/youtube');

const app = express();
app.set('trust proxy', 1);

// Body parser
app.use(express.json());
app.use(
  mongoSanitize({
    replaceWith: '_',
  })
);

// Enable CORS
const defaultOrigins = [
  'https://tesbinn.com',   
  'https://www.tesbinn.com',
  'http://tesbinn.com',       
  'https://tesbinn-lms-frontend.vercel.app',
  'http://localhost:8081',                
  'http://172.16.0.2:8081',
  'http://44.209.130.119',
  'http://13.222.168.70/api/v1/payments/telebirr/create-order'
];
const envOrigins = [process.env.ALLOWED_ORIGINS, process.env.FRONTEND_URL].filter(Boolean);
const allowedOriginsString = [defaultOrigins.join(','), ...envOrigins].join(',');
const normalizeOrigin = (value) => {
  if (!value) return '';
  try {
    return new URL(value).origin;
  } catch {
    return value.trim();
  }
};
const allowedOrigins = allowedOriginsString
  .split(',')
  .map((origin) => normalizeOrigin(origin))
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      const normalizedOrigin = normalizeOrigin(origin);
      if (allowedOrigins.includes(normalizedOrigin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    exposedHeaders: ['Retry-After', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset']
  })
);

// Serverless-safe DB connection:
// On Vercel, if you connect at module load and it fails, the function crashes
// before CORS headers get set. This middleware ensures CORS runs first and DB
// connection errors become a normal JSON 500 response.
app.use(async (req, res, next) => {
  // Allow basic health checks without DB.
  if (req.path === '/api/v1/health' || req.path === '/health') {
    next();
    return;
  }

  // Only connect for API routes.
  if (!req.path.startsWith('/api/')) {
    next();
    return;
  }

  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ success: true, data: { status: 'ok' } });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    environment: process.env.NODE_ENV || 'unknown',
  });
});

// Mount routers
app.use('/api/v1/auth', auth);
app.use('/api/v1/users', users);
app.use('/api/v1/courses', courses);
app.use('/api/v1/modules', modules);
app.use('/api/v1/lessons', lessons);
app.use('/api/v1/enrollments', enrollments);
app.use('/api/v1/categories', categories);
app.use('/api/v1/files', files);
app.use('/api/v1/certificates', certificates);
app.use('/api/v1/adverts', adverts);
app.use('/api/v1/schedules', schedules);
app.use('/api/v1/payments', payments);
app.use('/api/v1/notifications', notifications);
app.use('/api/v1/announcements', announcements);
app.use('/api/v1/dashboard', dashboard);
app.use('/api/v1/analytics', analytics);
app.use('/api/v1/blog', blog);
app.use('/api/v1/youtube', youtube);

app.use(errorHandler);

module.exports = app;
