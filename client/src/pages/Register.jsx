import React, { useState } from 'react';
import { register } from '../api/api';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register(formData);
      alert('Registration successful! Please login.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen student-active">
      <div className="login-visual-layer">
        <div className="overlay"></div>
      </div>

      <div className="login-card-container">
        <div className="glass-card">
          <header className="login-header">
            <h2>Student Registration</h2>
            <p>Create an account to access the library catalog.</p>
          </header>

          {error && <div className="login-error">❌ {error}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="field">
              <label>Full Name</label>
              <input
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="field">
              <label>University Email</label>
              <input
                type="email"
                placeholder="student@university.edu"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="field">
              <label>Phone Number</label>
              <input
                type="text"
                placeholder="+1 234 567 8900"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>

            <div className="field">
              <label>Password</label>
              <input
                type="password"
                placeholder="Create a strong password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            <button type="submit" className="submit-btn student" disabled={loading}>
              {loading ? 'Creating Account...' : 'Register'}
            </button>
          </form>

          <footer className="login-footer">
            <p>Already have an account? <Link to="/login">Login here</Link></p>
          </footer>
        </div>
      </div>

      <style>{`
        /* Reuse shared styles from Login.jsx */
        .login-screen {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .login-visual-layer {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          background-image: url('/assets/student_bg.png');
          z-index: -1;
        }

        .overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.7) 0%, rgba(30, 41, 59, 0.3) 100%);
        }

        .login-card-container {
          z-index: 10;
          width: 100%;
          max-width: 480px;
          padding: 20px;
        }

        .glass-card {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.4);
          border-radius: 30px;
          padding: 40px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        .login-header { text-align: center; margin-bottom: 30px; }
        .login-header h2 { font-size: 28px; font-weight: 800; color: #0f172a; margin: 0 0 8px 0; }
        .login-header p { color: #64748b; font-size: 14px; }

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

        .field { margin-bottom: 15px; }
        .field label { display: block; font-size: 13px; font-weight: 700; color: #475569; margin-bottom: 6px; }
        .field input {
          width: 100%;
          padding: 12px 16px;
          border-radius: 10px;
          border: 2px solid #e2e8f0;
          background: white;
          font-size: 14px;
          transition: all 0.2s;
        }

        .field input:focus {
          border-color: #6366f1;
          outline: none;
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
        }

        .submit-btn {
          width: 100%;
          padding: 14px;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          color: white;
          cursor: pointer;
          transition: all 0.3s;
          margin-top: 10px;
        }

        .submit-btn.student { background: #6366f1; }
        .submit-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 15px rgba(0,0,0,0.1); filter: brightness(1.1); }
        .submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }

        .login-footer { margin-top: 25px; text-align: center; font-size: 14px; color: #64748b; }
        .login-footer a { color: #6366f1; font-weight: 700; text-decoration: none; }
      `}</style>
    </div>
  );
};

export default Register;
