import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { getMyIssuedBooks, payFine } from '../api/api';

const MyBooks = ({ user }) => {
  const [myRecords, setMyRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [alert, setAlert] = useState(null);

  // Derived stats
  const pendingRequests = myRecords.filter(r => r.status === 'Pending').length;
  const activeIssues = myRecords.filter(r => r.status === 'Issued').length;
  const totalFines = myRecords.reduce((acc, curr) => acc + (curr.fineAmount || 0), 0);

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

    // Check URL for payment success callback
    if (searchParams.get('payment') === 'success') {
      setAlert({ type: 'success', msg: 'Payment successful! Your fine has been cleared.' });
      setSearchParams({}); // Clear url
    } else if (searchParams.get('payment') === 'cancelled') {
      setAlert({ type: 'error', msg: 'Payment was cancelled.' });
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const handlePayFine = async (issueId) => {
    try {
      const res = await payFine(issueId);
      if (res.data.url) {
        window.location.href = res.data.url; // Redirect to Stripe
      }
    } catch (error) {
      setAlert({ type: 'error', msg: 'Failed to initiate payment gateway.' });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  return (
    <div>
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>Welcome, {user?.name || 'Student'} 👋</h2>
          <p>This is your personal dashboard. Monitor your active checkouts, track due dates, and view your reading history.</p>
        </div>
        <div style={{ background: 'white', padding: '10px', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: 'var(--shadow-sm)' }}>
          <QRCodeSVG value={user?._id || 'unknown'} size={90} />
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '5px', fontWeight: 'bold' }}>Digital ID Card</span>
        </div>
      </header>

      {alert && (
        <div className={`alert alert-${alert.type}`} style={{ marginBottom: '20px' }}>
          {alert.type === 'success' ? '✅' : '❌'} {alert.msg}
          <button style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }} onClick={() => setAlert(null)}>✕</button>
        </div>
      )}

      {/* ── Student Key Metrics ──────────────────────── */}
      <div className="stats-grid" style={{ marginBottom: '40px' }}>
        <div className="stat-card green">
          <div className="stat-icon" style={{ color: 'var(--success-color)', background: 'var(--bg-color)' }}>📚</div>
          <div className="stat-label">Active Checked Out</div>
          <div className="stat-value">{activeIssues}</div>
        </div>
        <div className="stat-card amber">
          <div className="stat-icon" style={{ color: 'var(--warning-color)', background: 'var(--bg-color)' }}>⏳</div>
          <div className="stat-label">Pending Requests</div>
          <div className="stat-value">{pendingRequests}</div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon" style={{ color: 'var(--danger-color)', background: 'var(--bg-color)' }}>💰</div>
          <div className="stat-label">Unpaid Fines</div>
          <div className="stat-value">${totalFines}</div>
        </div>
      </div>

      <h3 style={{ marginBottom: '20px' }}>My Library Record</h3>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="loading-wrap" style={{ padding: '60px' }}>
            <div className="spinner"></div>
            <p>Loading your profile...</p>
          </div>
        ) : myRecords.length > 0 ? (
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
            <table style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Book Details</th>
                  <th>Request / Issue Date</th>
                  <th>Due Date</th>
                  <th>Fine/Debt</th>
                  <th>Current Status</th>
                </tr>
              </thead>
              <tbody>
                {myRecords.map((record) => (
                  <tr key={record._id}>
                    <td>
                      <div>
                        <strong className="text-accent" style={{ display: 'block' }}>{record.bookId?.title || 'Unknown'}</strong>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>by {record.bookId?.author}</div>
                      </div>
                    </td>
                    <td>
                      {record.status === 'Pending' ? (
                        <span className="text-muted" style={{ fontStyle: 'italic', fontSize: '13px' }}>Requested: {formatDate(record.createdAt)}</span>
                      ) : (
                        <span>{formatDate(record.issueDate)}</span>
                      )}
                    </td>
                    <td>
                      {record.status === 'Issued' ? (
                        <span style={{ color: new Date(record.dueDate) < new Date() ? 'var(--danger-color)' : 'inherit', fontWeight: new Date(record.dueDate) < new Date() ? '600' : 'normal' }}>
                          {formatDate(record.dueDate)}
                        </span>
                      ) : '—'}
                    </td>
                    <td>
                      {record.fineAmount > 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ color: 'var(--danger-color)', fontWeight: 'bold' }}>${record.fineAmount}</span>
                          <button className="btn btn-sm btn-primary" onClick={() => handlePayFine(record._id)}>Pay Now</button>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>$0</span>
                      )}
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
          <div className="empty-state" style={{ textAlign: 'center', padding: '60px 0' }}>
            <div className="empty-icon" style={{ fontSize: '48px', marginBottom: '15px' }}>📖</div>
            <h3 style={{ marginBottom: '10px' }}>Your shelf is empty</h3>
            <p className="text-muted">Head over to the Catalog to request your first book!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBooks;
