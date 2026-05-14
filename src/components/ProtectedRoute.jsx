import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authAPI } from '../utils/api';
import { clearAuthStorage, getUserRole, persistAuthenticatedRole } from '../utils/auth';

export function ProtectedRoute({ children }) {
  const location = useLocation();
  const [authState, setAuthState] = useState('checking');

  useEffect(() => {
    let isMounted = true;

    const verifyAdminSession = async () => {
      try {
        const user = await authAPI.getCurrentUser();
        const role = getUserRole(user);

        if (!isMounted) return;

        if (role === 'admin') {
          persistAuthenticatedRole(user, 'admin');
          setAuthState('allowed');
          return;
        }

        clearAuthStorage();
        setAuthState('denied');
      } catch {
        if (!isMounted) return;
        clearAuthStorage();
        setAuthState('denied');
      }
    };

    verifyAdminSession();

    return () => {
      isMounted = false;
    };
  }, []);

  if (authState === 'checking') {
    return null;
  }

  if (authState !== 'allowed') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
