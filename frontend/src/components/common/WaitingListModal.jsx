
import React, { useEffect, useState } from "react";
import api from "../../api/api";

export default function WaitingListModal({
  isOpen,
  onClose,
  patient,
  therapistId,
  date,
  failedMessage,
  bookingForm,
  onSubmit,
}) {
  const [timePeriod, setTimePeriod] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimePeriod("");
      setNotes(bookingForm?.notes || "");
    }
  }, [isOpen, bookingForm]);

  const handleClose = () => {
    if (loading) return;
    onClose?.();
  };

  if (!isOpen) return null;

  const patientId =
    patient?.id || patient?.patient_db_id || bookingForm?.patient_id;

  const safeTherapistId =
    therapistId || bookingForm?.therapist_id || "";

  const safeDate = date || bookingForm?.appointment_date || "";

  const handleSubmit = async () => {
    if (!patientId) {
      alert("Please select a patient first.");
      return;
    }

    if (loading) return;

    setLoading(true);

    try {
      const payload = {
        patient_id: patientId,
        preferred_therapist_id: safeTherapistId || null,
        preferred_date: safeDate || null,
        preferred_time_period: timePeriod,
        notes,
      };

      if (onSubmit) {
        await onSubmit(payload);
      } else {
        await api.post("callcenter/waiting-list/", payload);
      }

      alert("Added to waiting list");
      onClose?.();
    } catch (err) {
      console.error("Failed to add to waiting list", err);
      alert(
        err?.response?.data?.error ||
          "Failed to add to waiting list"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div
        style={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="waiting-list-modal-title"
      >
        <div style={styles.header}>
          <div>
            <div style={styles.eyebrow}>Waiting List</div>
            <h3
              id="waiting-list-modal-title"
              style={styles.title}
            >
              Add Patient to Waiting List
            </h3>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            aria-label="Close waiting list modal"
            style={styles.closeBtn}
          >
            ×
          </button>
        </div>

        {failedMessage ? (
          <div style={styles.notice}>{failedMessage}</div>
        ) : null}

        <div style={styles.infoBox}>
          <div>
            <strong>Patient:</strong>{" "}
            {patient?.name ||
              patient?.patient_name ||
              "Selected patient"}
          </div>

          {safeDate ? (
            <div>
              <strong>Date:</strong> {safeDate}
            </div>
          ) : null}
        </div>

        <label style={styles.label} htmlFor="waiting-list-time">
          Preferred Time
        </label>

        <select
          id="waiting-list-time"
          value={timePeriod}
          onChange={(e) => setTimePeriod(e.target.value)}
          disabled={loading}
          style={styles.input}
        >
          <option value="">Any Time</option>
          <option value="morning">Morning</option>
          <option value="afternoon">Afternoon</option>
          <option value="evening">Evening</option>
        </select>

        <label style={styles.label} htmlFor="waiting-list-notes">
          Notes
        </label>

        <textarea
          id="waiting-list-notes"
          placeholder="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={loading}
          style={styles.textarea}
        />

        <div style={styles.actions}>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            style={styles.saveBtn}
          >
            {loading ? "Saving..." : "Save"}
          </button>

          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            style={styles.cancelBtn}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.55)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
    padding: "16px",
  },
  modal: {
    background: "#fff",
    padding: "20px",
    borderRadius: "18px",
    width: "100%",
    maxWidth: "420px",
    boxShadow: "0 24px 60px rgba(15, 23, 42, 0.25)",
    display: "grid",
    gap: "12px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "flex-start",
  },
  eyebrow: {
    fontSize: "12px",
    fontWeight: "800",
    color: "#be185d",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  title: {
    margin: 0,
    fontSize: "20px",
    color: "#0f172a",
  },
  closeBtn: {
    border: "none",
    background: "#f1f5f9",
    borderRadius: "10px",
    width: "34px",
    height: "34px",
    cursor: "pointer",
    fontSize: "22px",
    lineHeight: "1",
  },
  notice: {
    background: "#fff7ed",
    border: "1px solid #fed7aa",
    color: "#9a3412",
    padding: "10px 12px",
    borderRadius: "12px",
    fontSize: "13px",
    fontWeight: "700",
  },
  infoBox: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "10px 12px",
    fontSize: "13px",
    color: "#334155",
    display: "grid",
    gap: "4px",
  },
  label: {
    fontSize: "13px",
    fontWeight: "800",
    color: "#475569",
  },
  input: {
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    outline: "none",
  },
  textarea: {
    minHeight: "90px",
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    outline: "none",
    resize: "vertical",
  },
  actions: {
    display: "flex",
    gap: "10px",
    justifyContent: "flex-end",
  },
  saveBtn: {
    background: "#be185d",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "10px 14px",
    fontWeight: "800",
    cursor: "pointer",
  },
  cancelBtn: {
    background: "#f8fafc",
    color: "#334155",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    padding: "10px 14px",
    fontWeight: "800",
    cursor: "pointer",
  },
};
