// ============================================================
// Issue Model (Mongoose Schema)
// Collection: "issues" in MongoDB
// ============================================================
// This schema tracks which book is issued to which student.
// The bookId field is a reference (ObjectId) to the Book collection,
// demonstrating MongoDB's approach to relationships between documents.
// ============================================================

const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema(
  {
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book', // Reference to the Book model (populate)
      required: [true, 'Book ID is required'],
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student', // Reference to the new Student model
    },
    studentName: {
      type: String, // Keeping this for backwards compatibility
      required: [true, 'Student name is required'],
      trim: true,
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
    },
    returnDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['Pending', 'Issued', 'Returned', 'Rejected'],
      default: 'Pending',
    },
    fineAmount: {
      type: Number,
      default: 0
    },
    stripeSessionId: {
      type: String,
      default: null
    },
    reminderSent: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Issue', issueSchema);
