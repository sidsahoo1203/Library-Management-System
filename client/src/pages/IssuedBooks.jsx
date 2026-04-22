import React, { useState, useEffect } from 'react';
import { getAllIssued, handleIssueAction } from '../api/api';

const IssuedBooks = () => {
  const [issuedRecords, setIssuedRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  const fetchIssuedRecords = async () => {
    setLoading(true);
    try {
      const res = await getAllIssued();
      setIssuedRecords(res.data.data);
    } catch (error) {
      console.error("Error fetching issued records:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssuedRecords();
  }, []);

  const executeAction = async (id, actionLabel, successMsg) => {
    try {
      await handleIssueAction(id, actionLabel);
      setAlert({ type: 'success', msg: successMsg });
      fetchIssuedRecords();
    } catch (error) {
      setAlert({ type: 'error', msg: error.response?.data?.message || `Failed to ${actionLabel}` });
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
      <header className="page-header">
        <h2>Desk & Returns</h2>
        <p>Manage student requests, track issued books, and resolve late fines.</p>
      </header>

      {alert && (
        <div className={`alert alert-${alert.type}`}>
          {alert.type === 'success' ? '✅' : '❌'} {alert.msg}
          <button style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }} onClick={() => setAlert(null)}>✕</button>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="loading-wrap" style={{ padding: '60px' }}>
            <div className="spinner"></div>
            <p>Loading records...</p>
          </div>
        ) : issuedRecords.length > 0 ? (
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
            <table style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Request Details</th>
                  <th>Dates (Issue / Due)</th>
                  <th>Fine Debt</th>
                  <th>Status</th>
                  <th>Admin Action</th>
                </tr>
              </thead>
              <tbody>
                {issuedRecords.map((record) => (
                  <tr key={record._id}>
                    <td>
                      <div>
                        <strong className="text-accent" style={{ display: 'block' }}>{record.bookId?.title || 'Unknown Book'}</strong>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Student: {record.studentName}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Email: {record.studentId?.email}</div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '13px' }}>Issue: {formatDate(record.issueDate)}</div>
                      <div style={{ fontSize: '13px', color: record.status === 'Issued' && new Date(record.dueDate) < new Date() ? 'var(--danger-color)' : 'inherit' }}>
                        Due: {formatDate(record.dueDate)}
                      </div>
                    </td>
                    <td>
                      {record.fineAmount > 0 ? (
                        <strong style={{ color: 'var(--danger-color)' }}>${record.fineAmount}</strong>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>$0</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge badge-${record.status.toLowerCase()}`}>
                        {record.status}
                      </span>
                    </td>
                    <td>
                      <div className="actions-row">
                        {record.status === 'Pending' && (
                          <>
                            <button className="btn btn-sm btn-success" onClick={() => executeAction(record._id, 'approve', 'Request Approved!')}>Approve</button>
                            <button className="btn btn-sm btn-danger" onClick={() => executeAction(record._id, 'reject', 'Request Rejected.')}>Reject</button>
                          </>
                        )}
                        {record.status === 'Issued' && (
                          <button className="btn btn-sm btn-primary" onClick={() => executeAction(record._id, 'return', 'Book Marked Returned!')}>Mark Return</button>
                        )}
                        {record.status === 'Returned' && record.fineAmount > 0 && (
                          <button className="btn btn-sm btn-outline" style={{ borderColor: 'var(--success-color)', color: 'var(--success-color)' }} onClick={() => executeAction(record._id, 'resolve-fine', 'Fine marked as resolved.')}>Resolve Fine</button>
                        )}
                        {record.status === 'Returned' && record.fineAmount === 0 && (
                          <span className="text-muted" style={{ fontSize: '12px', fontStyle: 'italic' }}>Cleared</span>
                        )}
                        {record.status === 'Rejected' && (
                          <span className="text-muted" style={{ fontSize: '12px', fontStyle: 'italic' }}>Closed</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state" style={{ padding: '60px', textAlign: 'center' }}>
            <div className="empty-icon" style={{ fontSize: '48px', marginBottom: '15px' }}>📂</div>
            <h3 style={{ marginBottom: '8px' }}>No records found</h3>
            <p className="text-muted">There are no active issues or student requests.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default IssuedBooks;
