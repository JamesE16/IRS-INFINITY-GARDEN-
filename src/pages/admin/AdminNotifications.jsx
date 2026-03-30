import { useMemo, useState } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import styles from '../../styles/AdminNotifications.module.css';

const upcomingStays = [
  {
    id: 1,
    reservationId: '01',
    guestName: 'Cristalyn Grace Llarenas',
    room: 'Garden Deluxe',
    checkoutDate: 'March 5, 2026',
    daysLeft: 1,
    guestEmail: 'cristalgrace@gmail.com'
  },
  {
    id: 2,
    reservationId: '02',
    guestName: 'Eigmar Clarence Zamora',
    room: 'Poolside Suite',
    checkoutDate: 'March 6, 2026',
    daysLeft: 2,
    guestEmail: 'eigclarence@gmail.com'
  },
  {
    id: 3,
    reservationId: '03',
    guestName: 'Joanna Dane Cooper',
    room: 'Family Pavilion',
    checkoutDate: 'March 7, 2026',
    daysLeft: 3,
    guestEmail: 'joandane@gmail.com'
  }
];

const notificationTypes = [
  {
    value: 'end_of_stay',
    label: 'End of stay notification',
    description: 'Notify the guest that their stay is about to end.'
  },
  {
    value: 'extension_offer',
    label: 'End of stay notification with extension offer',
    description: 'Notify the guest and offer a stay extension promotion.'
  }
];

export default function AdminNotifications() {
  const [targetMode, setTargetMode] = useState('reservation');
  const [selectedTarget, setSelectedTarget] = useState(upcomingStays[0].id);
  const [notificationType, setNotificationType] = useState('end_of_stay');
  const [notes, setNotes] = useState('');
  const [notifications, setNotifications] = useState([]);

  const currentTarget = useMemo(() => {
    return upcomingStays.find((stay) => stay.id === Number(selectedTarget)) || upcomingStays[0];
  }, [selectedTarget]);

  const previewText = useMemo(() => {
    if (!currentTarget) return '';

    if (notificationType === 'extension_offer') {
      return `Dear ${currentTarget.guestName}, your stay at ${currentTarget.room} is ending on ${currentTarget.checkoutDate}. We would like to offer you an extension with a special rate. Please let us know if you'd like to stay longer.`;
    }

    return `Dear ${currentTarget.guestName}, your stay at ${currentTarget.room} is ending on ${currentTarget.checkoutDate}. Please prepare for checkout or speak with our front desk if you need assistance.`;
  }, [currentTarget, notificationType]);

  const handleSendNotification = () => {
    const targetTitle = targetMode === 'reservation' ? `Reservation ${currentTarget.reservationId}` : currentTarget.guestName;
    const newNotification = {
      id: Date.now(),
      date: new Date().toLocaleDateString(),
      target: targetTitle,
      type: notificationTypes.find((item) => item.value === notificationType)?.label,
      message: previewText,
      status: 'Pending'
    };

    setNotifications((prev) => [newNotification, ...prev]);
    setNotes('');
  };

  const reservationOptions = upcomingStays.map((stay) => ({
    value: stay.id,
    label: `${stay.reservationId} — ${stay.guestName}`
  }));

  return (
    <div className={styles.adminShell}>
      <AdminSidebar />
      <div className={styles.mainContent}>
        <div className={styles.header}>
          <div className={styles.pageHeader}>
            <div className={styles.title}>
              <h1>Notification Management</h1>
              <p>Send end-of-stay alerts to reservations or guest accounts before their checkout date.</p>
            </div>
          </div>
        </div>

        <div className={styles.container}>
          <div className={styles.cardGrid}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2>Send notification</h2>
                <p className={styles.cardSub}>Choose the notification type and target person.</p>
              </div>
              <div className={styles.formGrid}>
                <div className={styles.control}>
                  <span className={styles.label}>Notify by</span>
                  <div className={styles.radioRow}>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="targetMode"
                        value="reservation"
                        checked={targetMode === 'reservation'}
                        onChange={() => setTargetMode('reservation')}
                      />
                      Reservation
                    </label>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="targetMode"
                        value="guest"
                        checked={targetMode === 'guest'}
                        onChange={() => setTargetMode('guest')}
                      />
                      Guest account
                    </label>
                  </div>
                </div>

                <div className={styles.control}>
                  <span className={styles.label}>Select target</span>
                  <select
                    className={styles.select}
                    value={selectedTarget}
                    onChange={(event) => setSelectedTarget(event.target.value)}
                  >
                    {reservationOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.control}>
                  <span className={styles.label}>Notification type</span>
                  <select
                    className={styles.select}
                    value={notificationType}
                    onChange={(event) => setNotificationType(event.target.value)}
                  >
                    {notificationTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.control}>
                  <span className={styles.label}>Optional notes</span>
                  <textarea
                    className={styles.textarea}
                    rows="4"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Add internal notes or guest instructions..."
                  />
                </div>

                <div className={styles.control}>
                  <button className={styles.sendBtn} onClick={handleSendNotification}>
                    Send Notification
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2>Preview message</h2>
                <p className={styles.cardSub}>Review the message before sending.</p>
              </div>
              <div className={styles.previewBox}>
                <p>{previewText}</p>
                {notes && (
                  <div className={styles.notePreview}>
                    <strong>Notes:</strong> {notes}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={styles.activityHeader}>
            <div>
              <h2>Recent notifications</h2>
              <p>Notifications created for upcoming stay endings.</p>
            </div>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Target</th>
                  <th>Type</th>
                  <th>Message</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {notifications.length === 0 ? (
                  <tr>
                    <td colSpan="5" className={styles.emptyRow}>
                      No notifications sent yet. Create one above.
                    </td>
                  </tr>
                ) : (
                  notifications.map((item) => (
                    <tr key={item.id}>
                      <td>{item.date}</td>
                      <td>{item.target}</td>
                      <td>{item.type}</td>
                      <td>{item.message}</td>
                      <td>
                        <span className={`${styles.statusTag} ${styles.statusPending}`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
