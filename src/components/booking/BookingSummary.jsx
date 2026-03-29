import styles from "../../styles/BookingSummary.module.css";


export default function BookingSummary({ room, pricing }) {
  const { nights = 0, subtotal = 0, tax = 0, total = 0, guests = 1 } = pricing;

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Booking Summary</h3>

      {/* Room image */}
      <img className={styles.img} src={room.img} alt={room.name} />

      {/* Room info */}
      <p className={styles.roomName}>{room.name}</p>
      <p className={styles.roomType}>{room.type}</p>

      <hr className={styles.divider} />

      {/* Guests */}
      <div className={styles.line}>
        <span className={styles.lineLabel}>Guests</span>
        <span className={styles.lineValue}>{guests}</span>
      </div>

      <hr className={styles.divider} />

      {/* Price breakdown */}
      <div className={styles.line}>
        <span className={styles.lineLabel}>
          {room.price} × {nights} night{nights !== 1 ? 's' : ''}
        </span>
        <span className={styles.lineValue}>₱{subtotal.toFixed(0)}</span>
      </div>

      <div className={styles.line}>
        <span className={styles.lineLabel}>Taxes &amp; Fees (15%)</span>
        <span className={styles.lineValue}>₱{tax.toFixed(2)}</span>
      </div>

      <hr className={styles.divider} />

      {/* Total */}
      <div className={styles.total}>
        <span>Total</span>
        <span>₱{total.toFixed(2)}</span>
      </div>
    </div>
  );
}
