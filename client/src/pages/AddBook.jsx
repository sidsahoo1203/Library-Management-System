import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { addBook, getBookById, updateBook, uploadPdf } from '../api/api';

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
    isbn: '',
    coverImageUrl: '',
    pdfUrl: ''
  });

  const [pdfFile, setPdfFile] = useState(null);
  const [isbnSearch, setIsbnSearch] = useState('');
  const [isSearchingIsbn, setIsSearchingIsbn] = useState(false);

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

  const handleIsbnSearch = async () => {
    if (!isbnSearch) return;
    setIsSearchingIsbn(true);
    setError('');
    
    // Clean the ISBN (remove dashes and spaces)
    const cleanIsbn = isbnSearch.replace(/[- ]/g, '');

    try {
      // Switched to OpenLibrary API since Google Books strictly rate limits IPs
      const response = await fetch(`https://openlibrary.org/search.json?q=${cleanIsbn}`);
      const data = await response.json();
      
      if (data.docs && data.docs.length > 0) {
        const bookInfo = data.docs[0];
        
        // OpenLibrary structures covers by cover_i ID
        const coverUrl = bookInfo.cover_i 
          ? `https://covers.openlibrary.org/b/id/${bookInfo.cover_i}-L.jpg` 
          : '';

        setFormData(prev => ({
          ...prev,
          title: bookInfo.title || prev.title,
          author: bookInfo.author_name ? bookInfo.author_name.join(', ') : prev.author,
          category: bookInfo.subject ? bookInfo.subject[0] : prev.category,
          publishedYear: bookInfo.first_publish_year || prev.publishedYear,
          isbn: cleanIsbn,
          coverImageUrl: coverUrl
        }));
      } else {
        setError('No book found with this ISBN. Please check the number.');
      }
    } catch (err) {
      setError('Failed to fetch book data from API.');
    } finally {
      setIsSearchingIsbn(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      let finalFormData = { ...formData };
      
      // If a PDF file was selected, upload it first
      if (pdfFile) {
        const fileData = new FormData();
        fileData.append('pdf', pdfFile);
        const uploadRes = await uploadPdf(fileData);
        if (uploadRes.data.success && uploadRes.data.pdfUrl) {
          finalFormData.pdfUrl = uploadRes.data.pdfUrl;
        }
      }

      if (isEditMode) {
        await updateBook(id, finalFormData);
      } else {
        await addBook(finalFormData);
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
        
        {!isEditMode && (
          <div style={{ marginBottom: '25px', padding: '15px', background: 'var(--bg-color)', borderRadius: 'var(--radius)', display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
              <label>Magic ISBN Auto-Fill 🪄</label>
              <input type="text" placeholder="Enter ISBN (e.g., 9780141182636)" value={isbnSearch} onChange={(e) => setIsbnSearch(e.target.value)} />
            </div>
            <button type="button" className="btn btn-primary" onClick={handleIsbnSearch} disabled={isSearchingIsbn}>
              {isSearchingIsbn ? 'Searching...' : 'Fetch Metadata'}
            </button>
          </div>
        )}

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

            <div className="form-group full-width">
              <label htmlFor="pdfFile">Upload Digital E-Book (PDF) <span style={{color:'var(--text-muted)'}}>- Optional</span></label>
              <input
                type="file"
                id="pdfFile"
                accept="application/pdf"
                onChange={(e) => setPdfFile(e.target.files[0])}
                style={{ padding: '10px', background: 'white', border: '1px dashed var(--border-color)', width: '100%' }}
              />
              {formData.pdfUrl && !pdfFile && (
                <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--success-color)' }}>
                  ✅ Current E-Book uploaded: <a href={formData.pdfUrl} target="_blank" rel="noreferrer">View PDF</a>
                </div>
              )}
            </div>

            {formData.coverImageUrl && (
              <div className="form-group full-width" style={{ display: 'flex', gap: '15px', alignItems: 'center', background: '#f8fafc', padding: '15px', borderRadius: '8px' }}>
                <img src={formData.coverImageUrl} alt="Book Cover" style={{ height: '80px', borderRadius: '4px', boxShadow: 'var(--shadow-sm)' }} />
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Cover image fetched successfully from Google Books API.</div>
              </div>
            )}
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
