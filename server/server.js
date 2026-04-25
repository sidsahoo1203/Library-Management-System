// ============================================================
// Library Management System - Backend Server
// Tech: Node.js + Express + MongoDB (Mongoose)
// ============================================================

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const bookRoutes = require('./routes/bookRoutes');
const issueRoutes = require('./routes/issueRoutes');
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const settingRoutes = require('./routes/settingRoutes');
const Admin = require('./models/Admin');
const bcrypt = require('bcryptjs');
const morgan = require('morgan');
const startCronJobs = require('./cron/mailer');

const app = express();

const normalizeOrigin = (origin = '') => origin.trim().replace(/\/$/, '');

const allowedOrigins = new Set(
  (process.env.CLIENT_URL || 'http://localhost:3000')
    .split(',')
    .map((origin) => normalizeOrigin(origin))
    .filter(Boolean)
);

const originRegex = process.env.CLIENT_URL_REGEX
  ? new RegExp(process.env.CLIENT_URL_REGEX)
  : null;

const corsOptions = {
  origin(origin, callback) {
    const normalizedOrigin = normalizeOrigin(origin || '');

    // Allow non-browser clients (no Origin header) and configured frontends.
    if (
      !origin ||
      allowedOrigins.has(normalizedOrigin) ||
      originRegex?.test(normalizedOrigin)
    ) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
};

// ── Middleware ───────────────────────────────────────────────
app.use(cors(corsOptions));
app.use(express.json());
// Add production level request logging for monitoring
app.use(morgan('tiny'));

// Serve PDF E-Books statically
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Health Endpoint ─────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', message: 'Library API is perfectly healthy.' });
});

// ── MongoDB Connection ──────────────────────────────────────
// Mongoose connects to the MongoDB database using the URI
// stored in our .env file. This keeps credentials secure.
mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB successfully');
    startCronJobs();
    const adminExists = await Admin.findOne({ email: 'admin@library.com' });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await Admin.create({ email: 'admin@library.com', password: hashedPassword });
      console.log('✅ Automatically seeded default admin: admin@library.com / admin123');
    }
  })
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// ── API Routes ──────────────────────────────────────────────
app.use('/auth', authRoutes);
app.use('/books', bookRoutes);
app.use('/students', studentRoutes);
app.use('/payment', paymentRoutes);
app.use('/settings', settingRoutes);
app.use('/', issueRoutes);

// Root route – health check
app.get('/', (req, res) => {
  res.json({ message: 'Library Management System API is running 📚' });
});

// ── Start Server ────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
