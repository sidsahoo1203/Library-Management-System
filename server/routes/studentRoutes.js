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

module.exports = router;
