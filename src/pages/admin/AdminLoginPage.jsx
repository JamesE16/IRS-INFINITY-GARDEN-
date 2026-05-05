import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../../context/BookingContext';
import { authAPI } from '../../utils/api';
import styles from '../../styles/AdminLoginPage.module.css';
import logo from '../../assets/logo.png';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { showToast } = useBooking();

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Enter a valid email';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast('Please fix errors and try again', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const userData = await authAPI.login(formData.email, formData.password);
      const role = userData?.profile?.role;

      localStorage.removeItem('isAdminLoggedIn');
      localStorage.removeItem('isStaffLoggedIn');
      localStorage.removeItem('adminRole');
      localStorage.removeItem('staffRole');

      if (role === 'admin') {
        localStorage.setItem('adminEmail', userData.email || formData.email);
        localStorage.setItem('isAdminLoggedIn', 'true');
        localStorage.setItem('adminRole', 'admin');
        showToast('Login successful', 'success');
        setTimeout(() => navigate('/admin/dashboard'), 500);
        return;
      }

      if (role === 'staff') {
        localStorage.setItem('staffEmail', userData.email || formData.email);
        localStorage.setItem('isStaffLoggedIn', 'true');
        localStorage.setItem('staffRole', 'staff');
        showToast('Login successful', 'success');
        setTimeout(() => navigate('/staff/dashboard'), 500);
        return;
      }

      showToast('This account does not have admin or staff access.', 'error');
    } catch (error) {
      showToast(error.message || 'Login failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => navigate('/');

  return (
    <div className={styles.container}>
      <div className={styles.overlay} onClick={handleCancel} />

      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={handleCancel}>
          x
        </button>

        <div className={styles.header}>
          <div className={styles.brand}>
            <img src={logo} alt="Infinity Garden Logo" />
            <div>
              <h3 className={styles.brandTitle}>Infinity Garden</h3>
              <p className={styles.brandSub}>Resort Hotel & Pavilion</p>
            </div>
          </div>

          <h2>Admin & Staff Login</h2>
          <p>Secure access for administrators and staff members</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>Email Address</label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="admin@infinitygarden.com"
              value={formData.email}
              onChange={handleChange}
              className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
              disabled={isLoading}
            />
            {errors.email && <p className={styles.errorMsg}>{errors.email}</p>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>Password</label>
            <input
              id="password"
              type="password"
              name="password"
              placeholder="........"
              value={formData.password}
              onChange={handleChange}
              className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
              disabled={isLoading}
            />
            {errors.password && <p className={styles.errorMsg}>{errors.password}</p>}
          </div>

          <div className={styles.infoBanner}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <p>This login is protected. Only authorized staff and admin can access.</p>
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={handleCancel} disabled={isLoading}>
              Cancel
            </button>
            <button type="submit" className={styles.loginBtn} disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>

        <div className={styles.demoNote}>
          <strong>Demo Credentials:</strong>
          <p>Admin: admin@infinitygarden.com | infinity123</p>
          <p>Staff: staffdemo@infinityresort.com | Staff123!</p>
        </div>
      </div>
    </div>
  );
}
