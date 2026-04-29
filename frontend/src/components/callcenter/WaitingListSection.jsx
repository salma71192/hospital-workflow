import React, { useMemo, useState } from "react";
import api from "../../api/api";
import UnifiedPatientSearch from "../patients/UnifiedPatientSearch";

function getPatientDbId(patient) {
  return patient?.id || patient?.patient_db_id || "";
}

function getPatientName(patient) {
  return patient?.name || patient?.patient_name || "";
}

function getPatientFile(patient) {
  return patient?.patient_id || patient?.file_number || "";
}

function getPeriodLabel(period) {
  if (period === "morning") return "Morning";
  if (period === "afternoon") return "Afternoon";
  if (period === "evening") return "Evening";
  return "Any Time";
}

export default function WaitingListSection({
  waitingList = [],
  therapists = [],
  selectedPatient,
  onSelectPatient,
  onRegisterNew,
  onAddToWaitingList,
  onDeleteEntry,
  onBookEntry,
}) {
  const [localSelectedPatient, setLocalSelectedPatient] = useState(null);
  const [therapistId, setTherapistId] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTimePeriod, setPreferredTimePeriod] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("active");

  const activePatient = selectedPatient || localSelectedPatient;

  const visibleWaitingList = useMemo(() => {
    if (tab === "history") {
      return waitingList.filter(
        (item) => item.status === "booked" || item.status === "cancelled"
      );
    }

    return waitingList.filter(
      (item) =>
        !item.status ||
        item.status === "waiting" ||
        item.status === "notified"
    );
  }, [waitingList, tab]);

  const groupedByTherapist = useMemo(() => {
    const groups = {};

    visibleWaitingList.forEach((item) => {
      const key = item.preferred_therapist_id || "none";
      const name = item.preferred_therapist_name || "No Physio Selected";

      if (!groups[key]) {
        groups[key] = {
          therapistId: key,
          therapistName: name,
          entries: [],
        };
      }

      groups[key].entries.push(item);
    });

    return Object.values(groups);
  }, [visibleWaitingList]);

  const handleSelectPatient = (patient) => {
    setLocalSelectedPatient(patient);
    onSelectPatient?.(patient);
  };

  const resetForm = () => {
    setLocalSelectedPatient(null);
    setTherapistId("");
    setPreferredDate("");
    setPreferredTimePeriod("");
    setNotes("");
  };

  const handleAdd = async () => {
    const patientId = getPatientDbId(activePatient);

    if (!patientId) {
      alert("Please add a patient first.");
      return;
    }

    const payload = {
      patient_id: patientId,
      preferred_therapist_id: therapistId || null,
      preferred_date: preferredDate || null,
      preferred_time_period: preferredTimePeriod || "",
      notes: notes || "",
    };

    setLoading(true);

    try {
      if (onAddToWaitingList) {
        await onAddToWaitingList(payload);
      } else {
        await api.post("callcenter/waiting-list/", payload);
      }

      alert("Patient added to waiting list.");
      resetForm();
    } catch (err) {
      console.error("Failed to add patient to waiting list", err);
      alert(err?.response?.data?.error || "Failed to add patient to waiting list.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.headerRow}>
          <div>
            <div style={styles.eyebrow}>Waiting List</div>
            <h2 style={styles.title}>Add Patient to Waiting List</h2>
            <div style={styles.subtext}>
              Add patients waiting for an earlier or preferred appointment slot.
            </div>
          </div>

          <div style={styles.countBadge}>{waitingList.length}</div>
        </div>

        <UnifiedPatientSearch
          title="Search Patient"
          placeholder="Search patient name or ID"
          actionLabel="Add"
          onSelectPatient={handleSelectPatient}
          emptyText="Start typing to search patients."
          noResultsText="No patient found. Open a new file if needed."
          onRegisterNew={onRegisterNew}
          registerButtonLabel="Open New File"
        />

        {activePatient ? (
          <div style={styles.selectedBox}>
            <div>
              <div style={styles.selectedLabel}>Selected Patient</div>
              <div style={styles.selectedName}>
                {getPatientName(activePatient) || "Selected patient"}
              </div>
              {getPatientFile(activePatient) ? (
                <div style={styles.selectedMeta}>
                  File: {getPatientFile(activePatient)}
                </div>
              ) : null}
            </div>

            <button
              type="button"
              style={styles.clearBtn}
              onClick={() => {
                setLocalSelectedPatient(null);
                onSelectPatient?.(null);
              }}
            >
              Clear
            </button>
          </div>
        ) : null}

        <div style={styles.formGrid}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Physio</label>
            <select
              value={therapistId}
              onChange={(e) => setTherapistId(e.target.value)}
              style={styles.input}
            >
              <option value="">Any physio</option>
              {therapists.map((therapist) => (
                <option key={therapist.id} value={therapist.id}>
                  {therapist.name || therapist.username}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Preferred Date</label>
            <input
              type="date"
              value={preferredDate}
              onChange={(e) => setPreferredDate(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Preferred Time</label>
            <select
              value={preferredTimePeriod}
              onChange={(e) => setPreferredTimePeriod(e.target.value)}
              style={styles.input}
            >
              <option value="">Any Time</option>
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
              <option value="evening">Evening</option>
            </select>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Notes</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes"
              style={styles.input}
            />
          </div>
        </div>

        <button
          type="button"
          style={{
            ...styles.primaryButton,
            ...(loading ? styles.disabledButton : {}),
          }}
          onClick={handleAdd}
          disabled={loading}
        >
          {loading ? "Adding..." : "Add to Waiting List"}
        </button>
      </div>

      <div style={styles.card}>
        <div style={styles.headerRow}>
          <div>
            <div style={styles.eyebrow}>Waiting List</div>
            <h3 style={styles.sectionTitle}>Patients</h3>
          </div>

          <div style={styles.tabButtons}>
            <button
              type="button"
              style={{
                ...styles.tabBtn,
                ...(tab === "active" ? styles.tabBtnActive : {}),
              }}
              onClick={() => setTab("active")}
            >
              Active
            </button>

            <button
              type="button"
              style={{
                ...styles.tabBtn,
                ...(tab === "history" ? styles.tabBtnActive : {}),
              }}
              onClick={() => setTab("history")}
            >
              History
            </button>
          </div>
        </div>
      </div>

      {groupedByTherapist.length === 0 ? (
        <div style={styles.emptyState}>
          {tab === "history"
            ? "No waiting list history found."
            : "No patients on waiting list."}
        </div>
      ) : (
        groupedByTherapist.map((group) => (
          <div key={group.therapistId} style={styles.card}>
            <div style={styles.headerRow}>
              <div>
                <div style={styles.eyebrow}>Physio Waiting List</div>
                <h3 style={styles.sectionTitle}>{group.therapistName}</h3>
              </div>

              <div style={styles.countBadge}>{group.entries.length}</div>
            </div>

            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Patient</th>
                    <th style={styles.th}>File</th>
                    <th style={styles.th}>Preferred Date</th>
                    <th style={styles.th}>Preferred Time</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Notes</th>
                    <th style={styles.th}>By</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {group.entries.map((entry) => (
                    <tr key={entry.id}>
                      <td style={styles.tdBold}>{entry.patient_name}</td>
                      <td style={styles.td}>{entry.patient_id}</td>
                      <td style={styles.td}>{entry.preferred_date || "-"}</td>
                      <td style={styles.td}>
                        {getPeriodLabel(entry.preferred_time_period)}
                      </td>
                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.statusBadge,
                            ...(entry.status === "notified"
                              ? styles.statusNotified
                              : {}),
                            ...(entry.status === "booked"
                              ? styles.statusBooked
                              : {}),
                            ...(entry.status === "cancelled"
                              ? styles.statusCancelled
                              : {}),
                          }}
                        >
                          {entry.status || "waiting"}
                        </span>
                      </td>
                      <td style={styles.td}>{entry.notes || "-"}</td>
                      <td style={styles.td}>{entry.created_by_name || "-"}</td>
                      <td style={styles.td}>
                        <div style={styles.actions}>
                          {(entry.status === "waiting" ||
                            entry.status === "notified" ||
                            !entry.status) && (
                            <button
                              type="button"
                              style={styles.bookBtn}
                              onClick={() => onBookEntry?.(entry)}
                            >
                              Book
                            </button>
                          )}

                          {(entry.status === "waiting" ||
                            entry.status === "notified" ||
                            !entry.status) && (
                            <button
                              type="button"
                              style={styles.removeBtn}
                              onClick={() => onDeleteEntry?.(entry.id)}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

const styles = {
  page: {
    display: "grid",
    gap: "16px",
  },
  card: {
    background: "#fff",
    borderRadius: "18px",
    padding: "22px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)",
    display: "grid",
    gap: "16px",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    flexWrap: "wrap",
  },
  eyebrow: {
    fontSize: "12px",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#be185d",
  },
  title: {
    margin: 0,
    fontSize: "22px",
    fontWeight: "800",
    color: "#0f172a",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "800",
    color: "#0f172a",
  },
  subtext: {
    marginTop: "4px",
    color: "#64748b",
    fontSize: "14px",
    fontWeight: "600",
  },
  selectedBox: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "12px",
    color: "#0f172a",
    fontSize: "14px",
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "center",
  },
  selectedLabel: {
    color: "#64748b",
    fontSize: "12px",
    fontWeight: "800",
    textTransform: "uppercase",
  },
  selectedName: {
    color: "#0f172a",
    fontSize: "15px",
    fontWeight: "900",
  },
  selectedMeta: {
    color: "#64748b",
    fontSize: "13px",
    fontWeight: "700",
    marginTop: "2px",
  },
  clearBtn: {
    background: "#fff",
    color: "#334155",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    padding: "8px 12px",
    fontWeight: "800",
    cursor: "pointer",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "12px",
  },
  fieldGroup: {
    display: "grid",
    gap: "8px",
  },
  label: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#475569",
  },
  input: {
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    background: "#fff",
    outline: "none",
  },
  primaryButton: {
    background: "#be185d",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "12px 16px",
    fontWeight: "800",
    cursor: "pointer",
  },
  disabledButton: {
    opacity: 0.65,
    cursor: "not-allowed",
  },
  countBadge: {
    minWidth: "42px",
    height: "42px",
    borderRadius: "999px",
    background: "#fdf2f8",
    color: "#be185d",
    display: "grid",
    placeItems: "center",
    fontWeight: "900",
  },
  tabButtons: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  tabBtn: {
    background: "#fff",
    color: "#334155",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    padding: "9px 14px",
    fontWeight: "800",
    cursor: "pointer",
  },
  tabBtnActive: {
    background: "#fdf2f8",
    color: "#be185d",
    borderColor: "#be185d",
  },
  tableWrap: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1080px",
  },
  th: {
    textAlign: "left",
    padding: "12px",
    background: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
    fontSize: "13px",
    color: "#334155",
  },
  td: {
    padding: "12px",
    borderBottom: "1px solid #eef2f7",
    fontSize: "14px",
    color: "#0f172a",
    verticalAlign: "top",
  },
  tdBold: {
    padding: "12px",
    borderBottom: "1px solid #eef2f7",
    fontSize: "14px",
    color: "#0f172a",
    fontWeight: "800",
    verticalAlign: "top",
  },
  statusBadge: {
    background: "#f1f5f9",
    color: "#334155",
    borderRadius: "999px",
    padding: "6px 10px",
    fontSize: "12px",
    fontWeight: "900",
    textTransform: "capitalize",
    display: "inline-block",
  },
  statusNotified: {
    background: "#fff7ed",
    color: "#9a3412",
  },
  statusBooked: {
    background: "#dcfce7",
    color: "#166534",
  },
  statusCancelled: {
    background: "#fee2e2",
    color: "#991b1b",
  },
  actions: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  bookBtn: {
    background: "#0ea5e9",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "7px 11px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "800",
  },
  removeBtn: {
    background: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "7px 11px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "800",
  },
  emptyState: {
    color: "#64748b",
    fontSize: "14px",
    fontWeight: "600",
    background: "#f8fafc",
    border: "1px dashed #cbd5e1",
    borderRadius: "12px",
    padding: "14px",
  },
};