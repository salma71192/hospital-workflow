
import React, { useState } from "react";
import AdminSidebar from "./admin/AdminSidebar";
import "./DashboardLayout.css";

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
  useAdminSidebar = false,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const toggleSidebar = () => {
    setSidebarOpen((previous) => !previous);
  };

  const handleSectionSelect = (sectionKey) => {
    if (typeof setActiveSection === "function") {
      setActiveSection(sectionKey);
    }
  };

  const openProfile = () => {
    setPasswordMessage("");
    setPasswordError("");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setProfileOpen(true);
  };

  const closeProfile = () => {
    if (passwordLoading) return;

    setProfileOpen(false);
    setPasswordMessage("");
    setPasswordError("");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();

    setPasswordMessage("");
    setPasswordError("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Please complete all password fields.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError(
        "Your new password must contain at least 8 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("The new passwords do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError(
        "Your new password must differ from your current password."
      );
      return;
    }

    setPasswordLoading(true);

    try {
      // Use the existing backend authentication token.
      const tokenKeys = [
        "token",
        "authToken",
        "auth_token",
        "access_token",
      ];

      let token = null;

      for (const key of tokenKeys) {
        token =
          sessionStorage.getItem(key) ||
          localStorage.getItem(key);

        if (token) break;
      }

      const response = await fetch(
        "/api/users/change-my-password/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token
              ? { Authorization: `Token ${token}` }
              : {}),
          },
          credentials: "same-origin",
          body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword,
            confirm_password: confirmPassword,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const detail =
          data.error ||
          data.detail ||
          data.message ||
          (typeof data === "object"
            ? Object.values(data).flat().join(" ")
            : "");

        throw new Error(
          detail || `Password change failed (${response.status}).`
        );
      }

      setPasswordMessage(
        data.message || "Your password has been changed successfully."
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setPasswordError(
        error.message ||
          "Unable to change your password. Please try again."
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  const renderStandardItem = (item) => {
    const isActive = activeSection === item.key;

    if (Array.isArray(item.children) && item.children.length > 0) {
      return (
        <StandardSidebarGroup
          key={item.key}
          item={item}
          activeSection={activeSection}
          onSelect={handleSectionSelect}
        />
      );
    }

    return (
      <button
        key={item.key}
        type="button"
        className={`dashboard-layout__sidebar-button ${
          isActive ? "dashboard-layout__sidebar-button--active" : ""
        }`}
        onClick={() => handleSectionSelect(item.key)}
        aria-current={isActive ? "page" : undefined}
      >
        {item.label}
      </button>
    );
  };

  return (
    <div className="dashboard-layout">
      <div className="dashboard-layout__container">
        {actingAs && onBackToAdmin && (
          <div className="dashboard-layout__acting-banner">
            <span>Viewing as: {actingAsName}</span>

            <button
              type="button"
              className="dashboard-layout__back-button"
              onClick={onBackToAdmin}
            >
              Back to Admin
            </button>
          </div>
        )}

        <header className="dashboard-layout__header">
          <div className="dashboard-layout__heading">
            <h1
              className="dashboard-layout__title"
              style={{ "--dashboard-accent": accent }}
            >
              {title}
            </h1>

            {subtitle && (
              <p className="dashboard-layout__subtitle">
                {subtitle}
              </p>
            )}
          </div>

          <div className="dashboard-layout__actions">
            <button
              type="button"
              className="dashboard-layout__profile-button"
              onClick={openProfile}
              aria-haspopup="dialog"
              aria-expanded={profileOpen}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
              </svg>
              <span>Profile</span>
            </button>

            {onLogout && (
              <button
                type="button"
                className="dashboard-layout__logout-button"
                onClick={onLogout}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M10 17l5-5-5-5" />
                  <path d="M15 12H3" />
                  <path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
                </svg>
                <span>Logout</span>
              </button>
            )}
          </div>
        </header>

        <div
          className={`dashboard-layout__body ${
            sidebarOpen
              ? "dashboard-layout__body--sidebar-open"
              : "dashboard-layout__body--sidebar-closed"
          }`}
        >
          <aside
            className={`dashboard-layout__menu-shell ${
              sidebarOpen
                ? "dashboard-layout__menu-shell--open"
                : "dashboard-layout__menu-shell--closed"
            }`}
          >
            <div className="dashboard-layout__menu-toolbar">
              {sidebarOpen && (
                <span className="dashboard-layout__menu-toolbar-title">
                  {sidebarTitle}
                </span>
              )}

              <button
                type="button"
                className="dashboard-layout__menu-toggle"
                onClick={toggleSidebar}
                aria-label={
                  sidebarOpen ? "Collapse menu" : "Expand menu"
                }
                aria-expanded={sidebarOpen}
                title={
                  sidebarOpen ? "Collapse menu" : "Expand menu"
                }
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <path d="M9 4v16" />
                  {sidebarOpen ? (
                    <path d="m15 9-3 3 3 3" />
                  ) : (
                    <path d="m13 9 3 3-3 3" />
                  )}
                </svg>
              </button>
            </div>

            {sidebarOpen &&
              (useAdminSidebar ? (
                <AdminSidebar
                  sidebarTitle={sidebarTitle}
                  sidebarItems={sidebarItems}
                  activeSection={activeSection}
                  onSelect={handleSectionSelect}
                />
              ) : (
                <div className="dashboard-layout__standard-sidebar">
                  <nav aria-label="Dashboard navigation">
                    {sidebarItems.map(renderStandardItem)}
                  </nav>
                </div>
              ))}
          </aside>

          <main className="dashboard-layout__content">
            {children}
          </main>
        </div>
      </div>

      {profileOpen && (
        <div
          className="dashboard-layout__modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeProfile();
            }
          }}
        >
          <section
            className="dashboard-layout__modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-modal-title"
          >
            <div className="dashboard-layout__modal-header">
              <div>
                <h2
                  id="profile-modal-title"
                  className="dashboard-layout__modal-title"
                >
                  My Profile
                </h2>

                <p className="dashboard-layout__modal-description">
                  Change your own account password.
                </p>
              </div>

              <button
                type="button"
                className="dashboard-layout__modal-close"
                onClick={closeProfile}
                disabled={passwordLoading}
                aria-label="Close profile"
              >
                &times;
              </button>
            </div>

            <form
              className="dashboard-layout__password-form"
              onSubmit={handlePasswordChange}
            >
              <div className="dashboard-layout__form-field">
                <label htmlFor="profile-current-password">
                  Current password
                </label>
                <input
                  id="profile-current-password"
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(event) =>
                    setCurrentPassword(event.target.value)
                  }
                  required
                />
              </div>

              <div className="dashboard-layout__form-field">
                <label htmlFor="profile-new-password">
                  New password
                </label>
                <input
                  id="profile-new-password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={newPassword}
                  onChange={(event) =>
                    setNewPassword(event.target.value)
                  }
                  required
                />
                <small>Use at least 8 characters.</small>
              </div>

              <div className="dashboard-layout__form-field">
                <label htmlFor="profile-confirm-password">
                  Confirm new password
                </label>
                <input
                  id="profile-confirm-password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  required
                />
              </div>

              {passwordError && (
                <div
                  className="dashboard-layout__password-message dashboard-layout__password-message--error"
                  role="alert"
                >
                  {passwordError}
                </div>
              )}

              {passwordMessage && (
                <div
                  className="dashboard-layout__password-message dashboard-layout__password-message--success"
                  role="status"
                >
                  {passwordMessage}
                </div>
              )}

              <div className="dashboard-layout__modal-actions">
                <button
                  type="button"
                  className="dashboard-layout__cancel-button"
                  onClick={closeProfile}
                  disabled={passwordLoading}
                >
                  Close
                </button>

                <button
                  type="submit"
                  className="dashboard-layout__save-button"
                  disabled={passwordLoading}
                >
                  {passwordLoading
                    ? "Changing..."
                    : "Change Password"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

function StandardSidebarGroup({
  item,
  activeSection,
  onSelect,
}) {
  const hasActiveChild = item.children.some(
    (child) =>
      child.key === activeSection ||
      child.children?.some(
        (nested) => nested.key === activeSection
      )
  );

  const [isOpen, setIsOpen] = useState(
    Boolean(item.defaultOpen || hasActiveChild)
  );

  React.useEffect(() => {
    if (hasActiveChild) {
      setIsOpen(true);
    }
  }, [hasActiveChild]);

  return (
    <div className="dashboard-layout__sidebar-group">
      <button
        type="button"
        className={`dashboard-layout__sidebar-button ${
          hasActiveChild
            ? "dashboard-layout__sidebar-button--active"
            : ""
        }`}
        onClick={() => setIsOpen((previous) => !previous)}
        aria-expanded={isOpen}
      >
        <span>{item.label}</span>
        <span aria-hidden="true">
          {isOpen ? "−" : "+"}
        </span>
      </button>

      {isOpen && (
        <div className="dashboard-layout__sidebar-submenu">
          {item.children.map((child) => {
            const isActive = activeSection === child.key;

            return (
              <button
                key={child.key}
                type="button"
                className={`dashboard-layout__sidebar-button ${
                  isActive
                    ? "dashboard-layout__sidebar-button--active"
                    : ""
                }`}
                onClick={() => onSelect(child.key)}
                aria-current={isActive ? "page" : undefined}
              >
                {child.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
