import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import BookList from './pages/BookList';
import AddBook from './pages/AddBook';
import IssuedBooks from './pages/IssuedBooks';
import Login from './pages/Login';
import Register from './pages/Register';
import MyBooks from './pages/MyBooks';
import StudentList from './pages/StudentList';
import { verifyAuth } from './api/api';

const ProtectedRoute = ({ user, requiredRole, children }) => {
  if (!user) return <Navigate to="/login" replace />;
  if (requiredRole && user.role !== requiredRole) return <Navigate to="/" replace />;
  return children;
};

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      if (localStorage.getItem('token')) {
        try {
          const res = await verifyAuth();
          setUser(res.data.user);
        } catch (error) {
          localStorage.removeItem('token');
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };
    checkAuth();
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="app-layout">
        <div className="loading-wrap" style={{ margin: 'auto' }}>
          <div className="spinner"></div>
          <p>Verifying session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      {/* ── Sidebar Navigation ──────────────────────────────── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">📚</div>
          <div className="sidebar-logo-text">
            <h1>Libraro</h1>
            <span>{user?.role === 'admin' ? 'Admin Portal' : user?.role === 'student' ? 'Student Portal' : 'Project LMS v1.0'}</span>
          </div>
        </div>

        <p className="sidebar-section-title">Main Menu</p>
        <nav className="sidebar-nav">
          {user?.role === 'admin' && (
            <>
              <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <span className="nav-icon">📊</span> Admin Dashboard
              </NavLink>
              <NavLink to="/books" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <span className="nav-icon">📖</span> Manage Catalog
              </NavLink>
              <NavLink to="/students" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <span className="nav-icon">👨‍🎓</span> Students
              </NavLink>
              <NavLink to="/add-book" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <span className="nav-icon">➕</span> Add New Book
              </NavLink>
              <NavLink to="/issued" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <span className="nav-icon">🤝</span> Desk & Returns
              </NavLink>
            </>
          )}

          {user?.role === 'student' && (
            <>
              <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <span className="nav-icon">📖</span> Access Catalog
              </NavLink>
              <NavLink to="/my-books" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <span className="nav-icon">📚</span> My Issued Books
              </NavLink>
            </>
          )}

          {!user && (
            <>
              <NavLink to="/login" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <span className="nav-icon">🔒</span> Login
              </NavLink>
              <NavLink to="/register" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <span className="nav-icon">📝</span> Student Register
              </NavLink>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          {user ? (
            <button 
              onClick={handleLogout} 
              style={{ width: '100%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '10px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseOver={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.8)'}
              onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
            >
              Sign Out
            </button>
          ) : (
            <div className="sidebar-badge">System Secure</div>
          )}
        </div>
      </aside>

      {/* ── Main Content Area ──────────────────────────────── */}
      <main className="main-content">
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" /> : <Login setUser={setUser} />} />
          <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
          
          {/* Admin Routes */}
          <Route path="/" element={<ProtectedRoute user={user}><Dashboard user={user} /></ProtectedRoute>} />
          <Route path="/books" element={<ProtectedRoute user={user}><BookList user={user} /></ProtectedRoute>} />
          <Route path="/students" element={<ProtectedRoute user={user} requiredRole="admin"><StudentList /></ProtectedRoute>} />
          <Route path="/add-book" element={<ProtectedRoute user={user} requiredRole="admin"><AddBook /></ProtectedRoute>} />
          <Route path="/edit-book/:id" element={<ProtectedRoute user={user} requiredRole="admin"><AddBook /></ProtectedRoute>} />
          <Route path="/issued" element={<ProtectedRoute user={user} requiredRole="admin"><IssuedBooks /></ProtectedRoute>} />
          
          {/* Student Routes */}
          <Route path="/my-books" element={<ProtectedRoute user={user} requiredRole="student"><MyBooks user={user} /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
