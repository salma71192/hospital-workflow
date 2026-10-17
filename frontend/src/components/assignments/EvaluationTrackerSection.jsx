import React, { useCallback, useEffect, useState } from "react";
import api from "../../api/api";
function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function today() {
  return formatLocalDate(new Date());
}
function firstDayOfMonth() {
  const now = new Date();
  return formatLocalDate(new Date(now.getFullYear(), now.getMonth(), 1));
}
function displayName(row) {
  return row?.therapist_name || row?.name || row?.username || "Unknown Therapist";
}
export default function EvaluationTrackerSection({
  user,
  actingAs = null,
}) {
  const [fromDate, setFromDate] = useState(firstDayOfMonth());
  const [toDate, setToDate] = useState(today());
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("count-desc");
  const loadTracker = useCallback(async () => {
    if (fromDate && toDate && fromDate > toDate) {
      setError("The From Date cannot be later than the To Date.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (fromDate) params.append("start_date", fromDate);
      if (toDate) params.append("end_date", toDate);
      if (
        actingAs &&
        (user?.is_superuser || user?.role === "admin")
      ) {
        params.append("viewed_user_id", String(actingAs.id));
        params.append("viewed_user_role", String(actingAs.role || ""));
      }
      const response = await api.get(
        `reception/evaluation-tracker/?${params.toString()}`
      );
      setRows(response.data.therapists || []);
      setTotal(Number(response.data.total || 0));
    } catch (err) {
      console.error("Failed to load Evaluation Tracker", err);
      setRows([]);
      setTotal(0);
      setError(
        err?.response?.data?.error ||
          "Unable to load evaluations. Check the API permissions and try again."
      );
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, user, actingAs]);
  useEffect(() => {
    loadTracker();
  }, [loadTracker]);
  const filteredRows = rows
    .filter((row) =>
      displayName(row).toLowerCase().includes(search.trim().toLowerCase())
    )
    .sort((a, b) => {
      const aCount = Number(a.count ?? a.total ?? 0);
      const bCount = Number(b.count ?? b.total ?? 0);
      if (sort === "count-asc") return aCount - bCount;
      if (sort === "name-asc") {
        return displayName(a).localeCompare(displayName(b));
      }
      if (sort === "name-desc") {
        return displayName(b).localeCompare(displayName(a));
      }
      return bCount - aCount;
    });
  const dateStyle = {
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box",
    padding: "10px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    background: "#fff",
  };
  const buttonStyle = {
    padding: "10px 14px",
    border: "none",
    borderRadius: "8px",
    background: "#1e3a8a",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  };
  return (
    <section
      style={{
        width: "100%",
        minWidth: 0,
        boxSizing: "border-box",
        display: "grid",
        gap: "18px",
        padding: "24px",
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: "14px",
      }}
    >
      <div>
        <h2 style={{ margin: "0 0 6px", color: "#1e3a8a" }}>
          Evaluation Tracker
        </h2>
        <p style={{ margin: 0, color: "#64748b", lineHeight: 1.6 }}>
          Review initial evaluation counts across the physiotherapy team.
        </p>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          alignItems: "end",
          gap: "12px",
        }}
      >
        <label style={{ display: "grid", gap: "6px", fontSize: "13px" }}>
          From date
          <input
            type="date"
            value={fromDate}
            max={toDate || undefined}
            onChange={(event) => setFromDate(event.target.value)}
            style={dateStyle}
          />
        </label>
        <label style={{ display: "grid", gap: "6px", fontSize: "13px" }}>
          To date
          <input
            type="date"
            value={toDate}
            min={fromDate || undefined}
            onChange={(event) => setToDate(event.target.value)}
            style={dateStyle}
          />
        </label>
        <button
          type="button"
          onClick={loadTracker}
          disabled={loading}
          style={{ ...buttonStyle, opacity: loading ? 0.6 : 1 }}
        >
          {loading ? "Loading…" : "Refresh tracker"}
        </button>
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <input
          type="search"
          aria-label="Search therapist"
          placeholder="Search therapist…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          style={{ ...dateStyle, flex: "1 1 220px" }}
        />
        <select
          aria-label="Sort evaluations"
          value={sort}
          onChange={(event) => setSort(event.target.value)}
          style={{ ...dateStyle, width: "auto", flex: "0 1 220px" }}
        >
          <option value="count-desc">Highest evaluations</option>
          <option value="count-asc">Lowest evaluations</option>
          <option value="name-asc">Name A–Z</option>
          <option value="name-desc">Name Z–A</option>
        </select>
      </div>
      {error && (
        <div
          role="alert"
          style={{
            padding: "12px",
            background: "#fef2f2",
            color: "#b91c1c",
            borderRadius: "8px",
          }}
        >
          {error}
        </div>
      )}
      {loading ? (
        <p style={{ color: "#64748b" }}>Loading evaluation data…</p>
      ) : !error && filteredRows.length === 0 ? (
        <p style={{ color: "#64748b" }}>No evaluation records found.</p>
      ) : !error ? (
        <div style={{ width: "100%", overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
            }}
          >
            <thead>
              <tr style={{ background: "#f1f5f9" }}>
                {["#", "Physiotherapist", "Evaluations", "Monthly target (30)"].map(
                  (heading) => (
                    <th
                      key={heading}
                      style={{
                        padding: "12px",
                        borderBottom: "1px solid #e2e8f0",
                        whiteSpace: "nowrap",
                        fontSize: "13px",
                      }}
                    >
                      {heading}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row, index) => {
                const count = Number(row.count ?? row.total ?? 0);
                const percentage = Math.min(
                  Math.round((count / 30) * 100),
                  100
                );
                return (
                  <tr key={row.therapist_id ?? row.id ?? index}>
                    <td style={{ padding: "12px", borderBottom: "1px solid #e2e8f0" }}>
                      {index + 1}
                    </td>
                    <td style={{ padding: "12px", borderBottom: "1px solid #e2e8f0" }}>
                      {displayName(row)}
                    </td>
                    <td style={{ padding: "12px", borderBottom: "1px solid #e2e8f0", fontWeight: 700 }}>
                      {count}
                    </td>
                    <td style={{ padding: "12px", borderBottom: "1px solid #e2e8f0", minWidth: "150px" }}>
                      <div
                        style={{
                          height: "8px",
                          background: "#e2e8f0",
                          borderRadius: "20px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${percentage}%`,
                            background: count >= 30 ? "#059669" : "#2563eb",
                          }}
                        />
                      </div>
                      <small style={{ color: "#64748b" }}>
                        {count} / 30 ({Math.round((count / 30) * 100)}%)
                      </small>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: "#f8fafc", fontWeight: 700 }}>
                <td colSpan={2} style={{ padding: "12px" }}>
                  Total evaluations
                </td>
                <td colSpan={2} style={{ padding: "12px" }}>
                  {total}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : null}
    </section>
  );
}