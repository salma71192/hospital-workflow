
import React, { useState } from "react";
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

    const currentPassword = passwordForm.currentPassword;
    const newPassword = passwordForm.newPassword;
    const confirmPassword = passwordForm.confirmPassword;

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
      // Reuse the same API client as the Admin dashboard.
      // This endpoint must change the password of the logged-in user only.
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

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {actingAs && onBackToAdmin && (
          <div style={styles.banner}>
            <span>
              Viewing as: {actingAsName || "Another user"}
            </span>

            <button
              type="button"
              style={styles.bannerButton}
              onClick={onBackToAdmin}
            >
              Back to Admin
            </button>
          </div>
        )}

        <div style={styles.topBar}>
          <div>
            <h1 style={{ ...styles.title, color: accent }}>
              {title}
            </h1>
            <p style={styles.subtitle}>{subtitle}</p>
          </div>

          <div style={styles.topActions}>
            <button
              type="button"
              style={styles.sidebarToggle}
              onClick={() => setSidebarOpen((prev) => !prev)}
            >
              {sidebarOpen ? "Hide Menu" : "Show Menu"}
            </button>

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
              Profile
            </button>

            <button
              type="button"
              style={styles.logoutButton}
              onClick={onLogout}
            >
              Logout
            </button>
          </div>
        </div>

        <div
          style={{
            ...styles.layout,
            gridTemplateColumns: sidebarOpen
              ? "280px 1fr"
              : "1fr",
          }}
        >
          {sidebarOpen && (
            <aside style={styles.sidebar}>
              <div style={styles.sidebarTitle}>
                {sidebarTitle}
              </div>

              {sidebarItems.map((item) => (
                <button
                  type="button"
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

          <main style={styles.content}>{children}</main>
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

                <h2 id="profile-title" style={styles.modalTitle}>
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
              <h3 style={styles.formTitle}>Change Password</h3>

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

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f4f7fb 0%, #fbfdff 100%)",
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
    gap: "12px",
    flexWrap: "wrap",
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
  },
  subtitle: {
    margin: "8px 0 0 0",
    color: "#64748b",
    fontSize: "16px",
  },
  topActions: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    flexWrap: "wrap",
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
  profileButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "#ffffff",
    color: "#1d4ed8",
    border: "1px solid #bfdbfe",
    borderRadius: "12px",
    padding: "11px 16px",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
  },
  profileIcon: {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    background: "#dbeafe",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "800",
    fontSize: "12px",
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
    background: "#f8fbff",
    color: "#0f172a",
    padding: "14px",
    borderRadius: "14px",
    marginBottom: "10px",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
  },
  sidebarButtonActive: {
    background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
    color: "#fff",
    boxShadow: "0 10px 24px rgba(37, 99, 235, 0.22)",
  },
  content: {
    minWidth: 0,
    display: "grid",
    gap: "20px",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 1000,
    background: "rgba(15, 23, 42, 0.55)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
    overflowY: "auto",
  },
  modal: {
    width: "100%",
    maxWidth: "480px",
    maxHeight: "calc(100vh - 40px)",
    overflowY: "auto",
    background: "#ffffff",
    borderRadius: "22px",
    padding: "28px",
    boxShadow: "0 24px 70px rgba(15, 23, 42, 0.25)",
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
