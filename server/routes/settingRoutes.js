const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const Admin = require('../models/Admin');
const { authMiddleware, requireAdmin } = require('../middleware/authMiddleware');

// ────────────────────────────────────────────────────────────
// GET CURRENT SETTINGS — GET /settings
// ────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({}); // Create defaults if none exist
    }
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ────────────────────────────────────────────────────────────
// UPDATE SETTINGS — PUT /settings
// ────────────────────────────────────────────────────────────
router.put('/', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const settings = await Settings.findOneAndUpdate({}, req.body, { new: true, upsert: true });
    res.status(200).json({ success: true, message: 'Global settings updated', data: settings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ────────────────────────────────────────────────────────────
// UPDATE ADMIN PROFILE — PUT /settings/profile
// ────────────────────────────────────────────────────────────
router.put('/profile', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { name, email } = req.body;
    const admin = await Admin.findByIdAndUpdate(req.user.id, { name, email }, { new: true });
    res.status(200).json({ success: true, message: 'Profile updated', data: admin });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
