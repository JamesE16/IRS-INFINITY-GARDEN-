import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const IDLE_EVENTS = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll', 'click'];

/**
 * Logs out the user after IDLE_TIMEOUT_MS of inactivity.
 * Only active when `enabled` is true (i.e. user is authenticated).
 */
export function useIdleTimeout(enabled = true) {
  const navigate = useNavigate();
  const timerRef = useRef(null);

  const doLogout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('isAdminLoggedIn');
    localStorage.removeItem('isStaffLoggedIn');
    localStorage.removeItem('adminRole');
    localStorage.removeItem('staffRole');
    localStorage.removeItem('adminEmail');
    localStorage.removeItem('staffEmail');
    navigate('/login', { replace: true });
  }, [navigate]);

  const resetTimer = useCallback(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(doLogout, IDLE_TIMEOUT_MS);
  }, [doLogout]);

  useEffect(() => {
    if (!enabled) return;

    IDLE_EVENTS.forEach((evt) =>
      window.addEventListener(evt, resetTimer, { passive: true })
    );
    resetTimer(); // start timer immediately on mount

    return () => {
      IDLE_EVENTS.forEach((evt) =>
        window.removeEventListener(evt, resetTimer)
      );
      clearTimeout(timerRef.current);
    };
  }, [enabled, resetTimer]);
}
