import { useBooking } from '../../context/BookingContext';
import styles from "../../styles/Toast.module.css";


export default function Toast() {
  const { toast } = useBooking();
  if (!toast) return null;

  const isSuccess = toast.type === 'success';

  return (
    <div className={`${styles.toast} ${isSuccess ? styles.success : styles.error}`}>
      {isSuccess ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9"  y2="15"/>
          <line x1="9"  y1="9" x2="15" y2="15"/>
        </svg>
      )}
      <span>{toast.msg}</span>
    </div>
  );
}
