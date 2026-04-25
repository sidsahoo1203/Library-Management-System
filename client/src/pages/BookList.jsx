import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllBooks, deleteBook, issueBook, requestBook } from '../api/api';

const BookList = ({ user }) => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [availability, setAvailability] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Modals specific to Admin
  const [issueModal, setIssueModal] = useState({ open: false, book: null });
  const [studentEmail, setStudentEmail] = useState('');
  
  const [alert, setAlert] = useState(null);
  
  const navigate = useNavigate();

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const res = await getAllBooks({ search, availability, page });
      setBooks(res.data.data);
      setTotalPages(res.data.totalPages);
    } catch (error) {
      console.error("Error fetching books:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchBooks();
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [search, availability, page]);

  // Admin Actions
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this book?")) {
      try {
        await deleteBook(id);
        setAlert({ type: 'success', msg: 'Book deleted successfully' });
        fetchBooks();
      } catch (error) {
        setAlert({ type: 'error', msg: 'Failed to delete book' });
      }
    }
  };

  const handleAdminIssue = async (e) => {
    e.preventDefault();
    try {
      await issueBook({ bookId: issueModal.book._id, studentEmail });
      setAlert({ type: 'success', msg: `Book issued successfully!` });
      setIssueModal({ open: false, book: null });
      setStudentEmail('');
      fetchBooks();
    } catch (error) {
      setAlert({ type: 'error', msg: error.response?.data?.message || 'Failed to issue book' });
    }
  };

  // Student Actions
  const handleStudentRequest = async (id) => {
    try {
      await requestBook(id);
      setAlert({ type: 'success', msg: 'Book requested successfully!' });
      fetchBooks();
    } catch (error) {
      setAlert({ type: 'error', msg: error.response?.data?.message || 'Failed to request book' });
    }
  };

  return (
    <div>
      <header className="page-header">
        <h2>{user?.role === 'admin' ? 'Manage Catalog' : 'Library Catalog'}</h2>
        <p>Browse, search, and discover your next read.</p>
      </header>

      {alert && (
        <div className={`alert alert-${alert.type}`}>
          {alert.type === 'success' ? '✅' : '❌'} {alert.msg}
          <button style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }} onClick={() => setAlert(null)}>✕</button>
        </div>
      )}

      <div className="search-bar" style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '25px', background: 'var(--card-bg)', padding: '15px', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
        <div className="search-input-wrap" style={{ flex: 1, position: 'relative' }}>
          <span className="search-icon" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)' }}>🔍</span>
          <input 
            type="text" 
            placeholder="Search title, author, or category..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '45px', border: 'none', background: 'var(--bg-color)' }}
          />
        </div>
        <select 
          value={availability} 
          onChange={(e) => { setAvailability(e.target.value); setPage(1); }}
          style={{ padding: '12px 20px', borderRadius: 'var(--radius)', border: 'none', background: 'var(--bg-color)', outline: 'none', width: '200px', cursor: 'pointer' }}
        >
          <option value="">Filter Status...</option>
          <option value="available">Available Only</option>
          <option value="issued">Issued Only</option>
        </select>
        {user?.role === 'admin' && (
          <button className="btn btn-primary" onClick={() => navigate('/add-book')} style={{ padding: '12px 24px' }}>
            ➕ Add Book
          </button>
        )}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="loading-wrap" style={{ padding: '60px' }}>
            <div className="spinner"></div>
            <p>Fetching collection...</p>
          </div>
        ) : books.length > 0 ? (
          <>
            <div className="table-wrapper" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
              <table style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>Title & Author</th>
                    <th>Category & Year</th>
                    <th>Availability</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {books.map((book) => (
                    <tr key={book._id}>
                      <td>
                        <strong className="text-accent" style={{ display: 'block', marginBottom: '4px', fontSize: '15px' }}>{book.title}</strong>
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>by {book.author}</span>
                      </td>
                      <td>
                        <span style={{ display: 'block', marginBottom: '4px' }}>{book.category}</span>
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{book.publishedYear}</span>
                      </td>
                      <td>
                        <span className={`badge ${book.availableCopies > 0 ? 'badge-available' : 'badge-issued'}`}>
                          {book.availableCopies} available
                        </span>
                      </td>
                      <td>
                        <div className="actions-row">
                          {user?.role === 'admin' ? (
                            <>
                              <button className="btn btn-sm btn-success" disabled={book.availableCopies === 0} onClick={() => setIssueModal({ open: true, book })}>Issue</button>
                              <button className="btn btn-sm btn-outline" onClick={() => navigate(`/edit-book/${book._id}`)}>Edit</button>
                              <button className="btn btn-sm btn-danger" onClick={() => handleDelete(book._id)}>Delete</button>
                            </>
                          ) : (
                            <button className="btn btn-sm btn-primary" disabled={book.availableCopies === 0} onClick={() => handleStudentRequest(book._id)}>
                              Request Book
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', padding: '20px', alignItems: 'center', background: '#f8fafc', borderTop: '1px solid var(--border-color)' }}>
                <button className="btn btn-sm btn-outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>← prev</button>
                <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-muted)' }}>Page {page} of {totalPages}</span>
                <button className="btn btn-sm btn-outline" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>next →</button>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state" style={{ padding: '60px', textAlign: 'center' }}>
            <div className="empty-icon" style={{ fontSize: '48px', marginBottom: '15px' }}>📂</div>
            <h3 style={{ marginBottom: '8px' }}>No matching titles</h3>
            <p className="text-muted">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>

      {/* ── Admin Issue Modal ────────────────────────────────── */}
      {issueModal.open && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}>
          <div className="card" style={{ width: '400px', padding: '30px', animation: 'scaleUp 0.2s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Issue Book at Desk</h3>
              <button aria-label="Close" onClick={() => setIssueModal({ open: false, book: null })} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
            </div>
            <form onSubmit={handleAdminIssue}>
              <div className="form-group mb-4" style={{ marginBottom: '20px', background: '#f8fafc', padding: '15px', borderRadius: '8px' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Target Book:</div>
                <strong style={{ fontSize: '16px' }}>{issueModal.book.title}</strong>
              </div>
              <div className="form-group" style={{ marginBottom: '30px' }}>
                <label>Student Email</label>
                <input type="email" placeholder="student@university.edu" required value={studentEmail} onChange={(e) => setStudentEmail(e.target.value)} autoFocus />
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>Student must be registered in the system first.</p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setIssueModal({ open: false, book: null })}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Confirm Issue</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookList;
