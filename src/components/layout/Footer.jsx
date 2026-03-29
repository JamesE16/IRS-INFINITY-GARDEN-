import styles from "../../styles/Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.grid}>
        {/* Col 1 — About */}
        <div className={styles.col}>
          <h4 className={styles.brandTitle}>Infinity Garden Resort</h4>
          <p>
            Experience tranquility in our tropical paradise.
            Your perfect escape awaits.
          </p>
        </div>

        {/* Col 2 — Contact */}
        <div className={styles.col}>
          <h4>Contact Us</h4>
          <div className={styles.contactItem}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.64 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.08 6.08l1.17-1.17a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            <span>+63 (74) 442-1234</span>
          </div>
          <div className={styles.contactItem}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            <span>info@infinitygarden.com</span>
          </div>
          <div className={styles.contactItem}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <span>Agoo, La Union, Philippines</span>
          </div>
        </div>

        {/* Col 3 — Check-in info */}
        <div className={styles.col}>
          <h4>Check-in &amp; Check-out</h4>
          <p>Check-in: <strong>1:00 PM onwards</strong></p>
          <p>Check-out: <strong>12:00 PM next day</strong></p>
          <p className={styles.policy}>
            Cancellation Policy: Free cancellation up to 48 hours before check-in
          </p>
        </div>
      </div>

      <div className={styles.bottom}>
        <p>© 2026 Infinity Garden Resort Hotel &amp; Pavilion. All rights reserved.</p>
      </div>
    </footer>
  );
}
