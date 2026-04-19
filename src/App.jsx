import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { BookingProvider } from './context/BookingContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { StaffProtectedRoute } from './components/StaffProtectedRoute';
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
import AdminFeedbackManagement from './pages/admin/AdminFeedbackManagement';
import AdminPlaceholderPage from './pages/admin/AdminPlaceholderPage';
import Toast             from './components/ui/Toast';
import PaymentManagement from './pages/admin/PaymentManagement';
import AdminReports from './pages/admin/AdminReports';
import AdminScheduleManagement from "./pages/admin/AdminScheduleManagement";
import StaffDashboard from './pages/staff/StaffDashboard';
import StaffGuestManagement from './pages/staff/StaffGuestManagement';
import StaffReservations from './pages/staff/StaffReservations';
import StaffPaymentManagement from './pages/staff/StaffPaymentManagement';
import StaffFeedbackManagement from './pages/staff/StaffFeedbackManagement';
import StaffFacilities from './pages/staff/StaffFacilities';
import StaffScheduleMonitoring from './pages/staff/StaffScheduleMonitoring';

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
  const isStaffRoute = location.pathname.startsWith('/staff');

  return (
    <>
      {!isAdminRoute && !isStaffRoute && <NavBar />}
      <Routes>
        {/* Public routes */}
        <Route path="/"                  element={<HomePage />} />
        <Route path="/rooms"             element={<RoomsPage />} />
        <Route path="/rooms/:id"         element={<RoomDetailPage />} />
        <Route path="/booking"           element={<BookingPage />} />
        <Route path="/booking/confirmed" element={<BookingConfirmedPage />} />
        <Route path="/my-bookings"       element={<MyBookingsPage />} />
        
        {/* Shared login page for admin and staff */}
        <Route path="/login" element={<AdminLoginPage />} />
        <Route path="/admin/login" element={<Navigate to="/login" replace />} />
        <Route path="/staff/login" element={<Navigate to="/login" replace />} />

        {/* Protected admin routes */}
        <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/reservations" element={<ProtectedRoute><AdminReservations /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute><AdminUserManagement /></ProtectedRoute>} />
        <Route path="/admin/facilities" element={<ProtectedRoute><AdminFacilities /></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute><AdminReports /></ProtectedRoute>} />
        <Route path="/admin/payments" element={<ProtectedRoute><PaymentManagement /></ProtectedRoute>} />
        <Route path="/admin/feedbacks" element={<ProtectedRoute><AdminFeedbackManagement /></ProtectedRoute>} />
        <Route path="/admin/logs" element={<ProtectedRoute><AdminPlaceholderPage /></ProtectedRoute>} />
        <Route path="/admin/schedule" element={<ProtectedRoute><AdminScheduleManagement /></ProtectedRoute>} />

        {/* Protected staff routes */}
        <Route path="/staff/dashboard" element={<StaffProtectedRoute><StaffDashboard /></StaffProtectedRoute>} />
        <Route path="/staff/guests" element={<StaffProtectedRoute><StaffGuestManagement /></StaffProtectedRoute>} />
        <Route path="/staff/reservations" element={<StaffProtectedRoute><StaffReservations /></StaffProtectedRoute>} />
        <Route path="/staff/payments" element={<StaffProtectedRoute><StaffPaymentManagement /></StaffProtectedRoute>} />
        <Route path="/staff/feedbacks" element={<StaffProtectedRoute><StaffFeedbackManagement /></StaffProtectedRoute>} />
        <Route path="/staff/facilities" element={<StaffProtectedRoute><StaffFacilities /></StaffProtectedRoute>} />
        <Route path="/staff/schedule" element={<StaffProtectedRoute><StaffScheduleMonitoring /></StaffProtectedRoute>} />
      </Routes>
    </>
  );
}

