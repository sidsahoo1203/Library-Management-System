// ============================================================
// Book Model (Mongoose Schema)
// Collection: "books" in MongoDB
// ============================================================
// MongoDB stores data as JSON-like documents inside collections.
// Each book is a document with the fields defined below.
// Mongoose provides schema validation and convenient methods.
// ============================================================

const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Book title is required'],
      trim: true,
    },
    author: {
      type: String,
      required: [true, 'Author name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    publishedYear: {
      type: Number,
      required: [true, 'Published year is required'],
    },
    availableCopies: {
      type: Number,
      required: [true, 'Available copies count is required'],
      min: [0, 'Available copies cannot be negative'],
    },
    isbn: {
      type: String,
      trim: true,
    },
    coverImageUrl: {
      type: String,
    },
    pdfUrl: {
      type: String,
    },
    waitlist: [{
      studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
      dateJoined: { type: Date, default: Date.now }
    }],
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields automatically
  }
);

module.exports = mongoose.model('Book', bookSchema);
