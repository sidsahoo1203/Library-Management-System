import React, { useState, useEffect } from 'react';
import { getMyIssuedBooks, payFine, renewBook } from '../api/api';
import { QRCodeSVG } from 'qrcode.react';

const MyBooks = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRenewing, setIsRenewing] = useState(false);
  const [alert, setAlert] = useState(null);

  let user = null;
  try {
    const userStr = localStorage.getItem('user');
    if (userStr && userStr !== 'undefined') {
      user = JSON.parse(userStr);
    }
  } catch (e) {
    console.error("Failed to parse user");
  }

  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    try {
      const res = await getMyIssuedBooks();
      setIssues(res.data.data || []);
    } catch (err) {
      console.error('Issues fetch error');
    } finally {
      setLoading(false);
    }
  };

  const handleRenew = async (id) => {
    try {
      setIsRenewing(true);
      const res = await renewBook(id);
      setAlert({ type: 'success', msg: res.data.message });
      fetchIssues();
    } catch (err) {
      setAlert({ type: 'error', msg: err.response?.data?.message || 'Failed' });
    } finally {
      setIsRenewing(false);
    }
  };

  if (loading) return <div className="loading-wrap"><div className="spinner"></div></div>;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      
      {/* ── HEADER ────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <div>
          <h2 style={{ fontSize: '26px', fontWeight: '800', margin: 0 }}>Welcome, {user?.name || 'Student'} 👋</h2>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0', fontSize: '13px' }}>Your library dashboard.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '8px 15px', background: 'var(--card-bg)', borderRadius: '10px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: '700', fontSize: '12px' }}>Digital ID</div>
            <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{user?.id?.slice(-6).toUpperCase()}</div>
          </div>
          <QRCodeSVG value={user?.email || 'error'} size={35} />
        </div>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type}`} style={{ marginBottom: '20px', padding: '12px' }}>
          {alert.type === 'success' ? '✅' : '❌'} {alert.msg}
        </div>
      )}

      {/* ── COMPACT STATS ─────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '25px' }}>
        {[
          { label: 'Active Books', value: issues.filter(i => i.status === 'Issued').length, color: 'blue', icon: '📚' },
          { label: 'Requests', value: issues.filter(i => i.status === 'Pending').length, color: 'amber', icon: '⏳' },
          { label: 'Fines Due', value: `$${issues.reduce((a, c) => a + (c.fineAmount || 0), 0)}`, color: 'red', icon: '💰' }
        ].map((s, i) => (
          <div key={i} className={`stat-card ${s.color}`} style={{ padding: '15px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '20px', background: 'rgba(255,255,255,0.2)', padding: '8px', borderRadius: '8px' }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: '11px', opacity: 0.9, fontWeight: '600' }}>{s.label}</div>
              <div style={{ fontSize: '20px', fontWeight: '800' }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── ACTIVITY TABLE ────────────────────────────────── */}
      <div className="card" style={{ padding: '20px' }}>
        <h4 style={{ marginBottom: '15px', fontSize: '15px' }}>Recent Activity</h4>
        <div className="table-wrapper">
          <table style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Book</th>
                <th>Status</th>
                <th>Due Date</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {issues.length > 0 ? (
                issues.map(issue => (
                  <tr key={issue._id}>
                    <td>
                      <div style={{ fontWeight: '700', fontSize: '13px' }}>{issue.bookId?.title || 'Book Title'}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{issue.bookId?.author}</div>
                    </td>
                    <td><span className={`badge badge-${issue.status.toLowerCase()}`} style={{ fontSize: '10px' }}>{issue.status}</span></td>
                    <td style={{ fontWeight: '600', fontSize: '12px' }}>{issue.dueDate ? new Date(issue.dueDate).toLocaleDateString() : '-'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        {issue.status === 'Issued' && (
                          <button className="btn btn-primary btn-sm" style={{ padding: '4px 10px', fontSize: '11px', background: 'var(--warning-color)', border: 'none' }} onClick={() => handleRenew(issue._id)} disabled={isRenewing}>
                            {isRenewing ? '⏳' : '🔄 Renew'}
                          </button>
                        )}
                        {issue.fineAmount > 0 && (
                          <button className="btn btn-primary btn-sm" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => alert('Proceed to payment')}>Pay Fine</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '30px', fontSize: '12px', color: 'var(--text-muted)' }}>No recent activity.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MyBooks;
