import React, { useState, useEffect } from 'react';
import { getAllBooks, deleteBook, requestBook, getAllStudents, issueBook } from '../api/api';
import { useNavigate } from 'react-router-dom';

const BookList = ({ user }) => {
  const [books, setBooks] = useState([]);
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [availability, setAvailability] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  // Waitlist Modal State
  const [waitlistModal, setWaitlistModal] = useState({ open: false, list: [], title: '' });
  
  // Issue Modal State
  const [issueModal, setIssueModal] = useState({ open: false, book: null });
  const [selectedStudent, setSelectedStudent] = useState('');
  const [isIssuing, setIsIssuing] = useState(false);

  const isAdmin = user && user.role === 'admin';

  useEffect(() => {
    fetchBooks();
    if (isAdmin) fetchStudents();
  }, [search, availability, page, isAdmin]);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const res = await getAllBooks({ search, availability, page, limit: 12 });
      setBooks(res.data.data);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      setError('Failed to fetch books');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await getAllStudents();
      setStudents(res.data.data);
    } catch (err) {
      console.error('Failed to fetch students');
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1); // Reset to first page on search
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this book?')) {
      try {
        await deleteBook(id);
        fetchBooks();
      } catch (err) {
        setError('Failed to delete book');
      }
    }
  };

  const handleRequest = async (bookId) => {
    try {
      setSuccess('');
      setError('');
      const res = await requestBook(bookId);
      setSuccess(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to request book');
    }
  };

  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return alert('Please select a student');

    setIsIssuing(true);
    try {
      const student = students.find(s => s._id === selectedStudent);
      await issueBook({ bookId: issueModal.book._id, studentEmail: student.email });
      
      setSuccess(`Book successfully issued to ${student.name}!`);
      setIssueModal({ open: false, book: null });
      setSelectedStudent('');
      fetchBooks();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to issue book');
    } finally {
      setIsIssuing(false);
    }
  };

  return (
    <div className="catalog-container" style={{ paddingBottom: '60px' }}>
      <header className="page-header">
        <h2>📚 Library Catalog</h2>
        <p>{isAdmin ? 'Manage inventory and handle desk checkouts.' : 'Browse the library and request your next read.'}</p>
      </header>

      <div className="card toolbar" style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '25px', padding: '15px' }}>
        <div className="search-bar" style={{ flex: 1, position: 'relative' }}>
          <span className="search-icon" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)' }}>🔍</span>
          <input
            type="text"
            placeholder="Search by title, author, or category..."
            value={search}
            onChange={handleSearchChange}
            style={{ paddingLeft: '45px', width: '100%' }}
          />
        </div>
        <div className="filters" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select
            value={availability}
            onChange={(e) => { setAvailability(e.target.value); setPage(1); }}
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', minWidth: '150px' }}
          >
            <option value="">All Status</option>
            <option value="available">Available</option>
            <option value="unavailable">Out of Stock</option>
          </select>
          {isAdmin && (
            <button 
              className="btn btn-primary" 
              onClick={() => navigate('/add-book')}
              style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 20px' }}
            >
              <span style={{ fontSize: '18px' }}>+</span> Add New Book
            </button>
          )}
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '20px' }}>❌ {error}</div>}
      {success && <div className="alert alert-success" style={{ marginBottom: '20px' }}>✅ {success}</div>}

      {loading ? (
        <div className="loading-wrap">
          <div className="spinner"></div>
          <p>Loading catalog...</p>
        </div>
      ) : (
        <>
          <div className="book-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '25px', minHeight: '400px' }}>
            {books.length > 0 ? (
              books.map((book) => (
                <div key={book._id} className="book-card card" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'all 0.3s' }}>
                  <div style={{ position: 'relative', height: '220px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {book.coverImageUrl ? (
                      <img src={book.coverImageUrl} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ fontSize: '64px' }}>📖</div>
                    )}
                    
                    <div style={{ 
                      position: 'absolute', top: '12px', right: '12px',
                      padding: '5px 15px', borderRadius: '25px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase',
                      backgroundColor: book.availableCopies > 0 ? '#10b981' : '#ef4444',
                      color: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      {book.availableCopies > 0 ? 'Available' : 'Issued'}
                    </div>

                    {isAdmin && book.waitlist?.length > 0 && (
                      <div 
                        onClick={() => setWaitlistModal({ open: true, list: book.waitlist, title: book.title })}
                        style={{ 
                          position: 'absolute', top: '12px', left: '12px',
                          padding: '5px 12px', borderRadius: '25px', fontSize: '10px', fontWeight: '700',
                          backgroundColor: '#f59e0b', color: 'white', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: '5px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                      >
                        ⏳ {book.waitlist.length} Waiting
                      </div>
                    )}
                  </div>
                  
                  <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h4 style={{ margin: '0 0 5px 0', fontSize: '18px', fontWeight: '700' }}>{book.title}</h4>
                    <p style={{ margin: '0 0 15px 0', color: 'var(--text-muted)', fontSize: '14px' }}>by {book.author}</p>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                      <span style={{ padding: '4px 12px', background: '#f3f4f6', borderRadius: '6px', fontSize: '12px', fontWeight: '500' }}>{book.category}</span>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: book.availableCopies > 0 ? '#059669' : '#dc2626' }}>{book.availableCopies} Left</span>
                    </div>
                  </div>
                  
                  <div style={{ padding: '15px 20px', borderTop: '1px solid #f3f4f6', display: 'flex', gap: '10px', background: '#fafafa' }}>
                    {isAdmin ? (
                      <>
                        <button 
                          className="btn btn-primary btn-sm" 
                          style={{ flex: 1.5, fontSize: '13px', whiteSpace: 'nowrap' }}
                          disabled={book.availableCopies === 0}
                          onClick={() => setIssueModal({ open: true, book })}
                        >
                          Issue Book 🤝
                        </button>
                        <button 
                          className="btn btn-outline btn-sm" 
                          style={{ flex: 1, fontSize: '13px' }} 
                          onClick={() => navigate(`/edit-book/${book._id}`)}
                        >
                          Edit ✏️
                        </button>
                        <button 
                          className="btn btn-outline btn-sm" 
                          style={{ flex: 0.5, borderColor: '#fee2e2', color: '#ef4444' }} 
                          onClick={() => handleDelete(book._id)}
                        >
                          🗑️
                        </button>
                      </>
                    ) : (
                      <>
                        {book.availableCopies > 0 ? (
                          <button className="btn btn-primary btn-sm" style={{ flex: 2 }} onClick={() => handleRequest(book._id)}>Request Book</button>
                        ) : (
                          <button className="btn btn-outline btn-sm" style={{ flex: 2, borderColor: 'var(--warning-color)', color: 'var(--warning-color)' }} onClick={() => handleRequest(book._id)}>Join Waitlist ⏳</button>
                        )}
                        {book.pdfUrl && (
                          <a href={book.pdfUrl} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{ flex: 1, textAlign: 'center' }}>Read 💻</a>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '80px 20px' }}>
                <div style={{ fontSize: '64px', marginBottom: '20px' }}>🏜️</div>
                <h3>No books found</h3>
                <p className="text-muted">Try adjusting your search or filters.</p>
              </div>
            )}
          </div>

          {/* ── Pagination Footer ────────────────────────────── */}
          {totalPages > 1 && (
            <div className="pagination" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginTop: '40px' }}>
              <button 
                className="btn btn-outline" 
                disabled={page === 1} 
                onClick={() => setPage(page - 1)}
                style={{ padding: '10px 20px' }}
              >
                ← Previous
              </button>
              <span style={{ fontWeight: '700', color: 'var(--text-muted)' }}>Page {page} of {totalPages}</span>
              <button 
                className="btn btn-outline" 
                disabled={page === totalPages} 
                onClick={() => setPage(page + 1)}
                style={{ padding: '10px 20px' }}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Waitlist Info Modal ────────────────────────────── */}
      {waitlistModal.open && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, backdropFilter: 'blur(4px)' }}>
          <div className="card" style={{ width: '400px', padding: '25px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Queue for "{waitlistModal.title}"</h3>
              <button onClick={() => setWaitlistModal({ open: false, list: [], title: '' })} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#9ca3af' }}>×</button>
            </div>
            
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {waitlistModal.list.map((entry, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '12px', borderBottom: '1px solid #f3f4f6' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700' }}>
                    {idx + 1}
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '14px' }}>
                      {entry.studentId?.name || 'Registered Student'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Joined: {entry.joinedAt ? new Date(entry.joinedAt).toLocaleDateString() : 'Just now'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '20px', textAlign: 'center', fontStyle: 'italic' }}>
              Students will be auto-notified and assigned when the book is returned.
            </p>
            
            <button className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }} onClick={() => setWaitlistModal({ open: false, list: [], title: '' })}>Close View</button>
          </div>
        </div>
      )}

      {/* ── Admin Direct Issue Modal ───────────────────────── */}
      {issueModal.open && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, backdropFilter: 'blur(4px)' }}>
          <div className="card" style={{ width: '450px', padding: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0 }}>Issue Book at Desk</h3>
              <button onClick={() => setIssueModal({ open: false, book: null })} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#9ca3af' }}>×</button>
            </div>
            <p style={{ color: 'var(--text-muted)', marginBottom: '25px', fontSize: '14px' }}>
              Select a student to issue <strong>{issueModal.book.title}</strong> to.
            </p>
            
            <form onSubmit={handleIssueSubmit}>
              <div className="form-group" style={{ marginBottom: '30px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>Select Registered Student</label>
                <select 
                  value={selectedStudent} 
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  required
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#f9fafb' }}
                >
                  <option value="">-- Choose Student --</option>
                  {students.map(s => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({s.email})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setIssueModal({ open: false, book: null })}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isIssuing}>
                  {isIssuing ? 'Processing...' : 'Confirm Issue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookList;
