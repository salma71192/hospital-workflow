import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import PatientSearch from "../components/PatientSearch";
import AssignmentHistory from "../components/AssignmentHistory";
import AssignmentProgressCard from "../components/AssignmentProgressCard";

export default function PhysioDashboard({
  user,
  onLogout,
  actingAs,
  onStopImpersonation,
}) {
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState("today");
  const [assignments, setAssignments] = useState([]);
  const [dailyTarget, setDailyTarget] = useState(8);

  const handleBackToAdmin = () => {
    onStopImpersonation();
    navigate("/admin");
  };

  const loadAssignments = async () => {
    try {
      const res = await api.get(
        `reception/assignments/?start_date=${today}&end_date=${today}`
      );
      setAssignments(res.data.assignments || []);
    } catch (err) {
      console.error("Failed to load assignments", err);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, [today]);

  const sidebarItems = [
    { key: "today", label: "Today's Assignments" },
    { key: "history", label: "History" },
    { key: "patients", label: "Patient Tracker" },
  ];

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {actingAs && (
          <div style={styles.banner}>
            <span>Viewing as: {user?.username}</span>
            <button style={styles.bannerButton} onClick={handleBackToAdmin}>
              Back to Admin
            </button>
          </div>
        )}

        <div style={styles.topBar}>
          <div>
            <h1 style={styles.title}>Physio Dashboard</h1>
            <p style={styles.subtitle}>
              Welcome, {user?.username || "Physio User"}
            </p>
          </div>

          <div style={styles.topActions}>
            <button
              style={styles.sidebarToggle}
              onClick={() => setSidebarOpen((prev) => !prev)}
            >
              {sidebarOpen ? "Hide Menu" : "Show Menu"}
            </button>

            <button style={styles.logoutButton} onClick={onLogout}>
              Logout
            </button>
          </div>
        </div>

        <div
          style={{
            ...styles.layout,
            gridTemplateColumns: sidebarOpen ? "280px 1fr" : "1fr",
          }}
        >
          {sidebarOpen && (
            <aside style={styles.sidebar}>
              <div style={styles.sidebarTitle}>Physio Panel</div>

              {sidebarItems.map((item) => (
                <button
                  key={item.key}
                  style={{
                    ...styles.sidebarButton,
                    ...(activeSection === item.key
                      ? styles.sidebarButtonActive
                      : {}),
                  }}
                  onClick={() => setActiveSection(item.key)}
                >
                  {item.label}
                </button>
              ))}
            </aside>
          )}

          <main style={styles.content}>
            {activeSection === "today" && (
              <div style={styles.sectionStack}>
                <div style={styles.targetRow}>
                  <input
                    type="number"
                    min="1"
                    value={dailyTarget}
                    onChange={(e) => setDailyTarget(e.target.value)}
                    style={styles.targetInput}
                    placeholder="Daily target"
                  />
                </div>

                <AssignmentProgressCard
                  title="Today's Assignments"
                  count={assignments.length}
                  target={dailyTarget}
                  subtitle={today}
                />

                <div style={styles.card}>
                  <h2 style={styles.cardTitle}>Today's Assigned Patients</h2>

                  {assignments.length > 0 ? (
                    <div style={styles.assignmentList}>
                      {assignments.map((item) => (
                        <div key={item.id} style={styles.assignmentCard}>
                          <div style={styles.assignmentPatient}>
                            {item.patient_name}
                          </div>
                          <div style={styles.assignmentMeta}>
                            Patient ID: {item.patient_file_id}
                          </div>
                          <div style={styles.assignmentMeta}>
                            Date: {item.assignment_date}
                          </div>
                          {item.notes ? (
                            <div style={styles.assignmentMeta}>
                              Notes: {item.notes}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={styles.emptyState}>
                      No assigned patients for today.
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeSection === "history" && (
              <AssignmentHistory
                title="Physio Assignment History"
                currentUser={user}
              />
            )}

            {activeSection === "patients" && <PatientSearch />}
          </main>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #eefaf5 0%, #f8fffc 100%)",
    padding: "32px 20px",
    fontFamily: "Arial, sans-serif",
  },
  container: {
    maxWidth: "1250px",
    margin: "0 auto",
  },
  banner: {
    background: "#fef3c7",
    border: "1px solid #fcd34d",
    color: "#92400e",
    padding: "12px 16px",
    borderRadius: "12px",
    marginBottom: "18px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bannerButton: {
    background: "#92400e",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "8px 12px",
    cursor: "pointer",
    fontWeight: "700",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
    marginBottom: "24px",
  },
  topActions: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  title: {
    margin: 0,
    fontSize: "34px",
    fontWeight: "800",
    color: "#166534",
  },
  subtitle: {
    margin: "8px 0 0 0",
    color: "#64748b",
    fontSize: "16px",
  },
  sidebarToggle: {
    background: "#0f766e",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    padding: "12px 18px",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
  },
  logoutButton: {
    background: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    padding: "12px 18px",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
  },
  layout: {
    display: "grid",
    gap: "22px",
    alignItems: "start",
  },
  sidebar: {
    background: "#ffffff",
    borderRadius: "22px",
    padding: "18px",
    boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
    border: "1px solid #d9f1e5",
    position: "sticky",
    top: "20px",
  },
  sidebarTitle: {
    fontSize: "14px",
    fontWeight: "800",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: "14px",
    padding: "4px 8px",
  },
  sidebarButton: {
    width: "100%",
    textAlign: "left",
    border: "none",
    background: "#f3fcf8",
    color: "#0f172a",
    padding: "14px 14px",
    borderRadius: "14px",
    marginBottom: "10px",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
  },
  sidebarButtonActive: {
    background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
    color: "#fff",
    boxShadow: "0 10px 24px rgba(22, 163, 74, 0.22)",
  },
  content: {
    minWidth: 0,
  },
  sectionStack: {
    display: "grid",
    gap: "20px",
  },
  targetRow: {
    maxWidth: "240px",
  },
  targetInput: {
    padding: "13px 14px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    fontSize: "15px",
    background: "#fff",
    width: "100%",
    boxSizing: "border-box",
  },
  card: {
    background: "#ffffff",
    borderRadius: "18px",
    padding: "24px",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
    border: "1px solid #d9f1e5",
  },
  cardTitle: {
    margin: "0 0 12px 0",
    fontSize: "22px",
    color: "#0f172a",
    fontWeight: "800",
  },
  assignmentList: {
    display: "grid",
    gap: "12px",
  },
  assignmentCard: {
    padding: "14px",
    border: "1px solid #dcfce7",
    background: "#f0fdf4",
    borderRadius: "12px",
  },
  assignmentPatient: {
    fontWeight: "700",
    color: "#14532d",
    marginBottom: "6px",
    fontSize: "17px",
  },
  assignmentMeta: {
    color: "#166534",
    fontSize: "14px",
    marginBottom: "4px",
  },
  emptyState: {
    padding: "18px",
    borderRadius: "12px",
    background: "#f8fafc",
    color: "#64748b",
    border: "1px dashed #cbd5e1",
  },
};