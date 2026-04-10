import React, { useEffect, useRef, useState } from "react";
import api from "../../api/api";

export default function PatientAutocompleteFilter({
  value,
  onChange,
  label = "Patient",
  placeholder = "Search patient name or file number",
}) {
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!wrapperRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const term = (value || "").trim();

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!term) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await api.get(`patients/?search=${encodeURIComponent(term)}`);
        setResults(res.data.patients || []);
        setOpen(true);
      } catch (err) {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value]);

  return (
    <div style={styles.fieldGroup} ref={wrapperRef}>
      <label style={styles.label}>{label}</label>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => {
          if (results.length) setOpen(true);
        }}
        style={styles.input}
      />

      {open && (results.length > 0 || loading) ? (
        <div style={styles.dropdown}>
          {loading ? (
            <div style={styles.itemMuted}>Searching...</div>
          ) : (
            results.map((patient) => (
              <button
                type="button"
                key={patient.id}
                style={styles.item}
                onClick={() => {
                  onChange(`${patient.name} (${patient.patient_id})`);
                  setOpen(false);
                }}
              >
                <div style={styles.itemName}>{patient.name}</div>
                <div style={styles.itemId}>ID: {patient.patient_id}</div>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

const styles = {
  fieldGroup: {
    display: "grid",
    gap: "8px",
    position: "relative",
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
  dropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    marginTop: "4px",
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    boxShadow: "0 12px 24px rgba(15, 23, 42, 0.08)",
    zIndex: 20,
    overflow: "hidden",
    maxHeight: "240px",
    overflowY: "auto",
  },
  item: {
    width: "100%",
    textAlign: "left",
    border: "none",
    background: "#fff",
    padding: "12px 14px",
    cursor: "pointer",
    borderBottom: "1px solid #f1f5f9",
  },
  itemName: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#0f172a",
  },
  itemId: {
    fontSize: "12px",
    color: "#64748b",
    marginTop: "2px",
  },
  itemMuted: {
    padding: "12px 14px",
    fontSize: "13px",
    color: "#64748b",
  },
};