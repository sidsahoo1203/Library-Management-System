import React from 'react';
import { useNavigate } from 'react-router-dom';

const PaymentSuccess = () => {
  const navigate = useNavigate();

  return (
    <div className="payment-page">
      <div className="payment-card">
        <div className="success-icon">✅</div>
        <h2>Payment Successful!</h2>
        <p>Your library fine has been cleared. The record has been updated in our system.</p>
        
        <div className="info-box">
          <div className="info-item">
            <span>Status:</span>
            <span className="status-badge">Cleared</span>
          </div>
          <div className="info-item">
            <span>Transaction:</span>
            <span className="id-code">SECURE_PAY_#{Math.floor(Math.random() * 1000000)}</span>
          </div>
        </div>

        <button className="btn btn-primary" style={{ width: '100%', marginTop: '20px' }} onClick={() => navigate('/my-books')}>
          Return to Dashboard
        </button>
      </div>

      <style>{`
        .payment-page {
          height: 80vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .payment-card {
          background: white;
          padding: 40px;
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          max-width: 400px;
          width: 100%;
          text-align: center;
        }
        .success-icon {
          font-size: 60px;
          margin-bottom: 20px;
        }
        .payment-card h2 {
          color: #0f172a;
          margin-bottom: 10px;
        }
        .payment-card p {
          color: #64748b;
          font-size: 14px;
          line-height: 1.6;
          margin-bottom: 30px;
        }
        .info-box {
          background: #f8fafc;
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 20px;
        }
        .info-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          font-size: 13px;
        }
        .info-item:last-child { margin-bottom: 0; }
        .status-badge {
          color: #10b981;
          font-weight: 700;
        }
        .id-code {
          color: #64748b;
          font-family: monospace;
        }
      `}</style>
    </div>
  );
};

export default PaymentSuccess;
