import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import PatientSearch from "../components/PatientSearch";
import AssignmentHistory from "../components/AssignmentHistory";

export default function PhysioDashboard({
  user,
  onLogout,
  actingAs,
  onStopImpersonation,
}) {
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];

  const [activeSection, setActiveSection] = useState("search");
  const [todayAssignments, setTodayAssignments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(today.slice(0, 7));

  const handleBackToAdmin = () => {
    onStopImpersonation();
    navigate("/admin");
  };

  const loadTodayAssignments = async () => {
    try {
      const res = await api.get(
        `reception/assignments/?start_date=${today}&end_date=${today}`
      );
      setTodayAssignments(res.data.assignments || []);
    } catch (err) {
      console.error("Failed to load today's assignments", err);
    }
  };

  const loadPatients = async () => {
    try {
      const res = await api.get("patients/");
      setPatients(res.data.patients || []);
    } catch (err) {
      console.error("Failed to load patients", err);
    }
  };

  useEffect(() => {
    loadTodayAssignments();
    loadPatients();
  }, []);

  const monthlyPatients = useMemo(() => {
    return patients.filter((item) => {
      if (!item.created_at) return true;
      return String(item.created_at).startsWith(selectedMonth);
    });
  }, [patients, selectedMonth]);

  const sidebarItems = [
    { key: "search", label: "Search Patient" },
    { key: "today", label: "Today's Assignments" },
    { key: "history", label: "History" },
    { key: "tracker", label: "Patient Tracker" },
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

          <button style={styles.logoutButton} onClick={onLogout}>
            Logout
          </button>
        </div>

        <div style={styles.layout}>
          <aside style={styles.sidebar}>
            <div style={styles.sidebarTitle}>Physio Menu</div>

            {sidebarItems.map((item) => (
              <button
                key={item.key}
                style={{
                  ...styles.sidebarButton,
                  ...(activeSection === item.key ? styles.sidebarButtonActive : {}),
                }}
                onClick={() => setActiveSection(item.key)}
              >
                {item.label}
              </button>
            ))}
          </aside>

          <main style={styles.content}>
            {activeSection === "search" && <PatientSearch />}

            {activeSection === "today" && (
              <div style={styles.card}>
                <h2 style={styles.cardTitle}>Today's Assignments</h2>

                {todayAssignments.length > 0 ? (
                  <div style={styles.assignmentList}>
                    {todayAssignments.map((item) => (
                      <div key={item.id} style={styles.assignmentCard}>
                        <div>
                          <div style={styles.assignmentPatient}>
                            {item.patient_name}
                          </div>
                          <div style={styles.assignmentMeta}>
                            Patient ID: {item.patient_file_id}
                          </div>
                        </div>

                        <div>
                          <div style={styles.assignmentTherapist}>
                            Therapist: {item.therapist_name}
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
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={styles.emptyState}>
                    No assignments for today.
                  </div>
                )}
              </div>
            )}

            {activeSection === "history" && (
              <AssignmentHistory
                title="Physio Assignment History"
                currentUser={user}
              />
            )}

            {activeSection === "tracker" && (
              <div style={styles.card}>
                <div style={styles.trackerHeader}>
                  <h2 style={styles.cardTitle}>Patient Tracker</h2>

                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    style={styles.monthInput}
                  />
                </div>

                <div style={styles.tableWrap}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Patient Name</th>
                        <th style={styles.th}>Patient ID</th>
                        <th style={styles.th}>Approved Sessions</th>
                        <th style={styles.th}>Utilized Sessions</th>
                        <th style={styles.th}>Number of Evaluations</th>
                        <th style={styles.th}>Booking</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyPatients.length > 0 ? (
                        monthlyPatients.map((patient) => (
                          <tr key={patient.id}>
                            <td style={styles.td}>{patient.name}</td>
                            <td style={styles.td}>{patient.patient_id}</td>
                            <td style={styles.td}>
                              {patient.approved_sessions ?? 0}
                            </td>
                            <td style={styles.td}>
                              {patient.utilized_sessions ?? 0}
                            </td>
                            <td style={styles.td}>
                              {patient.number_of_evaluations ?? 0}
                            </td>
                            <td style={styles.td}>{patient.booking || "-"}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td style={styles.emptyTable} colSpan="6">
                            No patient tracker data for this month.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
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
    gridTemplateColumns: "280px 1fr",
    gap: "22px",
    alignItems: "start",
  },
  sidebar: {
    background: "#ffffff",
    borderRadius: "22px",
    padding: "18px",
    boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
    border: "1px solid #e8eef7",
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
    background: "#f3faf6",
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
  card: {
    background: "#fff",
    borderRadius: "22px",
    boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
    border: "1px solid #e8eef7",
    padding: "24px",
  },
  cardTitle: {
    margin: "0 0 18px 0",
    fontSize: "28px",
    fontWeight: "800",
    color: "#0f172a",
  },
  assignmentList: {
    display: "grid",
    gap: "12px",
  },
  assignmentCard: {
    border: "1px solid #dcfce7",
    background: "#f0fdf4",
    borderRadius: "14px",
    padding: "16px",
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    flexWrap: "wrap",
  },
  assignmentPatient: {
    fontWeight: "800",
    color: "#14532d",
    marginBottom: "6px",
    fontSize: "17px",
  },
  assignmentTherapist: {
    fontWeight: "800",
    color: "#166534",
    marginBottom: "6px",
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
    fontWeight: "600",
  },
  trackerHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
    marginBottom: "18px",
  },
  monthInput: {
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    fontSize: "15px",
  },
  tableWrap: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "850px",
  },
  th: {
    textAlign: "left",
    background: "#f0fdf4",
    color: "#166534",
    fontWeight: "800",
    fontSize: "14px",
    padding: "14px",
    borderBottom: "1px solid #d1fae5",
  },
  td: {
    padding: "14px",
    borderBottom: "1px solid #ecfdf5",
    color: "#0f172a",
    fontSize: "14px",
  },
  emptyTable: {
    padding: "18px",
    textAlign: "center",
    color: "#64748b",
    fontWeight: "600",
  },
};