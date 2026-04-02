import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { BookingProvider } from './context/BookingContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import NavBar            from './components/layout/NavBar';
import HomePage          from './pages/HomePage';
import RoomsPage         from './pages/RoomsPage';
import RoomDetailPage    from './pages/RoomDetailPage';
import BookingPage       from './pages/BookingPage';
import BookingConfirmedPage from './pages/BookingConfirmedPage';
import MyBookingsPage    from './pages/MyBookingsPage';
import AdminLoginPage    from './pages/admin/AdminLoginPage';
import AdminDashboard    from './pages/admin/AdminDashboard';
import AdminReservations from './pages/admin/AdminReservations';
import AdminFacilities   from './pages/admin/AdminFacilities';
import AdminUserManagement from './pages/admin/AdminUserManagement';
import AdminPlaceholderPage from './pages/admin/AdminPlaceholderPage';
import Toast             from './components/ui/Toast';
import AdminPaymentManagement from './pages/admin/AdminPaymentManagement';

export default function App() {
  return (
    <BrowserRouter>
      <BookingProvider>
        <AppRoutes />
        <Toast />
      </BookingProvider>
    </BrowserRouter>
  );
}

function AppRoutes() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <>
      {!isAdminRoute && <NavBar />}
      <Routes>
        {/* Public routes */}
        <Route path="/"                  element={<HomePage />} />
        <Route path="/rooms"             element={<RoomsPage />} />
        <Route path="/rooms/:id"         element={<RoomDetailPage />} />
        <Route path="/booking"           element={<BookingPage />} />
        <Route path="/booking/confirmed" element={<BookingConfirmedPage />} />
        <Route path="/my-bookings"       element={<MyBookingsPage />} />
        
        {/* Admin login */}
        <Route path="/admin/login"       element={<AdminLoginPage />} />
        
        {/* Protected admin routes */}
        <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/reservations" element={<ProtectedRoute><AdminReservations /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute><AdminUserManagement /></ProtectedRoute>} />
        <Route path="/admin/facilities" element={<ProtectedRoute><AdminFacilities /></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute><AdminPlaceholderPage /></ProtectedRoute>} />
        <Route path="/admin/payments" element={<ProtectedRoute><AdminPlaceholderPage /></ProtectedRoute>} />
        <Route path="/admin/logs" element={<ProtectedRoute><AdminPlaceholderPage /></ProtectedRoute>} />
        <Route path="/admin/logs" element={<ProtectedRoute><AdminPaymentManagement /></ProtectedRoute>} />
      </Routes>
    </>
  );
}

