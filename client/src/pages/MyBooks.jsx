import React, { useState, useEffect } from 'react';
import { getMyIssuedBooks } from '../api/api';

const MyBooks = () => {
  const [myRecords, setMyRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyRecords = async () => {
      try {
        const res = await getMyIssuedBooks();
        setMyRecords(res.data.data);
      } catch (error) {
        console.error("Error fetching personal records:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMyRecords();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  return (
    <div>
      <header className="page-header">
        <h2>My Issued Books</h2>
        <p>Monitor your active checkouts, track due dates, and view your reading history.</p>
      </header>

      <div className="card">
        {loading ? (
          <div className="loading-wrap">
            <div className="spinner"></div>
            <p>Loading your records...</p>
          </div>
        ) : myRecords.length > 0 ? (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Book Details</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th>Fine/Debt</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {myRecords.map((record) => (
                  <tr key={record._id}>
                    <td>
                      <div>
                        <strong className="text-accent">{record.bookId?.title || 'Unknown'}</strong>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{record.bookId?.author}</div>
                      </div>
                    </td>
                    <td>{formatDate(record.issueDate)}</td>
                    <td>
                      {record.status === 'Issued' ? (
                        <span style={{ color: new Date(record.dueDate) < new Date() ? 'var(--danger-color)' : 'inherit', fontWeight: new Date(record.dueDate) < new Date() ? '600' : 'normal' }}>
                          {formatDate(record.dueDate)}
                        </span>
                      ) : '—'}
                    </td>
                    <td>
                      {record.fineAmount > 0 
                        ? <span style={{ color: 'var(--danger-color)', fontWeight: 'bold' }}>${record.fineAmount}</span> 
                        : <span style={{ color: 'var(--success-color)' }}>$0</span>}
                    </td>
                    <td>
                      <span className={`badge badge-${record.status.toLowerCase()}`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state" style={{ textAlign: 'center', padding: '40px 0' }}>
            <div className="empty-icon" style={{ fontSize: '48px', marginBottom: '10px' }}>📚</div>
            <h3 style={{ marginBottom: '10px' }}>No Books Yet</h3>
            <p className="text-muted">You haven't requested or issued any books from the library.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBooks;
