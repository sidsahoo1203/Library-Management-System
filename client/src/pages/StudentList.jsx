import React, { useState, useEffect } from 'react';
import { getAllStudents } from '../api/api';

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await getAllStudents();
        setStudents(res.data.data);
      } catch (error) {
        console.error("Error fetching students:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  return (
    <div>
      <header className="page-header">
        <h2>Registered Students</h2>
        <p>Manage all university students with access to the library.</p>
      </header>

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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state" style={{ padding: '60px', textAlign: 'center' }}>
            <div className="empty-icon" style={{ fontSize: '48px', marginBottom: '15px' }}>👨‍🎓</div>
            <h3 style={{ marginBottom: '8px' }}>No students found</h3>
            <p className="text-muted">No students have registered in the system yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentList;
