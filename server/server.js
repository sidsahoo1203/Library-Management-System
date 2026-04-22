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
const Admin = require('./models/Admin');
const bcrypt = require('bcryptjs');

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

// ── MongoDB Connection ──────────────────────────────────────
// Mongoose connects to the MongoDB database using the URI
// stored in our .env file. This keeps credentials secure.
mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB successfully');
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
