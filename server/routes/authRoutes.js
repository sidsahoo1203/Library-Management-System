const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Student = require('../models/Student');

// ────────────────────────────────────────────────────────────
// ADMIN LOGIN — POST /auth/login
// ────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Case-insensitive admin lookup
    const admin = await Admin.findOne({ 
      email: { $regex: new RegExp(`^${email.trim()}$`, 'i') } 
    });
    
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }

    const payload = {
      id: admin._id,
      role: 'admin'
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.status(200).json({
      success: true,
      message: 'Admin logged in',
      token,
      role: 'admin'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Login failed', error: error.message });
  }
});

// ────────────────────────────────────────────────────────────
// STUDENT REGISTER — POST /auth/student/register
// ────────────────────────────────────────────────────────────
router.post('/student/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    const existingStudent = await Student.findOne({ email });
    if (existingStudent) {
      return res.status(400).json({ success: false, message: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const student = new Student({
      name,
      email,
      password: hashedPassword,
      phone
    });

    await student.save();

    res.status(201).json({ success: true, message: 'Student registered successfully. Please login.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Registration failed', error: error.message });
  }
});

// ────────────────────────────────────────────────────────────
// STUDENT LOGIN — POST /auth/student/login
// ────────────────────────────────────────────────────────────
router.post('/student/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Case-insensitive student lookup
    const student = await Student.findOne({ 
      email: { $regex: new RegExp(`^${email.trim()}$`, 'i') } 
    });

    if (!student) {
      return res.status(401).json({ success: false, message: 'Invalid student credentials' });
    }

    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid student credentials' });
    }

    const payload = {
      id: student._id,
      role: 'student',
      name: student.name
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({
      success: true,
      message: 'Student logged in',
      token,
      role: 'student'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Login failed', error: error.message });
  }
});

// ────────────────────────────────────────────────────────────
// VERIFY TOKEN — GET /auth/verify
// ────────────────────────────────────────────────────────────
router.get('/verify', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch actual user data to include name in the response
    let userDoc;
    if (decoded.role === 'admin') {
      userDoc = await Admin.findById(decoded.id);
    } else {
      userDoc = await Student.findById(decoded.id);
    }

    if (!userDoc) return res.status(401).json({ success: false, message: 'User no longer exists' });

    res.status(200).json({ 
      success: true, 
      user: { 
        id: decoded.id, 
        role: decoded.role, 
        name: userDoc.name 
      } 
    });
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
});

// ────────────────────────────────────────────────────────────
// CHANGE PASSWORD — PUT /auth/change-password
// ────────────────────────────────────────────────────────────
const { authMiddleware } = require('../middleware/authMiddleware');

router.put('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    let user;
    if (req.user.role === 'admin') {
      user = await Admin.findById(req.user.id);
    } else {
      user = await Student.findById(req.user.id);
    }

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Current password incorrect' });

    // Hash and save new password
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update password', error: error.message });
  }
});

module.exports = router;
