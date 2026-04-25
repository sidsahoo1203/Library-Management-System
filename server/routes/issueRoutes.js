const express = require('express');
const router = express.Router();
const Issue = require('../models/Issue');
const Book = require('../models/Book');
const Student = require('../models/Student');
const Settings = require('../models/Settings');
const { authMiddleware, requireAdmin, requireStudent } = require('../middleware/authMiddleware');

// ────────────────────────────────────────────────────────────
// ADMIN ONLY: DIRECT ISSUE BOOK — POST /issue
// ────────────────────────────────────────────────────────────
router.post('/issue', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { bookId, studentEmail } = req.body;

    const book = await Book.findById(bookId);
    if (!book || book.availableCopies <= 0) {
      return res.status(400).json({ success: false, message: 'Book not available' });
    }

    // Find student (Case-insensitive search)
    const student = await Student.findOne({ 
      email: { $regex: new RegExp(`^${studentEmail.trim()}$`, 'i') } 
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found in system. They must register first.' });
    }

    // 🛡️ DUPLICATE CHECK: Don't allow issuing the same book twice to the same student
    const existingIssue = await Issue.findOne({ 
      bookId, 
      studentId: student._id,
      status: { $in: ['Pending', 'Issued'] }
    });

    if (existingIssue) {
      return res.status(400).json({ 
        success: false, 
        message: `Student already has an active record (Status: ${existingIssue.status}) for this book.` 
      });
    }

    // Fetch global settings for loan duration
    const settings = await Settings.findOne() || { loanDurationDays: 14 };

    const issueDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(issueDate.getDate() + settings.loanDurationDays);

    const issue = new Issue({
      bookId,
      studentId: student._id,
      studentName: student.name, // keep for backward compatibility visually
      issueDate,
      dueDate,
      status: 'Issued',
    });
    
    const savedIssue = await issue.save();
    book.availableCopies -= 1;
    await book.save();

    res.status(201).json({ success: true, message: 'Book issued successfully', data: savedIssue });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to issue book', error: error.message });
  }
});

// ────────────────────────────────────────────────────────────
// STUDENT ONLY: REQUEST BOOK — POST /request
// ────────────────────────────────────────────────────────────
router.post('/request', authMiddleware, requireStudent, async (req, res) => {
  try {
    const { bookId } = req.body;

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    // Check if student already requested or issued this book
    const existingIssue = await Issue.findOne({ 
      bookId, 
      studentId: req.user.id,
      status: { $in: ['Pending', 'Issued'] }
    });

    if (existingIssue) {
      return res.status(400).json({ success: false, message: 'You already requested or have this book.' });
    }

    // If no copies, push to waitlist
    if (book.availableCopies <= 0) {
      // Check if already in waitlist
      const inWaitlist = book.waitlist.some(w => w.studentId.toString() === req.user.id);
      if (inWaitlist) return res.status(400).json({ success: false, message: 'You are already on the waitlist.' });

      book.waitlist.push({ studentId: req.user.id });
      await book.save();
      return res.status(201).json({ success: true, message: 'No copies left. You have been added to the waitlist!' });
    }

    const student = await Student.findById(req.user.id);

    const issue = new Issue({
      bookId,
      studentId: student._id,
      studentName: student.name,
      status: 'Pending',
    });
    
    await issue.save();

    res.status(201).json({ success: true, message: 'Book requested successfully. Waiting for admin approval.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to request book', error: error.message });
  }
});

