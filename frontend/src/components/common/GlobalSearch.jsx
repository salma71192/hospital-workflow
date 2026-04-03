import React, { useEffect, useState, useRef } from "react";
import api from "../../api/api";
import { useNavigate } from "react-router-dom";

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);

  const navigate = useNavigate();
  const ref = useRef();

  // ================= SEARCH =================
  useEffect(() => {
    const delay = setTimeout(() => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      fetchPatients();
    }, 300);

    return () => clearTimeout(delay);
  }, [query]);

  const fetchPatients = async () => {
    try {
      const res = await api.get(`patients/?search=${query}`);
      setResults(res.data.patients || []);
    } catch {
      setResults([]);
    }
  };

  // ================= CLICK OUTSIDE =================
  useEffect(() => {
    const handleClick = (e) => {
      if (!ref.current?.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return (
    <div style={styles.wrapper} ref={ref}>
      <input
        placeholder="🔍 Search patient..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        style={styles.input}
      />

      {open && query && (
        <div style={styles.dropdown}>
          {results.length === 0 ? (
            <div style={styles.empty}>No results</div>
          ) : (
            results.map((p) => (
              <div key={p.id} style={styles.item}>
                <div>
                  <div style={styles.name}>{p.name}</div>
                  <div style={styles.meta}>{p.patient_id}</div>
                </div>

                <div style={styles.actions}>
                  <button
                    onClick={() => navigate(`/patients/${p.id}`)}
                    style={styles.open}
                  >
                    Open
                  </button>

                  <button
                    onClick={() => navigate(`/approvals?patient=${p.id}`)}
                    style={styles.update}
                  >
                    Update
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  wrapper: {
    position: "relative",
    width: "300px",
  },

  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
  },

  dropdown: {
    position: "absolute",
    top: "110%",
    left: 0,
    right: 0,
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
    zIndex: 999,
    maxHeight: "300px",
    overflowY: "auto",
  },

  item: {
    padding: "10px",
    display: "flex",
    justifyContent: "space-between",
    borderBottom: "1px solid #f1f5f9",
  },

  name: {
    fontWeight: "700",
  },

  meta: {
    fontSize: "12px",
    color: "#64748b",
  },

  actions: {
    display: "flex",
    gap: "6px",
  },

  open: {
    background: "#0ea5e9",
    color: "#fff",
    border: "none",
    padding: "6px 8px",
    borderRadius: "6px",
  },

  update: {
    background: "#16a34a",
    color: "#fff",
    border: "none",
    padding: "6px 8px",
    borderRadius: "6px",
  },

  empty: {
    padding: "10px",
    color: "#64748b",
  },
};