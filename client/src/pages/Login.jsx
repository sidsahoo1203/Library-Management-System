import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginAdmin, loginStudent } from '../api/api';

const Login = ({ setUser }) => {
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const loginMethod = role === 'admin' ? loginAdmin : loginStudent;
      const res = await loginMethod({ email, password });
      
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        setUser({ id: res.data.userId || 'some_id', role: res.data.role }); // Actually we will rely on verifyAuth on reload, but here we can force navigate
        window.location.href = '/'; // Forces full app remount to fetch verifyAuth
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2 style={{ textAlign: 'center', marginBottom: '10px', fontSize: '28px' }}>Welcome Back</h2>
        <p className="text-muted" style={{ textAlign: 'center', marginBottom: '30px' }}>
          Please sign in to your LMS account.
        </p>

        <div className="auth-tabs">
          <div className={`auth-tab ${role === 'student' ? 'active' : ''}`} onClick={() => setRole('student')}>Student</div>
          <div className={`auth-tab ${role === 'admin' ? 'active' : ''}`} onClick={() => setRole('admin')}>Admin</div>
        </div>

        {error && (
          <div className="alert alert-error">
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group mb-4" style={{ marginBottom: '20px' }}>
            <label htmlFor="email">Email Address</label>
            <input 
              id="email"
              type="email" 
              placeholder={role === 'admin' ? "admin@library.com" : "student@university.edu"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          
          <div className="form-group mb-4" style={{ marginBottom: '30px' }}>
            <label htmlFor="password">Password</label>
            <input 
              id="password"
              type="password" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '16px' }} disabled={loading}>
            {loading ? 'Authenticating...' : `Sign In as ${role === 'admin' ? 'Admin' : 'Student'}`}
          </button>
        </form>

        {role === 'student' && (
          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px' }}>
            Don't have an account? <Link to="/register" style={{ fontWeight: '600' }}>Register here</Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default Login;
