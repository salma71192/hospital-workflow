import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("users/login/", {
        username: username.trim(),
        password,
      });
      const userData = res.data;
      onLogin(userData);
      // Role-based navigation
      const role = userData.role;
      if (userData.is_superuser || role === "admin") {
        navigate("/admin");
      } else if (role === "approvals") {
        navigate("/approvals");
      } else if (role === "reception") {
        navigate("/reception");
      } else if (role === "reception_supervisor") {
        navigate("/reception-supervisor");
      } else if (role === "physio") {
        navigate("/physio");
      } else if (role === "doctor") {
        navigate("/doctor");
      } else if (role === "rcm") {
        navigate("/rcm");
      } else if (role === "callcenter") {
        navigate("/callcenter");
      } else if (role === "callcenter_supervisor") {
        navigate("/callcenter-supervisor");
      } else if (role === "visitor") {
        navigate("/visitors");
      } else if (role === "visitor_ceo") {
        navigate("/visitor-ceo");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.detail ||
          "Invalid username or password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <div style={styles.page}>
      <div style={styles.backgroundGlowBlue} />
      <div style={styles.backgroundGlowTeal} />
      <div style={styles.layout}>
        {/* Welcome panel */}
        <section style={styles.welcomePanel}>
          <div style={styles.brand}>
            <div style={styles.brandIcon}>
              <span aria-hidden="true">✚</span>
            </div>
            <div>
              <div style={styles.brandName}>Hospital Workflow</div>
              <div style={styles.brandCaption}>
                Healthcare Management System
              </div>
            </div>
          </div>
          <div style={styles.welcomeContent}>
            <div style={styles.eyebrow}>
              <span style={styles.statusDot} />
              YOUR WORKSPACE, SIMPLIFIED
            </div>
            <h1 style={styles.welcomeTitle}>
              Better coordination.
              <br />
              <span style={styles.highlightText}>
                Better patient care.
              </span>
            </h1>
            <p style={styles.welcomeDescription}>
              One organized workspace for your hospital team.
              Access your role-specific tools and keep daily
              workflows moving smoothly.
            </p>
            <div style={styles.featureList}>
              <div style={styles.feature}>
                <div style={styles.featureIcon}>🩺</div>
                <div>
                  <div style={styles.featureTitle}>
                    Patient-centered workflow
                  </div>
                  <div style={styles.featureDescription}>
                    Keep patient tasks organized and accessible.
                  </div>
                </div>
              </div>
              <div style={styles.feature}>
                <div style={styles.featureIcon}>🤝</div>
                <div>
                  <div style={styles.featureTitle}>
                    Connected teams
                  </div>
                  <div style={styles.featureDescription}>
                    Support coordination across hospital departments.
                  </div>
                </div>
              </div>
              <div style={styles.feature}>
                <div style={styles.featureIcon}>🔐</div>
                <div>
                  <div style={styles.featureTitle}>
                    Role-based access
                  </div>
                  <div style={styles.featureDescription}>
                    Access the workspace assigned to your role.
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div style={styles.welcomeFooter}>
            <span>💙</span>
            <span>Every detail matters in patient care.</span>
          </div>
        </section>
        {/* Login panel */}
        <section style={styles.loginPanel}>
          <div style={styles.loginCard}>
            <div style={styles.mobileBrandIcon}>✚</div>
            <div style={styles.loginHeading}>
              <div style={styles.loginEyebrow}>
                SECURE SIGN IN
              </div>
              <h2 style={styles.loginTitle}>Welcome back 👋</h2>
              <p style={styles.loginSubtitle}>
                Enter your credentials to access your workspace.
              </p>
            </div>
            <form onSubmit={handleLogin} style={styles.form}>
              <div style={styles.fieldGroup}>
                <label htmlFor="login-username" style={styles.label}>
                  Username
                </label>
                <div style={styles.inputWrapper}>
                  <span style={styles.inputIcon} aria-hidden="true">
                    👤
                  </span>
                  <input
                    id="login-username"
                    name="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (error) setError("");
                    }}
                    style={styles.input}
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              <div style={styles.fieldGroup}>
                <label htmlFor="login-password" style={styles.label}>
                  Password
                </label>
                <div style={styles.inputWrapper}>
                  <span style={styles.inputIcon} aria-hidden="true">
                    🔒
                  </span>
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError("");
                    }}
                    style={styles.passwordInput}
                    autoComplete="current-password"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    style={styles.passwordToggle}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    title={showPassword ? "Hide password" : "Show password"}
                    disabled={loading}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
              {error && (
                <div style={styles.error} role="alert">
                  <span style={styles.errorIcon}>!</span>
                  <span>{error}</span>
                </div>
              )}
              <button
                type="submit"
                style={{
                  ...styles.button,
                  ...(loading ? styles.buttonLoading : {}),
                }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span style={styles.spinner} />
                    Signing in...
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <span style={styles.buttonArrow}>→</span>
                  </>
                )}
              </button>
            </form>
            <div style={styles.securityNote}>
              <span aria-hidden="true">🛡️</span>
              <span>
                Secure access for authorized hospital personnel.
              </span>
            </div>
            <div style={styles.loginDivider} />
            <div style={styles.helpText}>
              Need access assistance? Please contact your system
              administrator.
            </div>
          </div>
          <div style={styles.copyright}>
            Hospital Workflow System
            <span style={styles.copyrightDot}>•</span>
            Authorized Access Only
          </div>
        </section>
      </div>
    </div>
  );
}
const styles = {
  page: {
    minHeight: "100vh",
    position: "relative",
    overflow: "hidden",
    background: "#f4f7fb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "32px 24px",
    boxSizing: "border-box",
    fontFamily:
      'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  backgroundGlowBlue: {
    position: "absolute",
    width: "420px",
    height: "420px",
    top: "-180px",
    left: "-130px",
    borderRadius: "50%",
    background: "rgba(37, 99, 235, 0.09)",
    filter: "blur(80px)",
    pointerEvents: "none",
  },
  backgroundGlowTeal: {
    position: "absolute",
    width: "440px",
    height: "440px",
    bottom: "-220px",
    right: "-120px",
    borderRadius: "50%",
    background: "rgba(13, 148, 136, 0.09)",
    filter: "blur(85px)",
    pointerEvents: "none",
  },
  layout: {
    position: "relative",
    zIndex: 1,
    width: "100%",
    maxWidth: "1120px",
    minHeight: "650px",
    display: "grid",
    gridTemplateColumns: "1fr 0.9fr",
    background: "#ffffff",
    border: "1px solid rgba(226, 232, 240, 0.9)",
    borderRadius: "30px",
    overflow: "hidden",
    boxShadow: "0 28px 80px rgba(15, 23, 42, 0.10)",
  },
  welcomePanel: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    gap: "36px",
    padding: "42px 42px 30px",
    boxSizing: "border-box",
    background:
      "linear-gradient(145deg, #0f2e52 0%, #17466d 55%, #126a78 100%)",
    color: "#ffffff",
    overflow: "hidden",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "13px",
    position: "relative",
    zIndex: 1,
  },
  brandIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "15px",
    background: "rgba(255, 255, 255, 0.14)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "30px",
    fontWeight: "800",
    color: "#99f6e4",
    flexShrink: 0,
  },
  brandName: {
    fontSize: "17px",
    fontWeight: "800",
    letterSpacing: "-0.3px",
  },
  brandCaption: {
    marginTop: "4px",
    color: "#cbdde9",
    fontSize: "11px",
    fontWeight: "500",
    letterSpacing: "0.2px",
  },
  welcomeContent: {
    position: "relative",
    zIndex: 1,
    display: "grid",
    gap: "22px",
  },
  eyebrow: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    color: "#99f6e4",
    fontSize: "10px",
    fontWeight: "800",
    letterSpacing: "1.5px",
  },
  statusDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "#5eead4",
    boxShadow: "0 0 12px rgba(94, 234, 212, 0.7)",
    flexShrink: 0,
  },
  welcomeTitle: {
    margin: 0,
    fontSize: "clamp(30px, 3.5vw, 43px)",
    lineHeight: 1.2,
    letterSpacing: "-1.5px",
    fontWeight: "800",
    color: "#ffffff",
  },
  highlightText: {
    color: "#7ee7dc",
  },
  welcomeDescription: {
    margin: 0,
    maxWidth: "420px",
    color: "#d5e4ef",
    fontSize: "14px",
    lineHeight: 1.9,
    fontWeight: "400",
  },
  featureList: {
    display: "grid",
    gap: "21px",
    marginTop: "8px",
  },
  feature: {
    display: "flex",
    alignItems: "flex-start",
    gap: "14px",
  },
  featureIcon: {
    width: "42px",
    height: "42px",
    borderRadius: "13px",
    background: "rgba(255, 255, 255, 0.11)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "19px",
    flexShrink: 0,
  },
  featureTitle: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: "5px",
  },
  featureDescription: {
    fontSize: "12px",
    lineHeight: 1.7,
    color: "#c6dbe8",
  },
  welcomeFooter: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    alignItems: "center",
    gap: "9px",
    paddingTop: "18px",
    borderTop: "1px solid rgba(255, 255, 255, 0.17)",
    color: "#d5e4ef",
    fontSize: "12px",
    fontWeight: "500",
  },
  loginPanel: {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: "28px",
    padding: "48px 40px 30px",
    boxSizing: "border-box",
    background: "#ffffff",
  },
  loginCard: {
    width: "100%",
    maxWidth: "370px",
    display: "grid",
    gap: "30px",
  },
  mobileBrandIcon: {
    display: "none",
  },
  loginHeading: {
    display: "grid",
    gap: "10px",
  },
  loginEyebrow: {
    color: "#0d9488",
    fontSize: "10px",
    fontWeight: "800",
    letterSpacing: "1.5px",
  },
  loginTitle: {
    margin: 0,
    color: "#0f172a",
    fontSize: "30px",
    lineHeight: 1.25,
    fontWeight: "800",
    letterSpacing: "-0.8px",
  },
  loginSubtitle: {
    margin: 0,
    color: "#64748b",
    fontSize: "13px",
    lineHeight: 1.8,
  },
  form: {
    display: "grid",
    gap: "21px",
  },
  fieldGroup: {
    display: "grid",
    gap: "9px",
  },
  label: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#334155",
  },
  inputWrapper: {
    width: "100%",
    minWidth: 0,
    minHeight: "51px",
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    gap: "11px",
    padding: "0 14px",
    background: "#f8fafc",
    border: "1px solid #dbe3ed",
    borderRadius: "12px",
    transition: "border-color 0.2s ease",
  },
  inputIcon: {
    width: "19px",
    textAlign: "center",
    fontSize: "15px",
    flexShrink: 0,
  },
  input: {
    flex: 1,
    width: "100%",
    minWidth: 0,
    padding: "14px 0",
    background: "transparent",
    border: "none",
    outline: "none",
    fontSize: "13px",
    color: "#0f172a",
    fontFamily: "inherit",
  },
  passwordInput: {
    flex: 1,
    width: "100%",
    minWidth: 0,
    padding: "14px 0",
    background: "transparent",
    border: "none",
    outline: "none",
    fontSize: "13px",
    color: "#0f172a",
    fontFamily: "inherit",
  },
  passwordToggle: {
    background: "transparent",
    border: "none",
    padding: "7px 0 7px 5px",
    color: "#2563eb",
    fontSize: "11px",
    fontWeight: "800",
    cursor: "pointer",
    flexShrink: 0,
  },
  error: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    background: "#fff1f2",
    border: "1px solid #fecdd3",
    color: "#be123c",
    padding: "12px",
    borderRadius: "11px",
    fontSize: "12px",
    lineHeight: 1.6,
    overflowWrap: "anywhere",
  },
  errorIcon: {
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    background: "#ffe4e6",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: "900",
    flexShrink: 0,
  },
  button: {
    width: "100%",
    minHeight: "51px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    padding: "0 18px",
    border: "none",
    borderRadius: "12px",
    background: "linear-gradient(100deg, #2563eb, #0d9488)",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "800",
    cursor: "pointer",
    boxShadow: "0 8px 20px rgba(37, 99, 235, 0.18)",
    fontFamily: "inherit",
  },
  buttonLoading: {
    justifyContent: "center",
    background: "#64748b",
    boxShadow: "none",
    cursor: "wait",
  },
  buttonArrow: {
    fontSize: "20px",
    lineHeight: 1,
  },
  spinner: {
    width: "16px",
    height: "16px",
    border: "2px solid rgba(255,255,255,0.4)",
    borderTopColor: "#ffffff",
    borderRadius: "50%",
    display: "inline-block",
    flexShrink: 0,
  },
  securityNote: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    gap: "9px",
    color: "#64748b",
    fontSize: "11px",
    lineHeight: 1.7,
    textAlign: "center",
  },
  loginDivider: {
    width: "100%",
    height: "1px",
    background: "#e8edf3",
  },
  helpText: {
    color: "#94a3b8",
    fontSize: "11px",
    lineHeight: 1.8,
    textAlign: "center",
  },
  copyright: {
    color: "#94a3b8",
    fontSize: "10px",
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 1.8,
  },
  copyrightDot: {
    padding: "0 8px",
    color: "#cbd5e1",
  },
};