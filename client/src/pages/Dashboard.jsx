import React, { useState, useEffect } from 'react';
import { getAllBooks, getAllIssued, getAllStudents, issueBook } from '../api/api';
import { Link } from 'react-router-dom';
import ScannerModal from '../components/ScannerModal';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalIssued: 0,
    totalStudents: 0,
    activeRequests: 0,
  });
  const [recentIssues, setRecentIssues] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [inventoryData, setInventoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Quick Issue Scanner State
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [issueStep, setIssueStep] = useState(1);
  const [scannedStudentEmail, setScannedStudentEmail] = useState('');
  const [bookSearch, setBookSearch] = useState('');
  const [books, setBooks] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [booksRes, issuesRes, studentsRes] = await Promise.all([
        getAllBooks({ limit: 1000 }),
        getAllIssued(),
        getAllStudents()
      ]);

      const fetchedBooks = booksRes.data.data || [];
      const fetchedIssues = issuesRes.data.data || [];
      const fetchedStudents = studentsRes.data.data || [];

      setBooks(fetchedBooks);
      
      // Calculate Stats
      const issuedCount = fetchedIssues.filter(i => i.status === 'Issued').length;
      const pendingCount = fetchedIssues.filter(i => i.status === 'Pending').length;
      const totalPhysicalCopies = fetchedBooks.reduce((acc, b) => acc + (Number(b.totalCopies) || 0), 0);
      const fineCount = fetchedIssues.filter(i => (i.fineAmount || 0) > 0).length;
      
      setStats({
        totalBooks: fetchedBooks.length,
        totalIssued: issuedCount,
        totalStudents: fetchedStudents.length,
        activeRequests: pendingCount,
      });

      // Prepare Category Data
      const catMap = {};
      fetchedBooks.forEach(b => {
        const cat = b.category || 'Uncategorized';
        catMap[cat] = (catMap[cat] || 0) + 1;
      });
      setCategoryData(Object.keys(catMap).map(name => ({ name, value: catMap[name] })));

      // Prepare Inventory Status Data
      const totalAvailable = fetchedBooks.reduce((acc, b) => acc + (Number(b.availableCopies) || 0), 0);
      
      setInventoryData([
        { name: 'Available', value: totalAvailable, color: '#10b981' },
        { name: 'Issued', value: issuedCount, color: '#6366f1' },
        { name: 'Active Fines', value: fineCount, color: '#ef4444' }
      ]);

      setRecentIssues(fetchedIssues.slice(0, 5));
    } catch (err) {
      setError('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleScanSuccess = (email) => {
    setScannedStudentEmail(email);
    setIssueStep(2);
  };

  const handleQuickIssue = async (bookId) => {
    try {
      await issueBook({ bookId, studentEmail: scannedStudentEmail });
      alert('Book issued successfully!');
      setIsScannerOpen(false);
      setIssueStep(1);
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Issue failed');
    }
  };

  if (loading) return <div className="loading-wrap"><div className="spinner"></div></div>;

  return (
    <div style={{ paddingBottom: '50px' }}>
      <header className="page-header" style={{ marginBottom: '30px' }}>
        <h2>📊 Library Analytics</h2>
        <p>Operational intelligence and real-time inventory tracking.</p>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      {/* ── STATS GRID ───────────────────────────────────── */}
      <div className="stats-grid" style={{ marginBottom: '30px' }}>
        <div className="stat-card blue">
          <span className="stat-label">Total Books</span>
          <span className="stat-value">{stats.totalBooks}</span>
          <span className="stat-desc">Unique titles in database</span>
        </div>
        <div className="stat-card purple">
          <span className="stat-label">Total Students</span>
          <span className="stat-value">{stats.totalStudents}</span>
          <span className="stat-desc">Registered member count</span>
        </div>
        <div className="stat-card green">
          <span className="stat-label">Books Issued</span>
          <span className="stat-value">{stats.totalIssued}</span>
          <span className="stat-desc">Currently out on loan</span>
        </div>
        <div className="stat-card amber">
          <span className="stat-label">Pending Requests</span>
          <span className="stat-value">{stats.activeRequests}</span>
          <span className="stat-desc">Awaiting admin approval</span>
        </div>
      </div>

      {/* ── CHARTS SECTION ────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px', marginBottom: '30px' }}>
        <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
          <h3 className="card-title" style={{ marginBottom: '20px' }}>📖 Category Distribution</h3>
          <div style={{ flex: 1, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
          <h3 className="card-title" style={{ marginBottom: '20px' }}>📦 Inventory Status</h3>
          <div style={{ flex: 1, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inventoryData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f1f5f9'}} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {inventoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── QUICK ISSUE SCANNER ───────────────────────────── */}
      <div style={{ marginBottom: '30px', display: 'flex', gap: '25px', alignItems: 'center', background: '#0f172a', color: 'white', padding: '30px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
        <div style={{ fontSize: '50px' }}>📸</div>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: '0 0 5px 0', fontSize: '20px', fontWeight: '800' }}>Quick Issue Desk</h3>
          <p style={{ margin: 0, opacity: 0.6, fontSize: '14px' }}>Scan student ID to instantly verify and issue books.</p>
        </div>
        <button className="btn btn-primary" style={{ padding: '15px 30px', borderRadius: '30px' }} onClick={() => setIsScannerOpen(true)}>Open Scanner</button>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 className="card-title" style={{ margin: 0 }}>Recent Desk Activity</h3>
          <Link to="/issued" style={{ fontSize: '14px', fontWeight: '600', color: 'var(--primary-color)' }}>View History →</Link>
        </div>
        
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Book Details</th>
                <th>Current Status</th>
                <th>Log Date</th>
              </tr>
            </thead>
            <tbody>
              {recentIssues.map((issue) => (
                <tr key={issue._id}>
                  <td style={{ fontWeight: '600' }}>{issue.studentName}</td>
                  <td>
                    <div style={{ fontWeight: '600' }}>{issue.bookId?.title || 'Unknown'}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{issue.bookId?.author}</div>
                  </td>
                  <td>
                    <span className={`badge badge-${issue.status.toLowerCase()}`}>
                      {issue.status}
                    </span>
                  </td>
                  <td>{new Date(issue.issueDate || issue.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isScannerOpen && (
        <ScannerModal onClose={() => setIsScannerOpen(false)} onScan={handleScanSuccess} />
      )}

      {issueStep === 2 && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, backdropFilter: 'blur(5px)' }}>
          <div className="card" style={{ width: '450px', padding: '30px' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>🎓</div>
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>Issue to: <strong>{scannedStudentEmail}</strong></p>
            </div>
            
            <input 
              type="text" 
              placeholder="Filter books..." 
              onChange={(e) => setBookSearch(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '10px', marginBottom: '15px' }}
            />
            
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {books.filter(b => b.availableCopies > 0 && b.title.toLowerCase().includes(bookSearch.toLowerCase())).map(book => (
                <button 
                  key={book._id} 
                  className="btn btn-outline" 
                  style={{ width: '100%', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}
                  onClick={() => handleQuickIssue(book._id)}
                >
                  <span>{book.title}</span>
                  <span style={{ fontSize: '11px', opacity: 0.6 }}>{book.availableCopies} left</span>
                </button>
              ))}
            </div>
            <button className="btn btn-danger" style={{ width: '100%', marginTop: '15px' }} onClick={() => { setIssueStep(1); setIsScannerOpen(false); }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
