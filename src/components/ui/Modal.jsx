import styles from "../../styles/Modal.module.css";


export default function Modal({ title, message, confirmLabel = 'Confirm', onConfirm, onCancel }) {
  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onCancel();
  };

  return (
    <div className={styles.overlay} onClick={handleBackdrop} role="dialog" aria-modal="true">
      <div className={styles.box}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.message}>{message}</p>
        <div className={styles.actions}>
          <button className={styles.keepBtn} onClick={onCancel}>
            Keep Booking
          </button>
          <button className={styles.confirmBtn} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
