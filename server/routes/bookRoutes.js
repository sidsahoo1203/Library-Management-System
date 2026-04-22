// ============================================================
// Book Routes — CRUD Operations
// Demonstrates: Create, Read, Update, Delete with MongoDB
// ============================================================

const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const { authMiddleware, requireAdmin } = require('../middleware/authMiddleware');

// ────────────────────────────────────────────────────────────
// CREATE — POST /books
// Inserts a new book document into the "books" collection
// ────────────────────────────────────────────────────────────
router.post('/', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const book = new Book(req.body);
    const savedBook = await book.save(); // MongoDB insertOne()
    res.status(201).json({
      success: true,
      message: 'Book added successfully',
      data: savedBook,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to add book',
      error: error.message,
    });
  }
});

// ────────────────────────────────────────────────────────────
// READ ALL — GET /books
// Retrieves all book documents from the "books" collection
// Supports search by title or author via query parameter
// ────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { search, availability, page = 1, limit = 10 } = req.query;
    let filter = {};

    // If search query is provided, filter by title, author, or category
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }

    if (availability === 'available') {
      filter.availableCopies = { $gt: 0 };
    } else if (availability === 'issued') {
      filter.availableCopies = 0;
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const books = await Book.find(filter).skip(skip).limit(limitNum);
    const totalCount = await Book.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: books.length,
      total: totalCount,
      page: pageNum,
      totalPages: Math.ceil(totalCount / limitNum),
      data: books,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch books',
      error: error.message,
    });
  }
});

// ────────────────────────────────────────────────────────────
// READ ONE — GET /books/:id
// Retrieves a single book document by its MongoDB _id
// ────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id); // MongoDB findOne({ _id })
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      });
    }
    res.status(200).json({ success: true, data: book });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch book',
      error: error.message,
    });
  }
});

// ────────────────────────────────────────────────────────────
// UPDATE — PUT /books/:id
// Updates an existing book document in MongoDB
// ────────────────────────────────────────────────────────────
router.put('/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const updatedBook = await Book.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true } // Return updated doc & validate
    );
    if (!updatedBook) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      });
    }
    res.status(200).json({
      success: true,
      message: 'Book updated successfully',
      data: updatedBook,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update book',
      error: error.message,
    });
  }
});

// ────────────────────────────────────────────────────────────
// DELETE — DELETE /books/:id
// Removes a book document from the "books" collection
// ────────────────────────────────────────────────────────────
router.delete('/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const deletedBook = await Book.findByIdAndDelete(req.params.id);
    if (!deletedBook) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      });
    }
    res.status(200).json({
      success: true,
      message: 'Book deleted successfully',
      data: deletedBook,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete book',
      error: error.message,
    });
  }
});

module.exports = router;
