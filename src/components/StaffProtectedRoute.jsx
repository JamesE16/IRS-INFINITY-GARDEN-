import { Navigate } from 'react-router-dom';

export function StaffProtectedRoute({ children }) {
  const isStaffLoggedIn = localStorage.getItem('isStaffLoggedIn') === 'true';

  if (!isStaffLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
}