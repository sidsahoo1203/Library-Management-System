import React, { useState } from 'react';
import { loginAdmin, loginStudent } from '../api/api';
import { useNavigate, Link } from 'react-router-dom';

const Login = ({ setUser }) => {
  const [activeTab, setActiveTab] = useState('student'); // 'student' or 'admin'
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      let res;
      // STRICT ROLE ENFORCEMENT
      if (activeTab === 'admin') {
        res = await loginAdmin(formData);
      } else {
        res = await loginStudent(formData);
      }

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user || { id: res.data.id, role: res.data.role, name: res.data.name }));
      setUser(res.data.user || { id: res.data.id, role: res.data.role, name: res.data.name });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || `Unauthorized for ${activeTab} access.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`login-screen ${activeTab}-active`}>
      <div className="login-visual-layer">
        <div className="overlay"></div>
      </div>

      <div className="login-card-container">
        <div className="glass-card">
          <header className="login-header">
            <h2>Welcome Back</h2>
            <p>Please sign in to your LMS account.</p>
          </header>

          <div className="tab-switcher">
            <button 
              className={activeTab === 'student' ? 'active' : ''} 
              onClick={() => { setActiveTab('student'); setError(''); }}
            >
              Student
            </button>
            <button 
              className={activeTab === 'admin' ? 'active' : ''} 
              onClick={() => { setActiveTab('admin'); setError(''); }}
            >
              Admin
            </button>
          </div>

          {error && <div className="login-error">⚠️ {error}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="field">
              <label>{activeTab === 'admin' ? 'Admin Email' : 'Student Email'}</label>
              <input
                type="email"
                placeholder={activeTab === 'admin' ? 'admin@library.com' : 'student@university.edu'}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="field">
              <label>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            <button type="submit" className={`submit-btn ${activeTab}`} disabled={loading}>
              {loading ? 'Authenticating...' : `Sign In as ${activeTab === 'admin' ? 'Admin' : 'Student'}`}
            </button>
          </form>

          <footer className="login-footer">
            {activeTab === 'student' ? (
              <p>Don't have an account? <Link to="/register">Register here</Link></p>
            ) : (
              <p>Restricted area. Admin credentials required.</p>
            )}
          </footer>
        </div>
      </div>

      <style>{`
        .login-screen {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .login-visual-layer {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          transition: background-image 0.8s ease-in-out;
          z-index: -1;
        }

        .student-active .login-visual-layer { background-image: url('/assets/student_bg.png'); }
        .admin-active .login-visual-layer { background-image: url('/assets/admin_bg.png'); }

        .overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.7) 0%, rgba(30, 41, 59, 0.3) 100%);
        }

        .login-card-container {
          z-index: 10;
          width: 100%;
          max-width: 440px;
          padding: 20px;
        }

        .glass-card {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.4);
          border-radius: 30px;
          padding: 50px 40px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        .login-header { text-align: center; margin-bottom: 35px; }
        .login-header h2 { font-size: 32px; font-weight: 800; color: #0f172a; margin: 0 0 8px 0; }
        .login-header p { color: #64748b; font-size: 14px; }

        .tab-switcher {
          display: flex;
          background: #f1f5f9;
          padding: 5px;
          border-radius: 14px;
          margin-bottom: 30px;
        }

        .tab-switcher button {
          flex: 1;
          padding: 10px;
          border: none;
          background: transparent;
          font-weight: 700;
          font-size: 14px;
          color: #64748b;
          cursor: pointer;
          border-radius: 10px;
          transition: all 0.2s;
        }

        .tab-switcher button.active {
          background: white;
          color: #6366f1;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .login-error {
          background: #fef2f2;
          color: #dc2626;
          padding: 12px;
          border-radius: 10px;
          margin-bottom: 20px;
          font-size: 13px;
          font-weight: 600;
          text-align: center;
        }

        .field { margin-bottom: 20px; }
        .field label { display: block; font-size: 13px; font-weight: 700; color: #475569; margin-bottom: 8px; }
        .field input {
          width: 100%;
          padding: 14px 18px;
          border-radius: 12px;
          border: 2px solid #e2e8f0;
          background: white;
          font-size: 15px;
          transition: all 0.2s;
        }

        .field input:focus {
          border-color: #6366f1;
          outline: none;
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
        }

        .submit-btn {
          width: 100%;
          padding: 16px;
          border: none;
          border-radius: 14px;
          font-size: 16px;
          font-weight: 700;
          color: white;
          cursor: pointer;
          transition: all 0.3s;
          margin-top: 10px;
        }

        .submit-btn.student { background: #6366f1; }
        .submit-btn.admin { background: #0f172a; }
        .submit-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 15px rgba(0,0,0,0.1); filter: brightness(1.1); }
        .submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }

        .login-footer { margin-top: 30px; text-align: center; font-size: 14px; color: #64748b; }
        .login-footer a { color: #6366f1; font-weight: 700; text-decoration: none; }
      `}</style>
    </div>
  );
};

export default Login;
