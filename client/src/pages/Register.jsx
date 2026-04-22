import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerStudent } from '../api/api';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await registerStudent(formData);
      if (res.data.success) {
        alert('Registration successful! Please sign in.');
        navigate('/login');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2 style={{ textAlign: 'center', marginBottom: '10px', fontSize: '28px' }}>Student Registration</h2>
        <p className="text-muted" style={{ textAlign: 'center', marginBottom: '30px' }}>
          Create an account to access the library catalog.
        </p>

        {error && (
          <div className="alert alert-error">
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleRegister}>
          <div className="form-group mb-4" style={{ marginBottom: '15px' }}>
            <label htmlFor="name">Full Name</label>
            <input id="name" type="text" placeholder="John Doe" value={formData.name} onChange={handleChange} required />
          </div>

          <div className="form-group mb-4" style={{ marginBottom: '15px' }}>
            <label htmlFor="email">University Email</label>
            <input id="email" type="email" placeholder="student@university.edu" value={formData.email} onChange={handleChange} required />
          </div>

          <div className="form-group mb-4" style={{ marginBottom: '15px' }}>
            <label htmlFor="phone">Phone Number</label>
            <input id="phone" type="text" placeholder="+1 234 567 8900" value={formData.phone} onChange={handleChange} />
          </div>
          
          <div className="form-group mb-4" style={{ marginBottom: '25px' }}>
            <label htmlFor="password">Password</label>
            <input id="password" type="password" placeholder="Create a strong password" value={formData.password} onChange={handleChange} required />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '16px' }} disabled={loading}>
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px' }}>
          Already have an account? <Link to="/login" style={{ fontWeight: '600' }}>Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
