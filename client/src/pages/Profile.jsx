import React, { useState, useEffect } from 'react';
import { changePassword, getSettings, updateSettings, updateAdminProfile } from '../api/api';

const Profile = ({ user }) => {
  // Admin Info State
  const [profileData, setProfileData] = useState({
    name: user?.name || 'Head Librarian',
    email: user?.email || ''
  });

  // Library Policy State
  const [libSettings, setLibSettings] = useState({
    finePerDay: 10,
    loanDurationDays: 14,
    libraryName: 'University Library'
  });

  // Password State
  const [passData, setPassData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Theme State
  const [darkMode, setDarkMode] = useState(localStorage.getItem('theme') === 'dark');

  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchSettings();
    }
    // Apply theme on load
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const fetchSettings = async () => {
    try {
      const res = await getSettings();
      setLibSettings(res.data.data);
    } catch (err) {
      console.error('Failed to load settings');
    }
  };

  const handleThemeToggle = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateAdminProfile(profileData);
      
      // Update local storage so the sidebar name changes too
      const currentUser = JSON.parse(localStorage.getItem('user'));
      localStorage.setItem('user', JSON.stringify({ ...currentUser, name: profileData.name }));
      
      setAlert({ type: 'success', msg: 'Admin profile updated! Sidebar will update on next click.' });
    } catch (err) {
      setAlert({ type: 'error', msg: 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const handlePolicyUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateSettings(libSettings);
      setAlert({ type: 'success', msg: 'Library policies updated!' });
    } catch (err) {
      setAlert({ type: 'error', msg: 'Failed to update policies' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (passData.newPassword !== passData.confirmPassword) {
      return setAlert({ type: 'error', msg: 'New passwords do not match' });
    }
    setLoading(true);
    try {
      await changePassword({
        currentPassword: passData.currentPassword,
        newPassword: passData.newPassword
      });
      setAlert({ type: 'success', msg: 'Password updated successfully!' });
      setPassData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setAlert({ type: 'error', msg: err.response?.data?.message || 'Password update failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '50px' }}>
      <header className="page-header" style={{ marginBottom: '40px' }}>
        <h2>⚙️ Admin Control Panel</h2>
        <p>Global configuration, security, and interface preferences.</p>
      </header>

      {alert && (
        <div className={`alert alert-${alert.type}`} style={{ position: 'sticky', top: '20px', zIndex: 100, marginBottom: '25px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          {alert.type === 'success' ? '✅' : '❌'} {alert.msg}
          <button style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setAlert(null)}>✕</button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        
        {/* SECTION: ADMIN PROFILE */}
        <div className="card" style={{ padding: '30px' }}>
          <h4 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>👤</span> Personal Info
          </h4>
          <form onSubmit={handleProfileUpdate}>
            <div className="form-group" style={{ marginBottom: '15px' }}>
              <label>Full Name</label>
              <input type="text" value={profileData.name} onChange={(e) => setProfileData({...profileData, name: e.target.value})} />
            </div>
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label>Admin Email</label>
              <input type="email" value={profileData.email} onChange={(e) => setProfileData({...profileData, email: e.target.value})} />
            </div>
            <button type="submit" className="btn btn-outline btn-sm" style={{ width: '100%' }} disabled={loading}>Save Profile Changes</button>
          </form>
        </div>

        {/* SECTION: THEME SETTINGS */}
        <div className="card" style={{ padding: '30px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <h4 style={{ marginBottom: '15px' }}>🎨 Appearance</h4>
          <div style={{ fontSize: '50px', marginBottom: '20px' }}>{darkMode ? '🌙' : '☀️'}</div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
            Switch between light and dark visual modes.
          </p>
          <button 
            onClick={handleThemeToggle}
            className={`btn ${darkMode ? 'btn-primary' : 'btn-outline'}`}
            style={{ width: '100%', borderRadius: '30px' }}
          >
            Switch to {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>

        {/* SECTION: LIBRARY POLICIES (Admin Only) */}
        {user?.role === 'admin' && (
          <div className="card" style={{ padding: '30px', gridColumn: 'span 2' }}>
            <h4 style={{ marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '24px' }}>💸</span> Library Global Policies
            </h4>
            <form onSubmit={handlePolicyUpdate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="form-group">
                <label>Daily Fine Amount ($)</label>
                <input 
                  type="number" 
                  value={libSettings.finePerDay} 
                  onChange={(e) => setLibSettings({...libSettings, finePerDay: e.target.value})}
                  min="0"
                />
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '5px' }}>Late fee charged per book per day.</p>
              </div>
              <div className="form-group">
                <label>Loan Duration (Days)</label>
                <input 
                  type="number" 
                  value={libSettings.loanDurationDays} 
                  onChange={(e) => setLibSettings({...libSettings, loanDurationDays: e.target.value})}
                  min="1"
                />
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '5px' }}>Default period before a book is overdue.</p>
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Institution / Library Name</label>
                <input 
                  type="text" 
                  value={libSettings.libraryName} 
                  onChange={(e) => setLibSettings({...libSettings, libraryName: e.target.value})}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ gridColumn: 'span 2', padding: '12px' }} disabled={loading}>
                {loading ? 'Updating Policies...' : 'Update Global Policies'}
              </button>
            </form>
          </div>
        )}

        {/* SECTION: SECURITY */}
        <div className="card" style={{ padding: '30px', gridColumn: 'span 2' }}>
          <h4 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>🛡️</span> Security & Password
          </h4>
          <form onSubmit={handlePasswordUpdate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', alignItems: 'flex-end' }}>
            <div className="form-group">
              <label>Current Password</label>
              <input type="password" value={passData.currentPassword} onChange={(e) => setPassData({...passData, currentPassword: e.target.value})} placeholder="••••" />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input type="password" value={passData.newPassword} onChange={(e) => setPassData({...passData, newPassword: e.target.value})} placeholder="••••" />
            </div>
            <div className="form-group">
              <label>Confirm New</label>
              <input type="password" value={passData.confirmPassword} onChange={(e) => setPassData({...passData, confirmPassword: e.target.value})} placeholder="••••" />
            </div>
            <button type="submit" className="btn btn-danger" style={{ gridColumn: 'span 3', marginTop: '10px' }} disabled={loading}>Update Access Credentials</button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default Profile;
