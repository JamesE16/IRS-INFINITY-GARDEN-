import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../../context/BookingContext';
import styles from '../../styles/AdminLoginPage.module.css';
import logo from '../../assets/logo.png'; // ✅ added

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
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
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
      let isAuthenticated = false;

      try {
        const response = await fetch('http://localhost:8000/api/users/login/', {
          method: 'POST',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          const userData = await response.json();
          isAuthenticated = true;

          localStorage.setItem('adminEmail', formData.email);
          localStorage.setItem('isAdminLoggedIn', 'true');
          localStorage.setItem('adminRole', userData.profile?.role || 'admin');
        }
      } catch {
        // Demo login
        if (
          formData.email === 'admin@infinitygarden.com' &&
          formData.password === 'infinity123'
        ) {
          isAuthenticated = true;
          localStorage.setItem('adminEmail', formData.email);
          localStorage.setItem('isAdminLoggedIn', 'true');
          localStorage.setItem('adminRole', 'admin');
          showToast('Demo admin login', 'success');
        }
      }

      if (isAuthenticated) {
        showToast('Login successful', 'success');
        setTimeout(() => navigate('/admin/dashboard'), 500);
      } else {
        showToast('Invalid credentials', 'error');
      }
    } catch {
      showToast('Login failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => navigate('/');

  return (
    <div className={styles.container}>
      <div className={styles.overlay} onClick={handleCancel} />
      
      <div className={styles.modal}>
        {/* Close button */}
        <button className={styles.closeBtn} onClick={handleCancel}>
          ✕
        </button>

        {/* Header */}
        <div className={styles.header}>

          {/* ✅ ADDED (logo + title ONLY) */}
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
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
              disabled={isLoading}
            />
            {errors.password && <p className={styles.errorMsg}>{errors.password}</p>}
          </div>

          <div className={styles.infoBanner}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            <p>This login is protected. Only authorized staff can access.</p>
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
          <p>Email: admin@infinitygarden.com | Password: infinity123</p>
        </div>
      </div>
    </div>
  );
}