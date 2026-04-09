import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../../components/admin/AdminSidebar';
import styles from "../../styles/AdminScheduleManagement.module.css";

export default function AdminScheduleManagement() {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thurs", "Fri", "Sat"];

  const dates = [
    "", 1, 2, 3, 4, 5, 6, 7,
    8, 9, 10, 11, 12, 13, 14,
    15, 16, 17, 18, 19, 20, 21,
    22, 23, 24, 25, 26, 27, 28,
    29, 30, 31
  ];

  const reservedDates = [3, 7, 8, 9, 11, 16, 20, 24, 26, 27, 29, 30];

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>SCHEDULE MANAGEMENT</h2>

      <div className={styles.header}>
        <button className={styles.btn}>+ Add Schedule</button>
        <button className={styles.btnLight}>Export</button>
        <button className={styles.btnLight}>Filter</button>
      </div>

      <div className={styles.calendarBox}>
        <div className={styles.calendarHeader}>
          <button>{"<"}</button>
          <span>March 2026</span>
          <button>{">"}</button>
        </div>

        <div className={styles.daysRow}>
          {days.map((day) => (
            <div key={day} className={styles.day}>{day}</div>
          ))}
        </div>

        <div className={styles.grid}>
          {dates.map((date, index) => (
            <div key={index} className={styles.cell}>
              {date && (
                <>
                  <span className={styles.date}>{date}</span>

                  {reservedDates.includes(date) && (
                    <div className={styles.reserved}>Reserved</div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}