const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Issue = require('../models/Issue');
const { authMiddleware, requireAdmin } = require('../middleware/authMiddleware');

// ────────────────────────────────────────────────────────────
// GET ALL STUDENTS (Admin Only) — GET /students
// ────────────────────────────────────────────────────────────
router.get('/', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 });

    // We can also aggregate their total fines or active issues here to make the table richer
    const studentData = await Promise.all(students.map(async (student) => {
      const issues = await Issue.find({ studentId: student._id });
      const activeIssues = issues.filter(i => i.status === 'Issued').length;
      const totalFines = issues.reduce((acc, curr) => acc + (curr.fineAmount || 0), 0);
      
      return {
        ...student._doc,
        activeIssues,
        totalFines
      };
    }));

    res.status(200).json({ success: true, count: studentData.length, data: studentData });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch students', error: error.message });
  }
});

// ────────────────────────────────────────────────────────────
// SECURE DELETE STUDENT (Admin Only) — POST /students/:id/delete
// Requires Admin password to confirm
// ────────────────────────────────────────────────────────────
router.post('/:id/delete', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { password } = req.body;
    const studentId = req.params.id;

    // 1. Verify Admin Password
    const Admin = require('../models/Admin');
    const bcrypt = require('bcryptjs');
    const admin = await Admin.findById(req.user.id);
    
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid password. Security verification failed.' });
    }
    
    // 2. Proceed with deletion
    const deletedStudent = await Student.findByIdAndDelete(studentId);
    if (!deletedStudent) return res.status(404).json({ success: false, message: 'Student not found' });

    // 3. CASCADING DELETE
    await Issue.deleteMany({ studentId: studentId });

    res.status(200).json({ success: true, message: 'Student and history deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Delete failed', error: error.message });
  }
});

module.exports = router;
