import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const ScannerModal = ({ onClose, onScan }) => {
  const [error, setError] = useState(null);

  useEffect(() => {
    // Initialize Scanner
    const scanner = new Html5QrcodeScanner(
      'reader',
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    scanner.render(
      (decodedText) => {
        scanner.clear();
        onScan(decodedText);
      },
      (errorMessage) => {
        // usually just noise from not finding a QR code yet
      }
    );

    return () => {
      scanner.clear().catch(e => console.error("Failed to clear scanner", e));
    };
  }, [onScan]);

  return (
    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div className="modal-content" style={{ background: 'white', padding: '20px', borderRadius: '12px', width: '400px', maxWidth: '90%' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px', textAlign: 'center' }}>Scan Student ID Card</h3>
        <div id="reader" style={{ width: '100%', border: 'none', borderRadius: '8px', overflow: 'hidden' }}></div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
          <button className="btn btn-outline" onClick={onClose}>Cancel Scan</button>
        </div>
      </div>
    </div>
  );
};

export default ScannerModal;
