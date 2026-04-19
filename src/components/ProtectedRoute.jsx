import { Navigate } from 'react-router-dom';

export function ProtectedRoute({ children }) {
  const isAdminLoggedIn = localStorage.getItem('isAdminLoggedIn') === 'true';

  if (!isAdminLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
