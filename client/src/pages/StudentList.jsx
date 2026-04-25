import React, { useState, useEffect } from 'react';
import { getAllStudents, deleteStudent } from '../api/api';

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Security Modal State
  const [showConfirm, setShowConfirm] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await getAllStudents();
      setStudents(res.data.data);
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const openDeleteModal = (student) => {
    setStudentToDelete(student);
    setShowConfirm(true);
    setAdminPassword('');
  };

  const handleSecureDelete = async (e) => {
    e.preventDefault();
    if (!adminPassword) return;

    setIsDeleting(true);
    try {
      await deleteStudent(studentToDelete._id, adminPassword);
      setAlert({ type: 'success', msg: `${studentToDelete.name} deleted successfully.` });
      setShowConfirm(false);
      setStudentToDelete(null);
      setAdminPassword('');
      fetchStudents();
    } catch (error) {
      setAlert({ type: 'error', msg: error.response?.data?.message || 'Verification failed. Incorrect password.' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <header className="page-header">
        <h2>Registered Students</h2>
        <p>Manage all university students with access to the library.</p>
      </header>

      {alert && (
        <div className={`alert alert-${alert.type}`} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <span>{alert.type === 'success' ? '✅' : '❌'} {alert.msg}</span>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setAlert(null)}>✕</button>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="loading-wrap" style={{ padding: '60px' }}>
            <div className="spinner"></div>
            <p>Loading student directory...</p>
          </div>
        ) : students.length > 0 ? (
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
            <table style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Student Info</th>
                  <th>Contact</th>
                  <th>Active Issues</th>
                  <th>Total Fines</th>
                  <th>Registration Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student._id}>
                    <td>
                      <strong className="text-accent" style={{ display: 'block' }}>{student.name}</strong>
                    </td>
                    <td>
                      <div style={{ fontSize: '13px' }}>{student.email}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{student.phone || 'No phone provided'}</div>
                    </td>
                    <td>
                      <span className={`badge ${student.activeIssues > 0 ? 'badge-issued' : 'badge-returned'}`}>
                        {student.activeIssues} books
                      </span>
                    </td>
                    <td>
                      {student.totalFines > 0 ? (
                        <strong style={{ color: 'var(--danger-color)' }}>${student.totalFines}</strong>
                      ) : (
                        <span style={{ color: 'var(--success-color)' }}>Clean</span>
                      )}
                    </td>
                    <td>
                      <span className="text-muted" style={{ fontSize: '13px' }}>
                        {new Date(student.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn btn-outline btn-sm" 
                        style={{ borderColor: '#fee2e2', color: '#ef4444', padding: '5px 10px' }} 
                        onClick={() => openDeleteModal(student)}
                        title="Delete Student Permanently"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state" style={{ padding: '60px', textAlign: 'center' }}>
            <div className="empty-icon" style={{ fontSize: '48px', marginBottom: '15px' }}>👨‍🎓</div>
            <h3 style={{ marginBottom: '8px' }}>No students found</h3>
            <p className="text-muted">No students registered yet.</p>
          </div>
        )}
      </div>

      {/* ── SECURITY VERIFICATION MODAL ────────────────────── */}
      {showConfirm && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, backdropFilter: 'blur(5px)' }}>
          <div className="card" style={{ width: '400px', padding: '30px', border: '2px solid var(--danger-color)' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>🛡️</div>
              <h3 style={{ margin: 0, color: 'var(--danger-color)' }}>Security Verification</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '10px' }}>
                You are about to delete <strong>{studentToDelete?.name}</strong>. Please enter your Admin password to authorize this action.
              </p>
            </div>

            <form onSubmit={handleSecureDelete}>
              <div className="form-group" style={{ marginBottom: '25px' }}>
                <input 
                  type="password" 
                  placeholder="Enter Admin Password" 
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  required
                  autoFocus
                  style={{ width: '100%', padding: '12px', textAlign: 'center', fontSize: '16px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowConfirm(false)}>Cancel</button>
                <button type="submit" className="btn btn-danger" style={{ flex: 1 }} disabled={isDeleting}>
                  {isDeleting ? 'Verifying...' : 'Confirm Delete'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentList;
