import { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import styles from '../../styles/AdminScheduleManagement.module.css';

import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  parseISO,
} from "date-fns";


function fmtDate(dateStr) {
  if (!dateStr) return "—";
  return format(parseISO(dateStr), "MMM d, yyyy");
}

function expandBlackout(raw) {
  const b = normalizeBlackout(raw); 
  const entries = [];
  if (!b.startDate) return entries;
  try {
    let cur = parseISO(b.startDate);
    const endDate = parseISO(b.endDate || b.startDate);
    while (cur <= endDate) {
      entries.push({ ...b, _type: "blackout", date: format(cur, "yyyy-MM-dd") });
      cur = addDays(cur, 1);
    }
  } catch (e) {
    console.warn("expandBlackout: invalid date in", raw, e);
  }
  return entries;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

function authHeaders() {
  return {
    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
    "Content-Type": "application/json",
  };
}


function normalizeBlackout(b) {
  return {
    ...b,
    facilityId:      b.facilityId      || b.facility_id || b.facility?.id || (typeof b.facility === "number" ? b.facility : ""),
    facility:        b.facility_name   || b.facilityLabel || b.facility?.name || (typeof b.facility === "string" ? b.facility : ""),
    maintenanceType: b.maintenanceType || b.maintenance_type || b.reason || "",
    startDate:       b.startDate       || b.start_date       || "",
    endDate:         b.endDate         || b.end_date         || b.startDate || b.start_date || "",
    startTime:       b.startTime       || b.start_time       || "",
    endTime:         b.endTime         || b.end_time         || "",
    status:          b.status          || "Scheduled",
    notes:           b.notes           || "",
  };
}

async function fetchFacilities() {
  try {
    const res = await fetch(`${API_BASE}/facilities/`, {
      credentials: "include",
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch facilities");
    const data = await res.json();
    const list = Array.isArray(data) ? data : data.results ?? [];
    return list
      .map((f) => {
        if (typeof f === "string") return { id: f, name: f };
        const id = f.id ?? f.value ?? f.facility_id;
        const name = f.name || f.facility_name || f.label || "";
        if (id == null || !name) return null;
        return { id, name };
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

async function fetchMaintenanceTypes() {
  return ["Maintenance"];
}

async function fetchStatusOptions() {
  return ["Scheduled"];
}

async function fetchAllReservations() {
  const response = await fetch(`${API_BASE}/reservations/`, {
    credentials: "include",
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch reservations");
  const data = await response.json();
  const list = Array.isArray(data) ? data : data.results ?? [];

  const normalized = [];
  list.forEach((r) => {
    const facilityName =
      r.facility_name || r.facility?.name || r.room_name || r.room || "Reserved";
    const customerName =
      r.guest_name || r.customer_name || r.user_name ||
      r.user?.full_name || r.user?.email || "Guest";
    const checkIn  = r.check_in  || r.check_in_date  || r.date;
    const checkOut = r.check_out || r.check_out_date || null;
    const status   = (r.status || "pending").toLowerCase();
    const guests   = r.guests ?? r.guest_count ?? r.num_guests ?? 1;

    if (!checkIn) return;

    if (checkOut && checkOut !== checkIn) {
      let current = new Date(checkIn);
      const end   = new Date(checkOut);
      while (current < end) {
        normalized.push({
          id: r.id, date: current.toISOString().split("T")[0],
          label: facilityName, customer: customerName,
          status, guests, _type: "reservation",
        });
        current.setDate(current.getDate() + 1);
      }
    } else {
      normalized.push({
        id: r.id, date: checkIn, label: facilityName,
        customer: customerName, status, guests, _type: "reservation",
      });
    }
  });

  return normalized;
}

async function fetchBlackoutSchedules() {
  try {
    const response = await fetch(`${API_BASE}/blackout-dates/`, {
      credentials: "include",
      headers: authHeaders(),
    });

    if (response.status === 403) {
      console.warn("Blackout API: 403 Forbidden — staff does not have read access. Ask your backend developer to allow GET for authenticated users.");
      return [];
    }

    if (!response.ok) {
      console.warn("Blackout API returned", response.status);
      return [];
    }

    const data = await response.json();
    const list = Array.isArray(data) ? data : data.results ?? [];

    return list.map(normalizeBlackout);
  } catch (err) {
    console.warn("fetchBlackoutSchedules error:", err);
    return [];
  }
}

async function createBlackout(payload) {
  const res = await fetch(`${API_BASE}/blackout-dates/`, {
    method: "POST",
    credentials: "include",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create blackout");
  return res.json();
}

async function updateBlackout(id, payload) {
  const res = await fetch(`${API_BASE}/blackout-dates/${id}/`, {
    method: "PUT",
    credentials: "include",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update blackout");
  return res.json();
}

async function deleteBlackout(id) {
  const res = await fetch(`${API_BASE}/blackout-dates/${id}/`, {
    method: "DELETE",
    credentials: "include",
    headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
  });
  if (!res.ok) throw new Error("Failed to delete blackout");
}

export default function AdminScheduleManagement({ role = "admin" }) {
  const isAdmin = role === "admin";

  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTab, setActiveTab]     = useState("all");

  const [facilityOptions, setFacilityOptions]   = useState([]);
  const [maintenanceTypes, setMaintenanceTypes] = useState([]);
  const [statusOptions, setStatusOptions]       = useState([]);
  const [optionsLoading, setOptionsLoading]     = useState(true);

  const [reservations, setReservations] = useState([]);
  const [blackouts, setBlackouts]       = useState([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [error, setError]               = useState(null);

  const [selectedDay, setSelectedDay] = useState(null);

  const [showForm, setShowForm]     = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm]             = useState({
    facility: "", maintenanceType: "", startDate: "", endDate: "",
    startTime: "08:00", endTime: "17:00", status: "", notes: "",
  });
  const [isSaving, setIsSaving]   = useState(false);
  const [formError, setFormError] = useState(null);

  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const makeEmptyForm = (facilities, types, statuses) => ({
    facility:        facilities[0]?.id ?? "",
    maintenanceType: types[0]      ?? "",
    startDate:  "",
    endDate:    "",
    startTime:  "08:00",
    endTime:    "17:00",
    status:     statuses[0] ?? "",
    notes:      "",
  });

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      setOptionsLoading(true);
      try {
        const [resData, blkData, facilities, types, statuses] = await Promise.all([
          fetchAllReservations(),
          fetchBlackoutSchedules(),
          fetchFacilities(),
          fetchMaintenanceTypes(),
          fetchStatusOptions(),
        ]);
        setReservations(resData);
        setBlackouts(blkData);
        setFacilityOptions(facilities);
        setMaintenanceTypes(types);
        setStatusOptions(statuses);
        setForm(makeEmptyForm(facilities, types, statuses));
        setError(null);
      } catch (err) {
        console.error(err);
        setError("Unable to load schedule data.");
      } finally {
        setIsLoading(false);
        setOptionsLoading(false);
      }
    })();
  }, []);

  const expandedBlackouts = blackouts.flatMap(expandBlackout);

  const matchesTabStatus = (status, tab) => {
    if (tab === "all") return true;
    if (tab === "approved") return ["approved", "confirmed", "paid"].includes(status);
    return status === tab;
  };

  const filteredReservations = reservations.filter((r) => {
    const sameMonth  = isSameMonth(new Date(r.date), currentDate);
    const statusMatch = matchesTabStatus(r.status, activeTab);
    return sameMonth && statusMatch;
  });

  const getCount = (type) =>
    reservations.filter((r) => {
      const sameMonth = isSameMonth(new Date(r.date), currentDate);
      return sameMonth && matchesTabStatus(r.status, type);
    }).length;

  // ── Status helpers ──
  const getStatusClass = (status) => {
    if (["approved", "confirmed", "paid"].includes(status)) return styles.statusApproved;
    if (["cancelled", "canceled", "declined", "rejected", "inactive"].includes(status)) return styles.statusCancelled;
    return styles.statusPending;
  };

  const getStatusGroup = (status) => {
    if (["approved", "confirmed", "paid"].includes(status)) return "confirmed";
    if (["cancelled", "canceled", "declined", "rejected", "inactive"].includes(status)) return "cancelled";
    return "pending";
  };

  const groupReservations = (list) => {
    const grouped = { confirmed: [], pending: [], cancelled: [] };
    list.forEach((r) => grouped[getStatusGroup(r.status)].push(r));
    return [
      { key: "confirmed", label: "Confirmed", items: grouped.confirmed },
      { key: "pending",   label: "Pending",   items: grouped.pending   },
      { key: "cancelled", label: "Cancelled", items: grouped.cancelled },
    ].filter((g) => g.items.length > 0);
  };

  // ── Form handlers ──
  const resetForm = () => {
    setForm(makeEmptyForm(facilityOptions, maintenanceTypes, statusOptions));
    setEditTarget(null);
    setFormError(null);
  };

  const openAdd = () => { resetForm(); setShowForm(true); };

  const openEdit = (b) => {
    setEditTarget(b);
    setForm({
      facility:        b.facilityId      || facilityOptions[0]?.id || "",
      maintenanceType: b.maintenanceType || b.maintenance_type || maintenanceTypes[0]  || "",
      startDate: b.startDate || b.start_date || "",
      endDate:   b.endDate   || b.end_date   || "",
      startTime: b.startTime || b.start_time || "08:00",
      endTime:   b.endTime   || b.end_time   || "17:00",
      status:    b.status    || statusOptions[0] || "",
      notes:     b.notes     || "",
    });
    setSelectedDay(null);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setFormError(null);

    const selectedFacility = facilityOptions.find((option) => String(option.id) === String(form.facility));
    if (!selectedFacility) {
      setFormError("Please select a valid facility.");
      setIsSaving(false);
      return;
    }

    const payload = {
      facility:         selectedFacility.id,
      start_date:       form.startDate,
      end_date:         form.endDate,
      reason:           form.notes || form.maintenanceType || "Maintenance",
    };

    try {
      if (editTarget) {
        const saved = await updateBlackout(editTarget.id, payload);
        setBlackouts((prev) =>
          prev.map((b) => (b.id === editTarget.id ? normalizeBlackout({
            ...saved,
            facility_name: selectedFacility.name,
            maintenanceType: form.maintenanceType,
            status: form.status,
            notes: form.notes,
          }) : b))
        );
      } else {
        const saved = await createBlackout(payload);
        setBlackouts((prev) => [normalizeBlackout({
          ...saved,
          facility_name: selectedFacility.name,
          maintenanceType: form.maintenanceType,
          status: form.status,
          notes: form.notes,
        }), ...prev]);
      }
      setShowForm(false);
      resetForm();
    } catch (err) {
      console.error(err);
      setFormError("Unable to save blackout date.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteBlackout(id);
    } catch (err) {
      console.warn("deleteBlackout failed:", err);
    }
    setBlackouts((prev) => prev.filter((b) => b.id !== id));
    setDeleteConfirm(null);
    setSelectedDay(null);
  };

  const renderHeader = () => (
    <div className={styles.calHeader}>
      <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className={styles.navBtn}>◀</button>
      <h2>{format(currentDate, "MMMM yyyy")}</h2>
      <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className={styles.navBtn}>▶</button>
    </div>
  );

  const renderDays = () => {
    const startDate = startOfWeek(currentDate);
    return (
      <div className={styles.daysRow}>
        {[...Array(7)].map((_, i) => (
          <div key={i} className={styles.dayName}>
            {format(addDays(startDate, i), "EEE").toUpperCase()}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd   = endOfMonth(monthStart);
    const startDate  = startOfWeek(monthStart);
    const endDate    = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day  = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const dayRes = filteredReservations.filter((r) => isSameDay(new Date(r.date), day));
        const dayBlk = expandedBlackouts.filter((b) => isSameDay(parseISO(b.date), day));
        const isDisabled  = !isSameMonth(day, monthStart);
        const hasEvent    = dayRes.length > 0;
        const hasBlackout = dayBlk.length > 0;
        const hasAny      = hasEvent || hasBlackout;

        days.push(
          <div
            key={day.toString()}
            className={[
              styles.cell,
              isDisabled ? styles.disabled : "",
              hasEvent && !hasBlackout ? styles.hasEvent : "",
              hasBlackout && !hasEvent ? styles.hasBlackout : "",
              hasEvent && hasBlackout ? styles.hasBoth : "",
            ].join(" ")}
            onClick={() => hasAny && setSelectedDay({ date: day, reservations: dayRes, blackouts: dayBlk })}
          >
            <span className={styles.date}>{format(day, "d")}</span>

            {dayRes.slice(0, hasBlackout ? 1 : 2).map((event, idx) => (
              <div key={`r-${idx}`} className={styles.event}>
                <span className={styles.dot}></span>
                {event.label}
              </div>
            ))}

            {hasBlackout && (
              <div className={styles.blackoutChip}>
                <span className={styles.blackoutDot}></span>
                {dayBlk[0].facility || dayBlk[0].facility_name}
              </div>
            )}

            {(dayRes.length + dayBlk.length) > 2 && (
              <div className={styles.moreEvents}>
                +{dayRes.length + dayBlk.length - 2} more
              </div>
            )}
          </div>
        );

        day = addDays(day, 1);
      }

      rows.push(
        <div className={styles.row} key={day.toString()}>{days}</div>
      );
      days = [];
    }

    return <div>{rows}</div>;
  };

  
  const monthBlackouts = blackouts.filter((b) => {
    if (!b.startDate) return false;
    try { return isSameMonth(parseISO(b.startDate), currentDate); }
    catch { return false; }
  });

  return (
    <div className={styles.adminShell}>
      <Sidebar role={role} />

      <div className={styles.mainContent}>

        <div className={styles.topHeader}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h1>Schedule Management</h1>
              <p>
                {isAdmin
                  ? "Infinity Garden Resort Reservation Management System"
                  : "Infinity Garden Resort - Staff View"}
              </p>
            </div>
            {isAdmin && (
              <div style={{ display: "flex", gap: 10 }}>
                <button className={styles.headerBtn} onClick={openAdd}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Add Blackout Date
                </button>
              </div>
            )}
          </div>
        </div>

        <div className={styles.container}>

          <div className={styles.tabs}>
            {["all", "pending", "approved"].map((tab) => (
              <button
                key={tab}
                className={`${styles.tab} ${activeTab === tab ? styles.active : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)} ({getCount(tab)})
              </button>
            ))}
          </div>

          <div className={styles.calendarBox}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <h3 style={{ margin: 0 }}>Reservation Calendar and Availability</h3>
              <div className={styles.legend}>
                <span className={styles.legendItem}>
                  <span className={styles.legendDotReservation}></span> Reservation
                </span>
                <span className={styles.legendItem}>
                  <span className={styles.legendDotBlackout}></span> Maintenance
                </span>
                <span className={styles.legendItem}>
                  <span className={styles.legendDotBoth}></span> Both
                </span>
              </div>
            </div>

            {error && (
              <div className={styles.errorBanner}><p>{error}</p></div>
            )}

            {isLoading ? (
              <div className={styles.loadingState}><p>Loading schedule...</p></div>
            ) : (
              <div className={styles.calendar}>
                {renderHeader()}
                {renderDays()}
                {renderCells()}
              </div>
            )}
          </div>

          {isAdmin && (
            <div className={styles.blackoutPanel}>
              <div className={styles.blackoutPanelHeader}>
                <h3>
                  Maintenance Blackouts — {format(currentDate, "MMMM yyyy")}
                  <span className={styles.blackoutCount}>{monthBlackouts.length}</span>
                </h3>
              </div>

              {monthBlackouts.length === 0 ? (
                <div className={styles.blackoutEmpty}>
                  No maintenance blackouts this month.
                </div>
              ) : (
                <div className={styles.blackoutTable}>
                  <table>
                    <thead>
                      <tr>
                        <th>Facility</th>
                        <th>Type</th>
                        <th>Start</th>
                        <th>End</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthBlackouts.map((b) => (
                        <tr key={b.id}>
                          <td><strong>{b.facility || b.facility_name}</strong></td>
                          <td>{b.maintenanceType || b.maintenance_type}</td>
                          <td>{fmtDate(b.startDate || b.start_date)}</td>
                          <td>{fmtDate(b.endDate   || b.end_date)}</td>

                          <td>
                            <span className={`${styles.blkBadge} ${styles["blkStatus_" + (b.status || "Scheduled").replace(/ /g, "")]}`}>
                              {b.status || "Scheduled"}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                              <button className={styles.blkEditBtn} onClick={() => openEdit(b)}>Edit</button>
                              <button className={styles.blkDelBtn} onClick={() => setDeleteConfirm(b)}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {selectedDay && (
        <div className={styles.modalOverlay} onClick={() => setSelectedDay(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>

            <div className={styles.modalHeader}>
              <h3>
                {selectedDay.blackouts.length > 0 && selectedDay.reservations.length > 0
                  ? "Reservations & Maintenance"
                  : selectedDay.blackouts.length > 0
                  ? "Maintenance Blackout"
                  : "Reserved Facilities"}
              </h3>
              <p className={styles.modalSubtitle}>
                {format(selectedDay.date, "MMMM d, yyyy")}
              </p>
            </div>

            <button
              className={styles.modalClose}
              onClick={() => setSelectedDay(null)}
              aria-label="Close Modal"
            >✕</button>

            <div className={styles.modalBody}>

              {selectedDay.blackouts.length > 0 && (
                <div className={styles.modalGroup}>
                  <div className={`${styles.modalGroupLabel} ${styles.groupLabel_blackout}`}>
                    🔧 Maintenance ({selectedDay.blackouts.length})
                  </div>
                  {selectedDay.blackouts.map((b, idx) => (
                    <div key={idx} className={`${styles.modalItem} ${styles.modalItem_blackout}`}>
                      <div className={styles.modalRow}>
                        <span>Facility</span>
                        <strong>{b.facility || b.facility_name}</strong>
                      </div>
                      <div className={styles.modalRow}>
                        <span>Type</span>
                        <strong>{b.maintenanceType || b.maintenance_type}</strong>
                      </div>

                      <div className={styles.modalRow}>
                        <span>Status</span>
                        <strong>
                          <span className={`${styles.blkBadge} ${styles["blkStatus_" + (b.status || "Scheduled").replace(/ /g, "")]}`}>
                            {b.status || "Scheduled"}
                          </span>
                        </strong>
                      </div>
                      {b.notes && (
                        <div className={styles.modalRow}>
                          <span>Notes</span>
                          <strong style={{ textAlign: "right", maxWidth: "55%", fontWeight: 400 }}>{b.notes}</strong>
                        </div>
                      )}
                      {isAdmin && (
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", marginTop: 6 }}>
                          <button className={styles.blkEditBtn} onClick={() => openEdit(b)}>Edit</button>
                          <button className={styles.blkDelBtn} onClick={() => setDeleteConfirm(b)}>Delete</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {selectedDay.reservations.length > 0 &&
                groupReservations(selectedDay.reservations).map((group) => (
                  <div key={group.key} className={styles.modalGroup}>
                    <div className={`${styles.modalGroupLabel} ${styles["groupLabel_" + group.key]}`}>
                      {group.label} ({group.items.length})
                    </div>
                    {group.items.map((r, idx) => (
                      <div key={idx} className={`${styles.modalItem} ${styles["modalItem_" + getStatusGroup(r.status)]}`}>
                        <div className={styles.modalRow}>
                          <span>Room / Facility</span>
                          <strong>{r.label}</strong>
                        </div>
                        <div className={styles.modalRow}>
                          <span>Status</span>
                          <strong className={getStatusClass(r.status)}>
                            {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                          </strong>
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              }

            </div>

            <button className={styles.closeBtn} onClick={() => setSelectedDay(null)}>
              Close
            </button>
          </div>
        </div>
      )}

     
      {isAdmin && showForm && (
        <div className={styles.modalOverlay} onClick={() => { setShowForm(false); resetForm(); }}>
          <div className={styles.formModal} onClick={(e) => e.stopPropagation()}>

            <div className={styles.modalHeader}>
              <h3>{editTarget ? "Edit Blackout Schedule" : "New Blackout Date"}</h3>
              <p className={styles.modalSubtitle}>
                {editTarget
                  ? "Update the maintenance blackout details"
                  : "Block dates for facility maintenance"}
              </p>
            </div>
            <button
              className={styles.modalClose}
              onClick={() => { setShowForm(false); resetForm(); }}
            >✕</button>

            {formError && <p className={styles.formError}>{formError}</p>}

            <div className={styles.modalBody}>
              <form className={styles.formGrid} onSubmit={handleSubmit}>

                <div className={styles.formFieldWide}>
                  <label className={styles.formLabel}>Facility</label>
                  {optionsLoading ? (
                    <select className={styles.formInput} disabled>
                      <option>Loading facilities…</option>
                    </select>
                  ) : facilityOptions.length === 0 ? (
                    <input
                      className={styles.formInput}
                      type="text"
                      placeholder="No facilities available"
                      value={form.facility}
                      disabled
                      readOnly
                    />
                  ) : (
                    <select
                      className={styles.formInput}
                      value={form.facility}
                      onChange={(e) => setForm((p) => ({ ...p, facility: e.target.value }))}
                      required
                    >
                      {facilityOptions.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  )}
                </div>

                <div className={styles.formFieldWide}>
                  <label className={styles.formLabel}>Maintenance Type</label>
                  {optionsLoading ? (
                    <select className={styles.formInput} disabled>
                      <option>Loading types…</option>
                    </select>
                  ) : maintenanceTypes.length === 0 ? (
                    <input
                      className={styles.formInput}
                      type="text"
                      placeholder="Enter maintenance type"
                      value={form.maintenanceType}
                      onChange={(e) => setForm((p) => ({ ...p, maintenanceType: e.target.value }))}
                      required
                    />
                  ) : (
                    <select
                      className={styles.formInput}
                      value={form.maintenanceType}
                      onChange={(e) => setForm((p) => ({ ...p, maintenanceType: e.target.value }))}
                      required
                    >
                      {maintenanceTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  )}
                </div>

                <div className={styles.formField}>
                  <label className={styles.formLabel}>Start Date</label>
                  <input
                    className={styles.formInput}
                    type="date"
                    required
                    value={form.startDate}
                    onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
                  />
                </div>

                <div className={styles.formField}>
                  <label className={styles.formLabel}>End Date</label>
                  <input
                    className={styles.formInput}
                    type="date"
                    required
                    value={form.endDate}
                    min={form.startDate}
                    onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
                  />
                </div>

                <div className={styles.formField}>
                  <label className={styles.formLabel}>Start Time</label>
                  <input
                    className={styles.formInput}
                    type="time"
                    required
                    value={form.startTime}
                    onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))}
                  />
                </div>

                <div className={styles.formField}>
                  <label className={styles.formLabel}>End Time</label>
                  <input
                    className={styles.formInput}
                    type="time"
                    required
                    value={form.endTime}
                    onChange={(e) => setForm((p) => ({ ...p, endTime: e.target.value }))}
                  />
                </div>

                <div className={styles.formField}>
                  <label className={styles.formLabel}>Status</label>
                  {optionsLoading ? (
                    <select className={styles.formInput} disabled>
                      <option>Loading statuses…</option>
                    </select>
                  ) : statusOptions.length === 0 ? (
                    <input
                      className={styles.formInput}
                      type="text"
                      placeholder="Enter status"
                      value={form.status}
                      onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                      required
                    />
                  ) : (
                    <select
                      className={styles.formInput}
                      value={form.status}
                      onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                      required
                    >
                      {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  )}
                </div>

                <div className={styles.formFieldWide}>
                  <label className={styles.formLabel}>Notes / Details</label>
                  <textarea
                    className={styles.formInput}
                    style={{ minHeight: 68, resize: "vertical", fontFamily: "inherit" }}
                    value={form.notes}
                    onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                    placeholder="Describe the maintenance work…"
                  />
                </div>

                <div className={styles.formActions}>
                  <button
                    type="button"
                    className={styles.formCancelBtn}
                    onClick={() => { setShowForm(false); resetForm(); }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={styles.formSaveBtn}
                    disabled={isSaving || optionsLoading}
                  >
                    {isSaving ? "Saving…" : editTarget ? "Save Changes" : "Create Blackout"}
                  </button>
                </div>

              </form>
            </div>
          </div>
        </div>
      )}


      {deleteConfirm && (
        <div className={styles.modalOverlay} onClick={() => setDeleteConfirm(null)}>
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "2.2rem", marginBottom: 10 }}>🗑️</div>
              <h3 style={{ margin: "0 0 8px", color: "#0f172a" }}>Delete Blackout?</h3>
              <p style={{ color: "#64748b", margin: "0 0 20px", fontSize: "0.9rem" }}>
                Remove the maintenance blackout for{" "}
                <strong>{deleteConfirm.facility || deleteConfirm.facility_name}</strong> starting{" "}
                {fmtDate(deleteConfirm.startDate || deleteConfirm.start_date)}?
              </p>
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <button className={styles.formCancelBtn} onClick={() => setDeleteConfirm(null)}>
                  Cancel
                </button>
                <button
                  className={styles.formSaveBtn}
                  style={{ background: "#dc2626" }}
                  onClick={() => handleDelete(deleteConfirm.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

