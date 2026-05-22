import styles from "../../styles/BookingSummary.module.css";


export default function BookingSummary({ room, pricing }) {
  const { nights = 0, subtotal = 0, tax = 0, total = 0, guests = 1 } = pricing;
  const unitLabel = pricing.unitLabel || ((room.type || '').toLowerCase().includes('room') ? 'night' : 'day');

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Booking Summary</h3>

      {}
      <img className={styles.img} src={room.img} alt={room.name} />

      {}
      <p className={styles.roomName}>{room.name}</p>
      <p className={styles.roomType}>{room.type}</p>

      <hr className={styles.divider} />

      {}
      <div className={styles.line}>
        <span className={styles.lineLabel}>Guests</span>
        <span className={styles.lineValue}>{guests}</span>
      </div>

      <hr className={styles.divider} />

      {}
      <div className={styles.line}>
        <span className={styles.lineLabel}>
          {room.price} × {nights} {unitLabel}{nights !== 1 ? 's' : ''}
        </span>
        <span className={styles.lineValue}>₱{subtotal.toFixed(0)}</span>
      </div>

      <div className={styles.line}>
        <span className={styles.lineLabel}>Taxes &amp; Fees (15%)</span>
        <span className={styles.lineValue}>₱{tax.toFixed(2)}</span>
      </div>

      <hr className={styles.divider} />

      {}
      <div className={styles.total}>
        <span>Total</span>
        <span>₱{total.toFixed(2)}</span>
      </div>
    </div>);

}
