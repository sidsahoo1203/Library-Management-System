import React, { useState, useEffect } from 'react';
import { getAllBooks, getAllIssued } from '../api/api';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import ScannerModal from '../components/ScannerModal';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [stats, setStats] = useState({ totalBooks: 0, available: 0, issuedTotal: 0, pendingRequests: 0, totalFines: 0 });
  const [categoryData, setCategoryData] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const navigate = useNavigate();

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [booksRes, issuedRes] = await Promise.all([
          getAllBooks({ limit: 1000 }), 
          getAllIssued()
        ]);

        const books = booksRes.data.data;
        const issues = issuedRes.data.data;

        // Core Stats
        let pending = 0;
        let fines = 0;
        issues.forEach(i => {
          if (i.status === 'Pending') pending++;
          if (i.fineAmount) fines += i.fineAmount;
        });

        setStats({
          totalBooks: books.length,
          available: books.reduce((acc, curr) => acc + curr.availableCopies, 0),
          issuedTotal: issues.filter(i => i.status === 'Issued').length,
          pendingRequests: pending,
          totalFines: fines
        });

        // Chart Data Mapping
        const catMap = {};
        books.forEach(b => {
          catMap[b.category] = (catMap[b.category] || 0) + 1;
        });
        setCategoryData(Object.keys(catMap).map(key => ({ name: key, value: catMap[key] })));

        // Recent Activity mapping
        setRecentActivity(issues.slice(0, 5));

      } catch (error) {
        console.error("Failed to load dashboard specific data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="loading-wrap"><div className="spinner"></div><p>Aggregating university data...</p></div>;
  }

  const handleScanSuccess = (studentId) => {
    setShowScanner(false);
    // In a real flow, you'd fetch the student or show a form
    // For now we just route to student list or display it
    alert(`Successfully Scanned Student ID: ${studentId}\nYou can now instantly issue a book to them.`);
  };

  return (
    <div>
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Admin Overview</h2>
          <p>Real-time telemetry of library catalog and student transactions.</p>
        </div>
        <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setShowScanner(true)}>
          📸 Quick Scan Student
        </button>
      </header>

      {showScanner && <ScannerModal onClose={() => setShowScanner(false)} onScan={handleScanSuccess} />}

      {/* ── Key Metrics ──────────────────────────────── */}
      <div className="stats-grid" style={{ marginBottom: '40px' }}>
        <div className="stat-card blue">
          <div className="stat-icon" style={{ color: 'var(--primary-color)', background: 'var(--bg-color)' }}>📚</div>
          <div className="stat-label">Total Titles</div>
          <div className="stat-value">{stats.totalBooks}</div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon" style={{ color: 'var(--success-color)', background: 'var(--bg-color)' }}>🔄</div>
          <div className="stat-label">Active Issues</div>
          <div className="stat-value">{stats.issuedTotal}</div>
        </div>
        <div className="stat-card amber">
          <div className="stat-icon" style={{ color: 'var(--warning-color)', background: 'var(--bg-color)' }}>🔔</div>
          <div className="stat-label">Pending Requests</div>
          <div className="stat-value">{stats.pendingRequests}</div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon" style={{ color: 'var(--danger-color)', background: 'var(--bg-color)' }}>💰</div>
          <div className="stat-label">Total Debt (Fines)</div>
          <div className="stat-value">${stats.totalFines}</div>
        </div>
      </div>

      {/* ── Visual Analytics ───────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div className="card">
          <h3 className="card-title">📖 Category Distribution</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value">
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip wrapperStyle={{ borderRadius: '8px', zIndex: 100 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
            {categoryData.map((cat, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: COLORS[i % COLORS.length] }}></div>
                {cat.name}
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">📊 Activity vs Capacity</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Library Metrics', Available: stats.available, Issued: stats.issuedTotal, Requests: stats.pendingRequests }
              ]}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip cursor={{fill: 'transparent'}} wrapperStyle={{ borderRadius: '8px' }} />
                <Bar dataKey="Available" fill="var(--success-color)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Issued" fill="var(--primary-color)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Requests" fill="var(--warning-color)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Recent Transactions ───────────────────────── */}
      <div className="card">
        <h3 className="card-title">⚡ Recent Transactions</h3>
        {recentActivity.length > 0 ? (
          <ul style={{ listStyle: 'none' }}>
            {recentActivity.map((r, i) => (
              <li key={i} style={{ padding: '15px 0', borderBottom: i === recentActivity.length - 1 ? 'none' : '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span className={`badge badge-${r.status.toLowerCase()}`} style={{ marginRight: '10px' }}>{r.status}</span>
                  <strong>{r.bookId?.title || 'Unknown'}</strong> requested by <em>{r.studentName}</em>
                </div>
                <span className="text-muted" style={{ fontSize: '12px' }}>
                  {new Date(r.createdAt).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">No recent activity found.</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
