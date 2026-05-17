import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useIdleTimeout } from '../hooks/useIdleTimeout';
import { refreshAccessToken } from '../utils/api';

function isTokenValid(token) {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp > Math.floor(Date.now() / 1000) + 10;
  } catch {
    return false;
  }
}

export function ProtectedRoute({ children }) {
  const [authState, setAuthState] = useState('checking');

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const role  = localStorage.getItem('adminRole');

    if (isTokenValid(token) && role === 'admin') {
      setAuthState('ok');
      return;
    }

    refreshAccessToken().then((success) => {
      const newRole = localStorage.getItem('adminRole');
      if (success && newRole === 'admin') {
        setAuthState('ok');
      } else {
        setAuthState('denied');
      }
    });
  }, []);

  useIdleTimeout(authState === 'ok');

  if (authState === 'checking') return null;
  if (authState === 'denied')   return <Navigate to="/login" replace />;
  return children;
}
