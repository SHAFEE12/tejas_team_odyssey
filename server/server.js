const dns = require('dns');

dns.setServers([
  '8.8.8.8',
  '1.1.1.1'
]);

require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');

const connectDB = require('./config/db');
const { PORT } = require('./config/env');

const authRoutes = require('./routes/auth.routes');

const app = express();

// CORS
const clientOrigin = process.env.CLIENT_URL
  ? (
      process.env.CLIENT_URL.includes(',')
        ? process.env.CLIENT_URL.split(',').map(s => s.trim())
        : process.env.CLIENT_URL.trim()
    )
  : [
      'http://localhost:5173',
      'http://localhost:5174'
    ];

app.use(
  cors({
    origin: clientOrigin,
    credentials: true
  })
);

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader(
    'Referrer-Policy',
    'strict-origin-when-cross-origin'
  );
  next();
});

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(
  express.urlencoded({
    extended: true,
    limit: '10mb'
  })
);

// Avatar files
app.use(
  '/uploads/avatars',
  express.static(
    path.join(__dirname, 'uploads', 'avatars')
  )
);

// ===============================
// AUTH
// ===============================

app.use('/api/auth', authRoutes);

// ===============================
// HEALTH CHECK
// ===============================

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CareerOdyssey API is running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// ===============================
// 404
// ===============================

app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

// ===============================
// ERROR HANDLER
// ===============================

app.use((err, req, res, next) => {
  const isProd = process.env.NODE_ENV === 'production';
  const status = err.status || err.statusCode || 500;

  console.error(
    `[Error Handler] ${status} - ${err.message}`
  );

  res.status(status).json({
    success: false,
    message:
      isProd && status === 500
        ? 'An unexpected internal error occurred. Please try again later.'
        : err.message || 'Internal Server Error'
  });
});

// ===============================
// START SERVER
// ===============================

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(
        `CareerOdyssey server running on port ${PORT}`
      );
    });
  } catch (error) {
    console.error(
      'Failed to start server:',
      error.message
    );

    process.exit(1);
  }
};

startServer();