
import React, { useEffect, useState } from "react";
import api from "../api/api";

export default function DashboardLayout({
  title,
  subtitle,
  accent = "#2563eb",
  sidebarTitle = "Dashboard Menu",
  sidebarItems = [],
  activeSection,
  setActiveSection,
  onLogout,
  actingAs,
  actingAsName,
  onBackToAdmin,
  children,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordMessageType, setPasswordMessageType] =
    useState("error");

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 800px)");

    const updateScreenSize = () => {
      const mobile = mediaQuery.matches;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };

    updateScreenSize();

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", updateScreenSize);
      return () =>
        mediaQuery.removeEventListener("change", updateScreenSize);
    }

    mediaQuery.addListener(updateScreenSize);
    return () => mediaQuery.removeListener(updateScreenSize);
  }, []);

  const resetPasswordForm = () => {
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  const closeProfile = () => {
    if (passwordSaving) return;

    setProfileOpen(false);
    setPasswordMessage("");
    setPasswordMessageType("error");
    resetPasswordForm();
  };

  const openProfile = () => {
    if (actingAs) return;

    setPasswordMessage("");
    setPasswordMessageType("error");
    resetPasswordForm();
    setProfileOpen(true);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (passwordSaving) return;

    setPasswordMessage("");
    setPasswordMessageType("error");

    if (actingAs) {
      setPasswordMessage(
        "Return to your administrator account before changing your password."
      );
      return;
    }

    const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = passwordForm;

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage("Please complete all password fields.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMessage(
        "Your new password must contain at least 8 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage("The new passwords do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordMessage(
        "Your new password must be different from your current password."
      );
      return;
    }

    setPasswordSaving(true);

    try {
      const response = await api.post(
        "users/change-my-password/",
        {
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }
      );

      if (
        response.data?.success !== true &&
        response.data?.message == null
      ) {
        throw new Error(
          response.data?.error ||
            "The server did not confirm that the password was changed."
        );
      }

      setPasswordMessage(
        response.data?.message ||
          "Your password has been changed successfully."
      );
      setPasswordMessageType("success");
      resetPasswordForm();
    } catch (error) {
      let message = "Unable to change your password.";

      if (error.response) {
        const status = error.response.status;
        const serverMessage =
          error.response.data?.error ||
          error.response.data?.detail ||
          error.response.data?.message;

        if (serverMessage) {
          message = serverMessage;
        } else if (status === 404) {
          message =
            "The password-change endpoint was not found. Check users/api_urls.py and confirm that change_my_password_api is registered.";
        } else if (status === 401) {
          message =
            "Your session is not authenticated. Log in again and retry.";
        } else if (status === 403) {
          message =
            "Django rejected the request. Check the session, CSRF configuration, and backend permissions.";
        } else if (status >= 500) {
          message =
            "Django encountered a server error. Check the backend terminal for the traceback.";
        } else {
          message = `Django returned error ${status}.`;
        }
      } else if (error.request) {
        message =
          "No response from Django. Check the backend URL configured in src/api/api.js and confirm that the backend is running.";
      } else if (error.message) {
        message = error.message;
      }

      setPasswordMessage(message);
      setPasswordMessageType("error");
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleMenuClick = (key) => {
    if (typeof setActiveSection === "function") {
      setActiveSection(key);
    }

    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {actingAs && onBackToAdmin && (
          <div style={styles.banner}>
            <div style={styles.bannerText}>
              <span style={styles.bannerDot} />
              <span>
                Viewing as: {actingAsName || "Another user"}
              </span>
            </div>

            <button
              type="button"
              style={styles.bannerButton}
              onClick={onBackToAdmin}
            >
              Back to Admin
            </button>
          </div>
        )}

        <header style={styles.topBar}>
          <div style={styles.headingGroup}>
            <div
              style={{
                ...styles.titleAccent,
                background: accent,
              }}
            />

            <div style={styles.headingText}>
              <h1
                style={{
                  ...styles.title,
                  color: accent,
                }}
              >
                {title}
              </h1>

              {subtitle && (
                <p style={styles.subtitle}>{subtitle}</p>
              )}
            </div>
          </div>

          <div style={styles.topActions}>
            <button
              type="button"
              style={{
                ...styles.profileButton,
                ...(actingAs ? styles.disabledButton : {}),
              }}
              onClick={openProfile}
              disabled={Boolean(actingAs)}
              title={
                actingAs
                  ? "Return to your administrator account to change your password"
                  : "Open your profile"
              }
            >
              <span style={styles.profileIcon}>P</span>
              <span>Profile</span>
            </button>

            <button
              type="button"
              style={styles.logoutButton}
              onClick={onLogout}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#ffe4e6";
                e.currentTarget.style.borderColor = "#fda4af";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#fff1f2";
                e.currentTarget.style.borderColor = "#fecaca";
              }}
            >
              <span style={styles.logoutIcon} aria-hidden="true">
                ⏻
              </span>
              <span>Logout</span>
            </button>
          </div>
        </header>

        <div
          style={{
            ...styles.layout,
            gridTemplateColumns:
              sidebarOpen && !isMobile
                ? "260px minmax(0, 1fr)"
                : "minmax(0, 1fr)",
          }}
        >
          {sidebarOpen && (
            <aside
              id="dashboard-sidebar"
              style={styles.sidebar}
            >
              <div style={styles.sidebarHeader}>
                <div style={styles.sidebarHeaderIcon}>
                  ☷
                </div>

                <div style={styles.sidebarHeading}>
                  <div style={styles.sidebarTitle}>
                    {sidebarTitle}
                  </div>
                  <div style={styles.sidebarCaption}>
                    Navigate your workspace
                  </div>
                </div>

                <button
                  type="button"
                  style={styles.menuToggle}
                  onClick={() => setSidebarOpen(false)}
                  aria-label="Collapse sidebar menu"
                  title="Collapse menu"
                >
                  <span aria-hidden="true">‹</span>
                </button>
              </div>

              <nav
                style={styles.sidebarNav}
                aria-label={sidebarTitle}
              >
                {sidebarItems.map((item, index) => {
                  const isActive =
                    activeSection === item.key;

                  return (
                    <button
                      type="button"
                      key={item.key}
                      style={{
                        ...styles.sidebarButton,
                        ...(isActive
                          ? {
                              ...styles.sidebarButtonActive,
                              background: `linear-gradient(135deg, ${accent} 0%, ${accent} 100%)`,
                            }
                          : {}),
                      }}
                      onClick={() => handleMenuClick(item.key)}
                      aria-current={
                        isActive ? "page" : undefined
                      }
                    >
                      <span
                        style={{
                          ...styles.menuIcon,
                          ...(isActive
                            ? styles.menuIconActive
                            : {}),
                        }}
                        aria-hidden="true"
                      >
                        {item.icon ||
                          getMenuIcon(item.key, index)}
                      </span>

                      <span style={styles.menuLabel}>
                        {item.label}
                      </span>

                      {isActive && (
                        <span style={styles.activeIndicator} />
                      )}
                    </button>
                  );
                })}
              </nav>
            </aside>
          )}

          <main style={styles.content}>
            {!sidebarOpen && (
              <div style={styles.collapsedMenuRow}>
                <button
                  type="button"
                  style={styles.expandMenuButton}
                  onClick={() => setSidebarOpen(true)}
                  aria-controls="dashboard-sidebar"
                  aria-expanded={false}
                >
                  <span aria-hidden="true">☰</span>
                  <span>Open Menu</span>
                </button>
              </div>
            )}

            {children}
          </main>
        </div>
      </div>

      {profileOpen && (
        <div
          style={styles.modalOverlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeProfile();
            }
          }}
        >
          <div
            style={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-title"
          >
            <div style={styles.modalHeader}>
              <div>
                <div style={styles.profileAvatar}>P</div>

                <h2
                  id="profile-title"
                  style={styles.modalTitle}
                >
                  My Profile
                </h2>

                <p style={styles.modalSubtitle}>
                  Manage your account password.
                </p>
              </div>

              <button
                type="button"
                style={styles.closeButton}
                onClick={closeProfile}
                disabled={passwordSaving}
                aria-label="Close profile"
              >
                ×
              </button>
            </div>

            <div style={styles.profileInfo}>
              <span style={styles.infoLabel}>Account</span>

              <strong style={styles.infoValue}>
                {actingAsName || "Signed-in user"}
              </strong>
            </div>

            <form
              onSubmit={handlePasswordChange}
              style={styles.form}
            >
              <h3 style={styles.formTitle}>
                Change Password
              </h3>

              <label
                style={styles.fieldLabel}
                htmlFor="current-password"
              >
                Current Password
              </label>

              <input
                id="current-password"
                type="password"
                autoComplete="current-password"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    currentPassword: e.target.value,
                  }))
                }
                style={styles.input}
                placeholder="Enter current password"
                required
                disabled={passwordSaving}
              />

              <label
                style={styles.fieldLabel}
                htmlFor="new-password"
              >
                New Password
              </label>

              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    newPassword: e.target.value,
                  }))
                }
                style={styles.input}
                placeholder="Enter new password"
                minLength={8}
                required
                disabled={passwordSaving}
              />

              <label
                style={styles.fieldLabel}
                htmlFor="confirm-password"
              >
                Confirm New Password
              </label>

              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    confirmPassword: e.target.value,
                  }))
                }
                style={styles.input}
                placeholder="Re-enter new password"
                minLength={8}
                required
                disabled={passwordSaving}
              />

              <p style={styles.passwordHint}>
                Use a strong password. Your server may also check
                configured password-strength rules.
              </p>

              {passwordMessage && (
                <div
                  role="status"
                  aria-live="polite"
                  style={{
                    ...styles.passwordMessage,
                    ...(passwordMessageType === "success"
                      ? styles.successMessage
                      : styles.errorMessage),
                  }}
                >
                  {passwordMessage}
                </div>
              )}

              <div style={styles.formActions}>
                <button
                  type="button"
                  style={styles.cancelButton}
                  onClick={closeProfile}
                  disabled={passwordSaving}
                >
                  Close
                </button>

                <button
                  type="submit"
                  style={{
                    ...styles.saveButton,
                    ...(passwordSaving
                      ? styles.disabledButton
                      : {}),
                  }}
                  disabled={passwordSaving}
                >
                  {passwordSaving
                    ? "Updating..."
                    : "Change Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function getMenuIcon(key, index) {
  const icons = {
    home: "⌂",
    register: "＋",
    open_file: "▤",
    tracker: "☷",
    evaluation_tracker: "✓",
    stats: "▥",
    leaderboard: "★",
    users: "♙",
    settings: "⚙",
    approvals: "✓",
    patients: "♡",
    patient_files: "📁",
    patientFiles: "📁",
    reports: "▧",
  };

  return (
    icons[key] ||
    ["⌂", "＋", "▤", "☷", "✓", "▥", "★"][index % 7]
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #eef3f9 0%, #f8fbff 100%)",
    padding: "clamp(24px, 4vw, 56px)",
    fontFamily: "Arial, sans-serif",
    boxSizing: "border-box",
    color: "#0f172a",
  },

  container: {
    maxWidth: "1600px",
    width: "100%",
    margin: "0 auto",
    padding: "clamp(16px, 2.5vw, 30px)",
    boxSizing: "border-box",
    background: "rgba(255,255,255,0.55)",
    border: "1px solid rgba(226,232,240,0.8)",
    borderRadius: "26px",
    boxShadow: "0 16px 45px rgba(15,23,42,0.045)",
  },

  banner: {
    background: "#fffbeb",
    border: "1px solid #fcd34d",
    color: "#92400e",
    padding: "12px 16px",
    borderRadius: "14px",
    marginBottom: "22px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },

  bannerText: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    fontWeight: "700",
    fontSize: "14px",
  },

  bannerDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#d97706",
    display: "inline-block",
  },

  bannerButton: {
    background: "#92400e",
    color: "#fff",
    border: "none",
    borderRadius: "9px",
    padding: "9px 13px",
    cursor: "pointer",
    fontWeight: "700",
  },

  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "18px",
    marginBottom: "26px",
  },

  headingGroup: {
    display: "flex",
    alignItems: "stretch",
    gap: "14px",
    minWidth: 0,
    flex: "1 1 260px",
  },

  titleAccent: {
    width: "5px",
    minHeight: "48px",
    borderRadius: "10px",
    flexShrink: 0,
  },

  headingText: {
    minWidth: 0,
  },

  title: {
    margin: 0,
    fontSize: "clamp(25px, 3vw, 34px)",
    fontWeight: "800",
    letterSpacing: "-0.035em",
    overflowWrap: "anywhere",
  },

  subtitle: {
    margin: "8px 0 0",
    color: "#64748b",
    fontSize: "15px",
    lineHeight: 1.55,
  },

  topActions: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    flexWrap: "wrap",
  },

  profileButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    background: "#ffffff",
    color: "#1d4ed8",
    border: "1px solid #bfdbfe",
    borderRadius: "12px",
    padding: "10px 14px",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
  },

  profileIcon: {
    width: "25px",
    height: "25px",
    borderRadius: "50%",
    background: "#dbeafe",
    color: "#1d4ed8",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "800",
    fontSize: "12px",
  },

  logoutButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    background: "#fff1f2",
    color: "#be123c",
    border: "1px solid #fecaca",
    borderRadius: "12px",
    padding: "10px 16px",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "background 0.2s ease, border-color 0.2s ease",
  },

  logoutIcon: {
    fontSize: "19px",
    lineHeight: 1,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },

  layout: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr)",
    alignItems: "start",
    gap: "22px",
    minWidth: 0,
  },

  sidebar: {
    background: "#ffffff",
    borderRadius: "20px",
    padding: "16px",
    boxShadow: "0 12px 30px rgba(15,23,42,0.07)",
    border: "1px solid #e8eef7",
    position: "sticky",
    top: "18px",
    minWidth: 0,
    boxSizing: "border-box",
  },

  sidebarHeader: {
    display: "flex",
    alignItems: "center",
    gap: "11px",
    padding: "6px 5px 17px",
    marginBottom: "10px",
    borderBottom: "1px solid #edf2f7",
  },

  sidebarHeaderIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "12px",
    background: "#eff6ff",
    color: "#2563eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "23px",
    fontWeight: "700",
    flexShrink: 0,
  },

  sidebarHeading: {
    flex: 1,
    minWidth: 0,
  },

  sidebarTitle: {
    fontSize: "13px",
    fontWeight: "800",
    color: "#334155",
    textTransform: "uppercase",
    letterSpacing: "0.045em",
    lineHeight: 1.4,
    overflowWrap: "anywhere",
  },

  sidebarCaption: {
    marginTop: "4px",
    color: "#94a3b8",
    fontSize: "11px",
    lineHeight: 1.4,
  },

  menuToggle: {
    width: "32px",
    height: "32px",
    border: "1px solid #dbe5f0",
    borderRadius: "9px",
    background: "#f8fafc",
    color: "#475569",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "26px",
    lineHeight: 1,
    cursor: "pointer",
    flexShrink: 0,
  },

  sidebarNav: {
    display: "grid",
    gap: "7px",
  },

  sidebarButton: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: "11px",
    position: "relative",
    boxSizing: "border-box",
    textAlign: "left",
    border: "1px solid transparent",
    background: "#f8fafc",
    color: "#334155",
    padding: "12px",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "background 150ms ease, box-shadow 150ms ease",
  },

  sidebarButtonActive: {
    color: "#fff",
    border: "1px solid transparent",
    boxShadow: "0 7px 16px rgba(37,99,235,0.2)",
  },

  menuIcon: {
    width: "31px",
    height: "31px",
    borderRadius: "9px",
    background: "#eaf0f8",
    color: "#475569",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    flexShrink: 0,
  },

  menuIconActive: {
    background: "rgba(255,255,255,0.2)",
    color: "#ffffff",
  },

  menuLabel: {
    flex: 1,
    minWidth: 0,
    overflowWrap: "anywhere",
    lineHeight: 1.4,
  },

  activeIndicator: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#ffffff",
    flexShrink: 0,
  },

  content: {
    minWidth: 0,
    display: "grid",
    gap: "20px",
    alignContent: "start",
  },

  collapsedMenuRow: {
    display: "flex",
    justifyContent: "flex-start",
    marginBottom: "2px",
  },

  expandMenuButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    background: "#ffffff",
    color: "#334155",
    border: "1px solid #dbe5f0",
    borderRadius: "11px",
    padding: "10px 14px",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 3px 10px rgba(15,23,42,0.04)",
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 1000,
    background: "rgba(15,23,42,0.58)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "16px",
    overflowY: "auto",
    boxSizing: "border-box",
    backdropFilter: "blur(3px)",
  },

  modal: {
    width: "100%",
    maxWidth: "480px",
    maxHeight: "calc(100vh - 32px)",
    overflowY: "auto",
    background: "#ffffff",
    borderRadius: "22px",
    padding: "clamp(20px, 5vw, 28px)",
    boxShadow: "0 24px 70px rgba(15,23,42,0.25)",
    boxSizing: "border-box",
  },

  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "22px",
  },

  profileAvatar: {
    width: "48px",
    height: "48px",
    borderRadius: "16px",
    background: "#dbeafe",
    color: "#1d4ed8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "800",
    fontSize: "20px",
    marginBottom: "14px",
  },

  modalTitle: {
    margin: 0,
    fontSize: "25px",
    fontWeight: "800",
    color: "#0f172a",
  },

  modalSubtitle: {
    margin: "8px 0 0",
    fontSize: "14px",
    lineHeight: 1.6,
    color: "#64748b",
  },

  closeButton: {
    border: "none",
    background: "#f1f5f9",
    color: "#475569",
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    fontSize: "25px",
    cursor: "pointer",
    flexShrink: 0,
  },

  profileInfo: {
    display: "grid",
    gap: "6px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "14px",
    marginBottom: "24px",
  },

  infoLabel: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },

  infoValue: {
    fontSize: "15px",
    color: "#0f172a",
    overflowWrap: "anywhere",
  },

  form: {
    display: "grid",
    gap: "10px",
  },

  formTitle: {
    margin: "0 0 8px",
    fontSize: "18px",
    color: "#0f172a",
  },

  fieldLabel: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#334155",
    marginTop: "6px",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    padding: "12px 13px",
    fontSize: "14px",
    outline: "none",
    background: "#ffffff",
    color: "#0f172a",
  },

  passwordHint: {
    margin: "2px 0 8px",
    color: "#64748b",
    fontSize: "12px",
    lineHeight: 1.6,
  },

  passwordMessage: {
    borderRadius: "10px",
    padding: "12px",
    fontSize: "13px",
    lineHeight: 1.6,
    overflowWrap: "anywhere",
  },

  successMessage: {
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    color: "#166534",
  },

  errorMessage: {
    background: "#fff7ed",
    border: "1px solid #fed7aa",
    color: "#9a3412",
  },

  formActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    flexWrap: "wrap",
    marginTop: "12px",
  },

  cancelButton: {
    background: "#f1f5f9",
    color: "#334155",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "11px 15px",
    fontWeight: "700",
    cursor: "pointer",
  },

  saveButton: {
    background: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "10px",
    padding: "11px 15px",
    fontWeight: "700",
    cursor: "pointer",
  },

  disabledButton: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
};