// ────────────────────────────────────────────────────────────
// ADMIN ONLY: APPROVE/REJECT REQUEST & RETURN BOOK — PUT /status/:id
// ────────────────────────────────────────────────────────────
router.put('/status/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { action } = req.body; // 'approve', 'reject', 'return'
    const issue = await Issue.findById(req.params.id);
    
    if (!issue) return res.status(404).json({ success: false, message: 'Record not found' });

    if (action === 'approve' && issue.status === 'Pending') {
      const book = await Book.findById(issue.bookId);
      if (book.availableCopies <= 0) return res.status(400).json({ success: false, message: 'No copies left' });

      // Fetch global settings for loan duration
      const settings = await Settings.findOne() || { loanDurationDays: 14 };

      issue.status = 'Issued';
      issue.issueDate = new Date();
      issue.dueDate = new Date();
      issue.dueDate.setDate(issue.issueDate.getDate() + settings.loanDurationDays);
      
      book.availableCopies -= 1;
      await book.save();
      await issue.save();
      return res.status(200).json({ success: true, message: 'Request approved' });

    } else if (action === 'reject' && issue.status === 'Pending') {
      issue.status = 'Rejected';
      await issue.save();
      
      // CRITICAL AUDIT FIX: Only increment if this was a waitlist reservation
      // Normal requests don't decrement copies until 'approve'
      if (issue.isWaitlistAuto) {
        const book = await Book.findById(issue.bookId);
        if (book) {
          book.availableCopies += 1;
          await book.save();
        }
        return res.status(200).json({ success: true, message: 'Waitlist reservation rejected. Copy returned to inventory.' });
      }
      
      return res.status(200).json({ success: true, message: 'Request rejected' });

    } else if (action === 'return' && issue.status === 'Issued') {
      const returnDate = new Date();
      issue.status = 'Returned';
      issue.returnDate = returnDate;

      if (issue.dueDate && returnDate > issue.dueDate) {
        const settings = await Settings.findOne() || { finePerDay: 10 };
        const diffTime = returnDate.getTime() - issue.dueDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        issue.fineAmount = diffDays * settings.finePerDay;
      }
      
      await issue.save();

        // WAITLIST AUTOMATION
        const book = await Book.findById(issue.bookId);
        if (book.waitlist && book.waitlist.length > 0) {
          const nextInLine = book.waitlist.shift();
          const student = await Student.findById(nextInLine.studentId);
          
          const newIssue = new Issue({
            bookId: book._id,
            studentId: student._id,
            studentName: student.name,
            status: 'Pending',
            isWaitlistAuto: true // Flag this as a reservation
          });
          await newIssue.save();
          await book.save();

          // 📧 SEND NOTIFICATION EMAIL
          try {
            const nodemailer = require('nodemailer');
            const transporter = nodemailer.createTransport({
              service: 'gmail',
              auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
            });
            
            await transporter.sendMail({
              from: `"University Library" <${process.env.EMAIL_USER}>`,
              to: student.email,
              subject: '📖 Book Available: ' + book.title,
              text: `Good news ${student.name}!\n\nThe book "${book.title}" you were waiting for has been returned and is now reserved for you.\n\nPlease visit the library within the next 48 hours to collect it.\n\nThank you!`
            });
          } catch (mailErr) {
            console.error('Waitlist email failed:', mailErr.message);
          }

          return res.status(200).json({ success: true, message: 'Book returned. Automatically assigned to ' + student.name + ' from waitlist!', fine: issue.fineAmount });
        } else {
          book.availableCopies += 1;
          await book.save();
          return res.status(200).json({ success: true, message: 'Book returned successfully', fine: issue.fineAmount });
        }
    
    } else if (action === 'resolve-fine') {
      issue.fineAmount = 0;
      await issue.save();
      return res.status(200).json({ success: true, message: 'Fine resolved/paid' });
    }

    return res.status(400).json({ success: false, message: 'Invalid action or state' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Action failed', error: error.message });
  }
});

// ────────────────────────────────────────────────────────────
// ADMIN ONLY: GET ALL ISSUES — GET /issued
// ────────────────────────────────────────────────────────────
router.get('/issued', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const issues = await Issue.find()
      .populate('bookId', 'title author category') 
      .populate('studentId', 'email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: issues.length, data: issues });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch issues', error: error.message });
  }
});

// ────────────────────────────────────────────────────────────
// STUDENT ONLY: GET MY ISSUES — GET /issued/me
// ────────────────────────────────────────────────────────────
router.get('/issued/me', authMiddleware, requireStudent, async (req, res) => {
  try {
    const issues = await Issue.find({ studentId: req.user.id })
      .populate('bookId', 'title author category') 
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: issues.length, data: issues });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch personal records', error: error.message });
  }
});

// ────────────────────────────────────────────────────────────
// ADMIN ONLY: DELETE RECORD — DELETE /status/:id
// ────────────────────────────────────────────────────────────
router.delete('/status/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const deletedRecord = await Issue.findByIdAndDelete(req.params.id);
    if (!deletedRecord) return res.status(404).json({ success: false, message: 'Record not found' });
    
    res.status(200).json({ success: true, message: 'Record deleted permanently' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Delete failed', error: error.message });
  }
});

// ────────────────────────────────────────────────────────────
// STUDENT ONLY: RENEW BOOK — PUT /renew/:id
// Extends due date if no one is on the waitlist
// ────────────────────────────────────────────────────────────
router.put('/renew/:id', authMiddleware, requireStudent, async (req, res) => {
  try {
    const issue = await Issue.findOne({ _id: req.params.id, studentId: req.user.id });
    if (!issue) return res.status(404).json({ success: false, message: 'Issue record not found' });
    if (issue.status !== 'Issued') return res.status(400).json({ success: false, message: 'Only currently issued books can be renewed' });

    // Check waitlist
    const book = await Book.findById(issue.bookId);
    if (book.waitlist && book.waitlist.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot renew. Other students are waiting for this book!' 
      });
    }

    // Get loan duration from settings
    const Settings = require('../models/Settings');
    const settings = await Settings.findOne() || { loanDurationDays: 14 };

    // Extend due date
    const currentDueDate = new Date(issue.dueDate);
    currentDueDate.setDate(currentDueDate.getDate() + settings.loanDurationDays);
    
    issue.dueDate = currentDueDate;
    await issue.save();

    res.status(200).json({ 
      success: true, 
      message: `Successfully renewed! Your new due date is ${currentDueDate.toLocaleDateString()}`,
      newDueDate: currentDueDate
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Renewal failed', error: error.message });
  }
});

module.exports = router;
