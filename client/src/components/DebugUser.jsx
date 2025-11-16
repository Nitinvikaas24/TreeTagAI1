import React from 'react';
import { useAuth } from '../context/AuthContext';

const DebugUser = () => {
  const { user, loading } = useAuth();
  
  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'rgba(0,0,0,0.8)', 
      color: 'white', 
      padding: '10px', 
      borderRadius: '5px', 
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <h4>Debug User State:</h4>
      <p><strong>Loading:</strong> {loading ? 'true' : 'false'}</p>
      <p><strong>User Object:</strong></p>
      <pre style={{ fontSize: '10px', whiteSpace: 'pre-wrap' }}>
        {JSON.stringify(user, null, 2)}
      </pre>
      <p><strong>Token:</strong> {localStorage.getItem('token') ? 'Present' : 'Missing'}</p>
      <p><strong>Stored User:</strong></p>
      <pre style={{ fontSize: '10px', whiteSpace: 'pre-wrap' }}>
        {localStorage.getItem('user') || 'None'}
      </pre>
    </div>
  );
};

export default DebugUser;