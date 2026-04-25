import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { addBook, getBookById, updateBook } from '../api/api';

const AddBook = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    category: '',
    publishedYear: new Date().getFullYear(),
    availableCopies: 1,
  });

  const [loading, setLoading] = useState(isEditMode);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      const fetchBook = async () => {
        try {
          const res = await getBookById(id);
          const book = res.data.data;
          setFormData({
            title: book.title,
            author: book.author,
            category: book.category,
            publishedYear: book.publishedYear,
            availableCopies: book.availableCopies,
          });
        } catch (err) {
          setError('Failed to load book details');
        } finally {
          setLoading(false);
        }
      };
      fetchBook();
    }
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'publishedYear' || name === 'availableCopies' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      if (isEditMode) {
        await updateBook(id, formData);
      } else {
        await addBook(formData);
      }
      navigate('/books');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-wrap">
        <div className="spinner"></div>
        <p>Loading book data...</p>
      </div>
    );
  }

  return (
    <div>
      <header className="page-header">
        <h2>{isEditMode ? 'Edit Book' : 'Add New Book'}</h2>
        <p>{isEditMode ? 'Update book information in the database.' : 'Add a new title to your library collection.'}</p>
      </header>

      <div className="card" style={{ maxWidth: '800px' }}>
        <h3 className="card-title">{isEditMode ? 'Modify Book Details' : 'Book Details'}</h3>
        
        {error && <div className="alert alert-error">❌ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group full-width">
              <label htmlFor="title">Book Title</label>
              <input
                type="text"
                id="title"
                name="title"
                required
                placeholder="e.g. The Great Gatsby"
                value={formData.title}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="author">Author</label>
              <input
                type="text"
                id="author"
                name="author"
                required
                placeholder="e.g. F. Scott Fitzgerald"
                value={formData.author}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                name="category"
                required
                value={formData.category}
                onChange={handleChange}
              >
                <option value="">Select Category</option>
                <option value="Fiction">Fiction</option>
                <option value="Non-Fiction">Non-Fiction</option>
                <option value="Science">Science</option>
                <option value="History">History</option>
                <option value="Technology">Technology</option>
                <option value="Biography">Biography</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="publishedYear">Published Year</label>
              <input
                type="number"
                id="publishedYear"
                name="publishedYear"
                required
                min="1000"
                max={new Date().getFullYear()}
                value={formData.publishedYear}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="availableCopies">Number of Copies</label>
              <input
                type="number"
                id="availableCopies"
                name="availableCopies"
                required
                min="0"
                value={formData.availableCopies}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="modal-actions" style={{ marginTop: '32px' }}>
            <button type="button" className="btn btn-outline" onClick={() => navigate('/books')}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : (isEditMode ? 'Update Book' : 'Add Book')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBook;
