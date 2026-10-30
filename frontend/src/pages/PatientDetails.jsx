import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/api";

const MONTHLY_LIMIT = 6;

const COLORS = {
  navy: "#203B63",
  blue: "#3478F6",
  blueLight: "#EAF2FF",
  cyan: "#20B8C9",
  cyanLight: "#E7FAFC",
  purple: "#8B5CF6",
  purpleLight: "#F2ECFF",
  coral: "#FF806E",
  coralLight: "#FFF0ED",
  green: "#20A879",
  greenLight: "#E7F8F1",
  yellow: "#F2B544",
  yellowLight: "#FFF7E6",
  ink: "#263B53",
  muted: "#71839A",
  border: "#E5ECF5",
  background: "#F3F7FD",
  white: "#FFFFFF",
};

const currentMonthKey = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
};

const shiftMonth = (month, offset) => {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(year, monthNumber - 1 + offset, 1);

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
};

const formatMonth = (month, short = false) => {
  if (!month) return "";

  const [year, monthNumber] = month.split("-").map(Number);

  return new Date(year, monthNumber - 1, 1).toLocaleDateString(
    "en-GB",
    {
      month: short ? "short" : "long",
      year: "numeric",
    }
  );
};

const parseLocalDate = (value) => {
  if (!value) return null;

  const text = String(value);
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);

  const date = match
    ? new Date(
        Number(match[1]),
        Number(match[2]) - 1,
        Number(match[3])
      )
    : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDate = (value) => {
  const date = parseLocalDate(value);

  if (!date) return "-";

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getValue = (object, keys, fallback = "-") => {
  for (const key of keys) {
    const value = object?.[key];

    if (value !== undefined && value !== null && value !== "") {
      if (typeof value === "object") {
        return (
          value.full_name ||
          value.name ||
          value.username ||
          value.first_name ||
          fallback
        );
      }

      return value;
    }
  }

  return fallback;
};

const getMonthKey = (value) => {
  if (!value) return "";

  const text = String(value);

  if (/^\d{4}-\d{2}/.test(text)) {
    return text.slice(0, 7);
  }

  const date = parseLocalDate(value);

  if (!date) return "";

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
};

const getVisitDate = (visit) =>
  getValue(
    visit,
    [
      "registration_date",
      "assignment_date",
      "visit_date",
      "appointment_date",
      "date",
      "created_at",
    ],
    null
  );

const getVisitNumber = (visit, index) =>
  getValue(
    visit,
    ["visit_number", "appointment_number", "number"],
    index + 1
  );

const getRegisteredBy = (visit) =>
  getValue(
    visit,
    [
      "registered_by",
      "registered_by_name",
      "created_by_name",
      "created_by",
    ],
    "-"
  );

const getPhysio = (visit) =>
  getValue(
    visit,
    [
      "therapist_name",
      "physiotherapist_name",
      "assigned_therapist",
      "therapist",
      "physio",
    ],
    "-"
  );

const getRegistrationCategory = (visit) =>
  getValue(
    visit,
    [
      "category",
      "registration_type",
      "visit_type",
      "appointment_type",
      "type",
    ],
    "Registration"
  );

const getPhysician = (visit) =>
  getValue(
    visit,
    ["referring_physician", "physician_name", "doctor_name"],
    "-"
  );

const getVisitUnderAnotherPhysio = (visit) =>
  getValue(
    visit,
    [
      "visit_under_another_physio",
      "visit_under_other_physio",
      "under_another_physio",
      "another_physio",
      "other_physio_visit",
      "previous_therapist_visit",
      "visit_with_another_therapist",
      "is_visit_under_another_physio",
    ],
    "-"
  );

const getSessionDate = (session) =>
  getValue(
    session,
    ["session_date", "date", "visit_date", "created_at"],
    null
  );

/*
 * Only Walk-in and Appointment registrations are counted
 * as utilized sessions.
 *
 * Other registration categories are excluded.
 */
const isUtilizationRegistration = (visit) => {
  const category = String(
    getValue(
      visit,
      [
        "category",
        "registration_type",
        "visit_type",
        "appointment_type",
        "type",
      ],
      ""
    )
  ).toLowerCase().replace(/[_-]/g, " ");

  const explicitWalkIn =
    visit?.is_walk_in === true ||
    visit?.walk_in === true;

  const explicitAppointment =
    visit?.is_appointment === true ||
    visit?.appointment === true;

  if (explicitWalkIn || explicitAppointment) return true;

  return (
    category.includes("walk in") ||
    category.includes("walkin") ||
    category.includes("appointment")
  );
};

function DonutChart({ used, allowed }) {
  const hasData = used !== null && used !== undefined;

  const percentage =
    hasData && allowed > 0
      ? Math.min((used / allowed) * 100, 100)
      : 0;

  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const offset =
    circumference - (percentage / 100) * circumference;

  return (
    <div className="donut-wrap">
      <svg
        viewBox="0 0 120 120"
        className="donut-svg"
        role="img"
        aria-label={
          hasData
            ? `${percentage.toFixed(0)} percent utilization`
            : "Utilization data unavailable"
        }
      >
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="#E9EFF8"
          strokeWidth="11"
        />

        {hasData && (
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="#3478F6"
            strokeWidth="11"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 60 60)"
            style={{ transition: "stroke-dashoffset .4s ease" }}
          />
        )}

        <text
          x="60"
          y="56"
          textAnchor="middle"
          className="donut-number"
        >
          {hasData ? `${percentage.toFixed(0)}%` : "N/A"}
        </text>

        <text
          x="60"
          y="73"
          textAnchor="middle"
          className="donut-caption"
        >
          UTILIZED
        </text>
      </svg>
    </div>
  );
}

function MonthlyBarChart({ months }) {
  const maxValue = Math.max(
    MONTHLY_LIMIT,
    ...months.map((month) => month.sessions_allowed),
    ...months.map((month) => month.sessions_used || 0)
  );

  return (
    <div className="bar-chart">
      <div className="bar-chart-grid">
        {[1, 0.75, 0.5, 0.25, 0].map((fraction) => (
          <div className="chart-grid-line" key={fraction}>
            <span>{Math.round(maxValue * fraction)}</span>
            <div />
          </div>
        ))}
      </div>

      <div className="bar-chart-columns">
        {months.map((month) => {
          const allowedHeight =
            (month.sessions_allowed / maxValue) * 100;

          const usedHeight =
            month.sessions_used === null
              ? 0
              : (month.sessions_used / maxValue) * 100;

          return (
            <div className="bar-column" key={month.month}>
              <div className="bar-area">
                <div
                  className="bar-allowed"
                  style={{ height: `${allowedHeight}%` }}
                  title={`${month.sessions_allowed} estimated sessions`}
                />

                {month.sessions_used !== null && (
                  <div
                    className="bar-used"
                    style={{ height: `${usedHeight}%` }}
                    title={`${month.sessions_used} utilized sessions`}
                  />
                )}
              </div>

              <strong>{formatMonth(month.month, true)}</strong>

              <span>
                {month.sessions_used === null
                  ? "No records"
                  : `${month.sessions_used} / ${month.sessions_allowed}`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function PatientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [registrationHistory, setRegistrationHistory] = useState([]);
  const [sessionHistory, setSessionHistory] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // 1 = selected month only, 3 = three months, 6 = six months.
  const [utilizationPeriod, setUtilizationPeriod] = useState("3");

  const [utilizationMonth, setUtilizationMonth] = useState(
    currentMonthKey()
  );

  const [registrationFilter, setRegistrationFilter] =
    useState("month");

  const [registrationMonth, setRegistrationMonth] =
    useState(currentMonthKey());

  const loadPatient = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        setError("");

        const response = await api.get(`patients/${id}/?months=6`);
        const data = response.data || {};

        setPatient(data.patient || data);

        setRegistrationHistory(
          Array.isArray(data.registration_history)
            ? data.registration_history
            : []
        );

        setSessionHistory(
          Array.isArray(data.session_history)
            ? data.session_history
            : []
        );
      } catch (err) {
        setError(
          err.response?.data?.detail ||
          err.response?.data?.error ||
          "Unable to load patient information from the backend."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id]
  );

  useEffect(() => {
    loadPatient();
  }, [loadPatient]);

  const patientName = getValue(
    patient,
    ["name", "patient_name", "full_name"],
    "Unnamed Patient"
  );

  const fileNumber = getValue(
    patient,
    ["patient_id", "file_number", "medical_record_number"],
    id
  );

  const insurance = getValue(
    patient,
    ["insurance_provider", "insurance", "payer"],
    "-"
  );

  const approvalStatus = getValue(
    patient,
    [
      "approval_status",
      "rcm_approval_status",
      "current_approval_status",
      "authorization_status",
    ],
    "Approved"
  );

  const isApproved = ["approved", "active"].includes(
    String(approvalStatus).toLowerCase()
  );

  const normalizedVisits = useMemo(() => {
    return registrationHistory
      .map((visit, index) => {
        const visitDate = getVisitDate(visit);

        return {
          ...visit,
          _index: index,
          _date: visitDate,
          _month: getMonthKey(visitDate),
        };
      })
      .filter((visit) => visit._month)
      .sort((a, b) => {
        const dateA = parseLocalDate(a._date);
        const dateB = parseLocalDate(b._date);

        return (dateB?.getTime() || 0) - (dateA?.getTime() || 0);
      });
  }, [registrationHistory]);

  /*
   * Utilization is imported from registration_history.
   * Only Walk-in and Appointment categories are included.
   */
  const utilizationRegistrations = useMemo(
    () => normalizedVisits.filter(isUtilizationRegistration),
    [normalizedVisits]
  );

  // This is the only calculation that changes the displayed period.
  const periodMonths = Number(utilizationPeriod);

  const displayedMonths = useMemo(() => {
    return Array.from(
      { length: periodMonths },
      (_, index) => {
        const monthKey = shiftMonth(
          utilizationMonth,
          index - (periodMonths - 1)
        );

        const used = utilizationRegistrations.filter(
          (visit) => visit._month === monthKey
        ).length;

        return {
          month: monthKey,
          month_label: formatMonth(monthKey),
          sessions_used: used,
          sessions_allowed: MONTHLY_LIMIT,
          remaining_sessions: Math.max(
            MONTHLY_LIMIT - used,
            0
          ),
        };
      }
    );
  }, [
    utilizationMonth,
    periodMonths,
    utilizationRegistrations,
  ]);

  const totalUsed = displayedMonths.reduce(
    (sum, month) => sum + month.sessions_used,
    0
  );

  const totalAllowed = MONTHLY_LIMIT * periodMonths;

  const remainingSessions = Math.max(
    totalAllowed - totalUsed,
    0
  );

  const utilizationPercentage =
    totalAllowed > 0
      ? Math.min((totalUsed / totalAllowed) * 100, 100)
      : 0;

  const periodTitle =
    periodMonths === 1
      ? formatMonth(utilizationMonth)
      : `${periodMonths} Months Ending ${formatMonth(
          utilizationMonth
        )}`;

  const currentRegistrationVisits = useMemo(
    () =>
      normalizedVisits.filter(
        (visit) => visit._month === registrationMonth
      ),
    [normalizedVisits, registrationMonth]
  );

  const filteredVisits =
    registrationFilter === "all"
      ? normalizedVisits
      : currentRegistrationVisits;

  const tableHeading =
    registrationFilter === "all"
      ? "All Registration Records"
      : `Registrations – ${formatMonth(registrationMonth)}`;

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.loadingCard}>
          <div className="spinner" />
          Loading patient file...
        </div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div style={styles.page}>
        <div style={styles.errorCard}>
          <h2>Patient file unavailable</h2>
          <p>{error || "Patient not found."}</p>

          <button
            style={styles.primaryButton}
            onClick={() => loadPatient()}
          >
            Try again
          </button>

          <button
            style={styles.backButton}
            onClick={() => navigate(-1)}
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <style>{`
        * {
          box-sizing: border-box;
        }

        .utilization-controls {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }

        .utilization-control-group {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 9px;
        }

        .period-tabs,
        .registration-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 9px;
        }

        .period-tab,
        .registration-tab {
          border: 1px solid #DCE6F5;
          background: #FFFFFF;
          color: #647B96;
          border-radius: 10px;
          padding: 11px 19px;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          transition: .2s ease;
        }

        .period-tab:hover,
        .registration-tab:hover {
          background: #EEF4FF;
          border-color: #9DBCF7;
        }

        .period-tab.active {
          background: #3478F6;
          border-color: #3478F6;
          color: #FFFFFF;
          box-shadow: 0 4px 12px rgba(52,120,246,.2);
        }

        .registration-tab.active {
          background: #18AFC0;
          border-color: #18AFC0;
          color: #FFFFFF;
          box-shadow: 0 4px 12px rgba(24,175,192,.18);
        }

        .month-picker {
          min-height: 42px;
          border: 1px solid #D6E2F2;
          border-radius: 10px;
          padding: 9px 12px;
          background: #FFFFFF;
          color: #344E6B;
          font-size: 12px;
          font-weight: 700;
          outline: none;
        }

        .month-picker:focus {
          border-color: #3478F6;
          box-shadow: 0 0 0 3px rgba(52,120,246,.12);
        }

        .patient-table-wrapper {
          width: 100%;
          overflow-x: auto;
          border: 1px solid #E1EAF6;
          border-radius: 14px;
          background: #FFFFFF;
        }

        .patient-table {
          width: 100%;
          min-width: 1100px;
          border-collapse: separate;
          border-spacing: 0;
          text-align: left;
        }

        .patient-table thead th {
          padding: 16px;
          background: #EAF2FF;
          color: #365B8A;
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .5px;
          white-space: nowrap;
          border-bottom: 1px solid #DCE8FA;
        }

        .patient-table tbody td {
          padding: 16px;
          color: #526984;
          font-size: 12px;
          border-bottom: 1px solid #EDF1F8;
          vertical-align: middle;
        }

        .patient-table tbody tr {
          background: #FFFFFF;
          transition: background .15s ease;
        }

        .patient-table tbody tr:nth-child(even) {
          background: #F8FBFF;
        }

        .patient-table tbody tr:hover {
          background: #EEF6FF;
        }

        .patient-table tbody tr:last-child td {
          border-bottom: none;
        }

        .visit-number {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 40px;
          padding: 7px 10px;
          border-radius: 8px;
          color: #2868D8;
          background: #EAF2FF;
          font-weight: 900;
        }

        .category-label {
          display: inline-flex;
          padding: 7px 10px;
          border-radius: 8px;
          color: #078A9A;
          background: #E5FAFC;
          font-size: 10px;
          font-weight: 800;
          white-space: nowrap;
        }

        .other-physio-yes {
          display: inline-flex;
          padding: 6px 10px;
          border-radius: 20px;
          background: #E5F8EF;
          color: #16875F;
          font-size: 10px;
          font-weight: 900;
          white-space: nowrap;
        }

        .other-physio-no {
          display: inline-flex;
          padding: 6px 10px;
          border-radius: 20px;
          background: #F0F3F8;
          color: #7A8DA4;
          font-size: 10px;
          font-weight: 800;
          white-space: nowrap;
        }

        .empty-state {
          padding: 45px 20px;
          text-align: center;
          border: 1px dashed #C9D9EF;
          border-radius: 14px;
          background: #F8FBFF;
        }

        .empty-state-title {
          font-size: 15px;
          font-weight: 900;
          color: #365575;
        }

        .empty-state-text {
          color: #8496AC;
          font-size: 12px;
          margin-top: 7px;
        }

        .donut-wrap {
          width: 160px;
          max-width: 100%;
          margin: 0 auto;
        }

        .donut-svg {
          width: 100%;
          display: block;
        }

        .donut-number {
          fill: #203B63;
          font-size: 21px;
          font-weight: 900;
        }

        .donut-caption {
          fill: #8294AB;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: .6px;
        }

        .utilization-layout {
          display: grid;
          grid-template-columns: minmax(220px, .75fr) minmax(0, 1.6fr);
          gap: 18px;
        }

        .utilization-card {
          min-width: 0;
          border: 1px solid #E2EAF5;
          border-radius: 16px;
          padding: 20px;
          background: #FFFFFF;
        }

        .utilization-card h3 {
          margin: 0 0 12px;
          font-size: 13px;
          font-weight: 900;
          color: #365575;
          text-align: center;
        }

        .utilization-card p {
          margin: 8px 0 0;
          font-size: 11px;
          color: #8193AA;
          text-align: center;
        }

        .utilization-numbers {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-top: 12px;
        }

        .utilization-number-box {
          padding: 12px;
          border-radius: 10px;
          background: #F4F8FF;
          text-align: center;
        }

        .utilization-number-box strong {
          display: block;
          color: #2868D8;
          font-size: 19px;
          font-weight: 900;
        }

        .utilization-number-box span {
          display: block;
          margin-top: 4px;
          color: #8294AB;
          font-size: 10px;
        }

        .bar-chart {
          position: relative;
          min-height: 245px;
          padding: 10px 5px 0 35px;
        }

        .bar-chart-grid {
          position: absolute;
          top: 10px;
          bottom: 40px;
          left: 0;
          right: 0;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          pointer-events: none;
        }

        .chart-grid-line {
          display: flex;
          align-items: center;
          gap: 9px;
          height: 1px;
        }

        .chart-grid-line span {
          width: 17px;
          color: #94A5BB;
          font-size: 9px;
          text-align: right;
        }

        .chart-grid-line div {
          height: 1px;
          flex: 1;
          background: #EAF0F8;
        }

        .bar-chart-columns {
          position: relative;
          display: flex;
          justify-content: space-around;
          align-items: stretch;
          gap: 12px;
          min-height: 235px;
        }

        .bar-column {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          gap: 7px;
          z-index: 1;
        }

        .bar-area {
          width: min(45px, 75%);
          height: 185px;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          position: relative;
          border-radius: 8px 8px 0 0;
          background: #F1F5FC;
          overflow: hidden;
        }

        .bar-allowed {
          position: absolute;
          bottom: 0;
          width: 100%;
          background: #D9E7FF;
          border-radius: 7px 7px 0 0;
        }

        .bar-used {
          position: absolute;
          bottom: 0;
          width: 65%;
          background: linear-gradient(180deg, #20B8C9, #3478F6);
          border-radius: 6px 6px 0 0;
          z-index: 2;
        }

        .bar-column strong {
          color: #526D8A;
          font-size: 10px;
          white-space: nowrap;
        }

        .bar-column span {
          color: #8799B0;
          font-size: 9px;
          text-align: center;
        }

        .legend {
          display: flex;
          gap: 18px;
          flex-wrap: wrap;
          color: #788DA6;
          font-size: 10px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .legend-dot {
          width: 9px;
          height: 9px;
          border-radius: 3px;
        }

        .spinner {
          width: 22px;
          height: 22px;
          border: 3px solid #DCE8FA;
          border-top-color: #3478F6;
          border-radius: 50%;
          margin: 0 auto 15px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 760px) {
          .patient-page-main {
            padding: 17px !important;
          }

          .patient-header-card {
            padding: 19px !important;
          }

          .utilization-layout {
            grid-template-columns: 1fr;
          }

          .bar-chart-columns {
            gap: 5px;
          }

          .utilization-control-group {
            width: 100%;
          }

          .utilization-control-group .month-picker {
            flex: 1;
            min-width: 145px;
          }
        }
      `}</style>

      <div style={styles.container}>
        {/* PAGE HEADER */}
        <header style={styles.topBar}>
          <div>
            <div style={styles.eyebrow}>PATIENT MANAGEMENT / FILE</div>
            <h1 style={styles.pageTitle}>Patient Overview</h1>
            <p style={styles.pageSubtitle}>
              Patient information, session utilization and registration history
            </p>
          </div>

          <div style={styles.headerActions}>
            <button
              style={styles.refreshButton}
              onClick={() => loadPatient(false)}
              disabled={refreshing}
            >
              {refreshing ? "Refreshing..." : "↻ Refresh"}
            </button>

            <button
              style={styles.backButton}
              onClick={() => navigate(-1)}
            >
              ← Back
            </button>
          </div>
        </header>

        {/* PATIENT INFORMATION */}
        <section
          className="patient-header-card"
          style={styles.patientCard}
        >
          <div style={styles.patientIdentity}>
            <div style={styles.avatar}>
              {String(patientName).charAt(0).toUpperCase()}
            </div>

            <div style={{ minWidth: 0 }}>
              <h2 style={styles.patientName}>{patientName}</h2>
              <div style={styles.fileNumber}>
                FILE NUMBER <strong>{fileNumber}</strong>
              </div>
            </div>
          </div>

          <div style={styles.patientBadges}>
            <div style={styles.infoPill}>
              <span style={styles.pillLabel}>INSURANCE</span>
              <strong style={styles.insuranceValue}>{insurance}</strong>
            </div>

            <div style={styles.infoPill}>
              <span style={styles.pillLabel}>APPROVAL STATUS</span>
              <span
                style={{
                  ...styles.statusBadge,
                  background: isApproved
                    ? COLORS.greenLight
                    : COLORS.coralLight,
                  color: isApproved ? COLORS.green : "#D45E55",
                }}
              >
                <span
                  style={{
                    ...styles.statusDot,
                    background: isApproved
                      ? COLORS.green
                      : COLORS.coral,
                  }}
                />
                {approvalStatus}
              </span>
            </div>
          </div>
        </section>

        {/* UTILIZATION */}
        <section
          className="patient-page-main"
          style={styles.section}
        >
          <div style={styles.sectionHeader}>
            <div>
              <div style={styles.sectionEyebrow}>
                REHABILITATION
              </div>
              <h2 style={styles.sectionTitle}>
                Session Utilization
              </h2>
              <p style={styles.description}>
                Utilized sessions are counted from Walk-in and Appointment registrations.
              </p>
            </div>
          </div>

          {/* PERIOD OPTIONS AND MONTH PICKER ON THE SAME ROW */}
          <div className="utilization-controls">
            <div className="utilization-control-group">
              <div className="period-tabs">
                {[
                  { value: "1", label: "Selected Month" },
                  { value: "3", label: "3 Months" },
                  { value: "6", label: "6 Months" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`period-tab ${
                      utilizationPeriod === option.value ? "active" : ""
                    }`}
                    onClick={() =>
                      setUtilizationPeriod(option.value)
                    }
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <input
                className="month-picker"
                type="month"
                value={utilizationMonth}
                aria-label="Select utilization month"
                onChange={(event) =>
                  setUtilizationMonth(event.target.value)
                }
              />
            </div>
          </div>

          <div style={styles.filterPanel}>
            <div style={styles.settingItem}>
              <label style={styles.settingLabel}>
                ESTIMATED SESSIONS PER MONTH
              </label>
              <strong style={styles.settingValue}>
                {MONTHLY_LIMIT} sessions
              </strong>
            </div>

            <div style={styles.settingItem}>
              <label style={styles.settingLabel}>
                TOTAL ESTIMATED ALLOWANCE
              </label>
              <strong style={styles.allowanceValue}>
                {totalAllowed} sessions
              </strong>
            </div>
          </div>

          <div style={styles.selectedMonthBanner}>
            <div>
              <span style={styles.selectedMonthCaption}>
                SELECTED PERIOD
              </span>
              <strong style={styles.selectedMonthTitle}>
                {periodTitle}
              </strong>
            </div>

            <span style={styles.currentMonthBadge}>
              {totalAllowed} ESTIMATED SESSIONS
            </span>
          </div>

          <div className="utilization-layout">
            <div
              className="utilization-card"
              style={{
                background:
                  "linear-gradient(145deg, #F0F6FF, #FFFFFF)",
                borderColor: "#DCE8FF",
              }}
            >
              <h3>Overall Utilization</h3>

              <DonutChart
                used={totalUsed}
                allowed={totalAllowed}
              />

              <p>{totalUsed} utilized sessions recorded</p>

              <div className="utilization-numbers">
                <div className="utilization-number-box">
                  <strong>{totalUsed}</strong>
                  <span>Utilized</span>
                </div>

                <div
                  className="utilization-number-box"
                  style={{ background: "#E8F8F2" }}
                >
                  <strong style={{ color: COLORS.green }}>
                    {remainingSessions}
                  </strong>
                  <span>Remaining</span>
                </div>
              </div>
            </div>

            <div className="utilization-card">
              <div style={styles.chartHeader}>
                <div>
                  <h3 style={styles.chartTitle}>
                    Monthly Session Utilization
                  </h3>
                  <p style={styles.chartSubtitle}>
                    Walk-ins and appointments compared with estimated allowance
                  </p>
                </div>

                <span style={styles.chartAllowanceBadge}>
                  {MONTHLY_LIMIT} sessions / month
                </span>
              </div>

              <MonthlyBarChart months={displayedMonths} />

              <div className="legend">
                <div className="legend-item">
                  <span
                    className="legend-dot"
                    style={{ background: "#D9E7FF" }}
                  />
                  Estimated sessions
                </div>

                <div className="legend-item">
                  <span
                    className="legend-dot"
                    style={{ background: "#20B8C9" }}
                  />
                  Utilized sessions
                </div>
              </div>
            </div>
          </div>

          <div style={styles.chartNote}>
            Utilization is calculated from registration records categorized as Walk-in or Appointment.
            Other registration categories are excluded.
          </div>
        </section>

        {/* REGISTRATION HISTORY */}
        <section
          className="patient-page-main"
          style={styles.section}
        >
          <div style={styles.sectionHeader}>
            <div>
              <div style={styles.sectionEyebrow}>
                PATIENT ACTIVITY
              </div>
              <h2 style={styles.sectionTitle}>
                Registration History
              </h2>
              <p style={styles.description}>
                View registration dates, therapist assignments and visit details.
              </p>
            </div>

            <div style={styles.monthPickerArea}>
              <label style={styles.monthPickerLabel}>
                SELECT REGISTRATION MONTH
              </label>

              <input
                className="month-picker"
                type="month"
                value={registrationMonth}
                onChange={(event) => {
                  setRegistrationMonth(event.target.value);
                  setRegistrationFilter("month");
                }}
              />
            </div>
          </div>

          <div style={styles.registrationFilterBar}>
            <div className="registration-tabs">
              <button
                type="button"
                className={`registration-tab ${
                  registrationFilter === "month" ? "active" : ""
                }`}
                onClick={() => setRegistrationFilter("month")}
              >
                Selected Month
              </button>

              <button
                type="button"
                className={`registration-tab ${
                  registrationFilter === "all" ? "active" : ""
                }`}
                onClick={() => setRegistrationFilter("all")}
              >
                All Registrations
              </button>
            </div>

            <div style={styles.registrationCount}>
              <strong>{filteredVisits.length}</strong>
              <span>
                {filteredVisits.length === 1 ? "record" : "records"}
              </span>
            </div>
          </div>

          <div style={styles.tableHeading}>
            <div>
              <h3 style={styles.tableTitle}>{tableHeading}</h3>
              <p style={styles.tableSubtitle}>
                {registrationFilter === "all"
                  ? "All available registration records"
                  : `Records for ${formatMonth(registrationMonth)}`}
              </p>
            </div>
          </div>

          {filteredVisits.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: 30, marginBottom: 12 }}>
                📋
              </div>

              <div className="empty-state-title">
                No registration records found
              </div>

              <div className="empty-state-text">
                No registrations are available for this selection.
              </div>
            </div>
          ) : (
            <div className="patient-table-wrapper">
              <table className="patient-table">
                <thead>
                  <tr>
                    <th>Visit No.</th>
                    <th>Registration Date</th>
                    <th>Registered By</th>
                    <th>Physiotherapist</th>
                    <th>Category</th>
                    <th>Referring Physician</th>
                    <th>Visit Under Another Physio</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredVisits.map((visit) => {
                    const otherPhysio =
                      getVisitUnderAnotherPhysio(visit);

                    const isYes =
                      otherPhysio === true ||
                      ["true", "yes", "1"].includes(
                        String(otherPhysio).toLowerCase()
                      );

                    return (
                      <tr
                        key={
                          visit.id ||
                          visit.pk ||
                          visit._index
                        }
                      >
                        <td>
                          <span className="visit-number">
                            {getVisitNumber(visit, visit._index)}
                          </span>
                        </td>

                        <td>
                          <strong style={styles.dateValue}>
                            {formatDate(visit._date)}
                          </strong>
                        </td>

                        <td>
                          <span style={styles.registeredBy}>
                            {getRegisteredBy(visit)}
                          </span>
                        </td>

                        <td>
                          <span style={styles.physioName}>
                            {getPhysio(visit)}
                          </span>
                        </td>

                        <td>
                          <span className="category-label">
                            {getRegistrationCategory(visit)}
                          </span>
                        </td>

                        <td>
                          <span style={styles.physicianName}>
                            {getPhysician(visit)}
                          </span>
                        </td>

                        <td>
                          {otherPhysio === "-" ? (
                            <span className="other-physio-no">
                              Not specified
                            </span>
                          ) : (
                            <span
                              className={
                                isYes
                                  ? "other-physio-yes"
                                  : "other-physio-no"
                              }
                            >
                              {isYes ? "Yes" : "No"}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* RECENT SESSION RECORDS */}
        {sessionHistory.length > 0 && (
          <section style={styles.section}>
            <div>
              <div style={styles.sectionEyebrow}>
                SESSION RECORDS
              </div>
              <h2 style={styles.sectionTitle}>
                Recent Recorded Sessions
              </h2>
              <p style={styles.description}>
                Session records received from the backend.
              </p>
            </div>

            <div style={styles.sessionHistoryList}>
              {sessionHistory.slice(0, 5).map((session, index) => (
                <div
                  key={session.id || index}
                  style={styles.sessionHistoryItem}
                >
                  <div style={styles.sessionHistoryIcon}>✓</div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong style={styles.sessionHistoryDate}>
                      {formatDate(getSessionDate(session))}
                    </strong>

                    <div style={styles.sessionHistoryMeta}>
                      {getValue(
                        session,
                        ["insurance_type", "insurance_provider"],
                        "Insurance not specified"
                      )}
                      {" · "}
                      {getValue(
                        session,
                        ["recorded_by", "created_by"],
                        "Staff not specified"
                      )}
                    </div>
                  </div>

                  <span style={styles.sessionRecordedBadge}>
                    Recorded
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        <footer style={styles.footer}>
          Patient File · {fileNumber} · Patient registration information
        </footer>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#F3F7FD",
    padding: "30px 22px 50px",
    fontFamily: "Inter, Arial, sans-serif",
    color: COLORS.ink,
  },

  container: {
    maxWidth: "1320px",
    margin: "0 auto",
    display: "grid",
    gap: "22px",
  },

  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "15px",
  },

  eyebrow: {
    color: COLORS.blue,
    fontSize: "10px",
    fontWeight: "900",
    letterSpacing: "1.5px",
  },

  pageTitle: {
    fontSize: "29px",
    fontWeight: "900",
    margin: "7px 0 0",
    color: COLORS.navy,
    letterSpacing: "-.7px",
  },

  pageSubtitle: {
    color: COLORS.muted,
    fontSize: "13px",
    margin: "6px 0 0",
  },

  headerActions: {
    display: "flex",
    gap: "9px",
    flexWrap: "wrap",
  },

  backButton: {
    background: "#FFFFFF",
    border: "1px solid #DCE6F5",
    color: COLORS.navy,
    padding: "10px 16px",
    borderRadius: "9px",
    cursor: "pointer",
    fontWeight: "800",
  },

  refreshButton: {
    background: COLORS.blueLight,
    border: "1px solid #D1E1FF",
    color: COLORS.blue,
    padding: "10px 16px",
    borderRadius: "9px",
    cursor: "pointer",
    fontWeight: "800",
  },

  patientCard: {
    background: "linear-gradient(115deg, #FFFFFF, #EEF5FF)",
    border: "1px solid #DCE8FA",
    borderRadius: "17px",
    padding: "27px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "25px",
    boxShadow: "0 6px 20px rgba(52,120,246,.06)",
  },

  patientIdentity: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
    minWidth: 0,
  },

  avatar: {
    width: "65px",
    height: "65px",
    borderRadius: "17px",
    background: "linear-gradient(135deg, #3478F6, #20B8C9)",
    color: "#FFFFFF",
    display: "grid",
    placeItems: "center",
    fontSize: "27px",
    fontWeight: "900",
    flexShrink: 0,
    boxShadow: "0 5px 14px rgba(52,120,246,.2)",
  },

  patientName: {
    fontSize: "25px",
    fontWeight: "900",
    color: COLORS.navy,
    margin: 0,
    overflowWrap: "anywhere",
  },

  fileNumber: {
    marginTop: "9px",
    fontSize: "11px",
    color: COLORS.muted,
    letterSpacing: ".7px",
  },

  patientBadges: {
    display: "flex",
    gap: "14px",
    flexWrap: "wrap",
  },

  infoPill: {
    display: "grid",
    gap: "8px",
    padding: "13px 17px",
    background: "#FFFFFF",
    border: "1px solid #E3EBF7",
    borderRadius: "11px",
    minWidth: "125px",
  },

  pillLabel: {
    color: COLORS.muted,
    fontSize: "9px",
    fontWeight: "900",
    letterSpacing: ".8px",
  },

  insuranceValue: {
    fontSize: "13px",
    color: COLORS.navy,
    textTransform: "capitalize",
  },

  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    width: "fit-content",
    padding: "5px 9px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "900",
  },

  statusDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
  },

  section: {
    background: "#FFFFFF",
    border: "1px solid #E1EAF6",
    borderRadius: "17px",
    padding: "25px",
    display: "grid",
    gap: "21px",
    boxShadow: "0 5px 18px rgba(32,59,99,.04)",
    minWidth: 0,
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "15px",
  },

  sectionEyebrow: {
    fontSize: "9px",
    fontWeight: "900",
    letterSpacing: "1.2px",
    color: COLORS.cyan,
  },

  sectionTitle: {
    fontSize: "20px",
    fontWeight: "900",
    margin: "6px 0 0",
    color: COLORS.navy,
  },

  description: {
    fontSize: "12px",
    color: COLORS.muted,
    margin: "6px 0 0",
  },

  filterPanel: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "28px",
    padding: "17px",
    border: "1px solid #DCE8FA",
    borderRadius: "13px",
    background: "#F5F8FF",
  },

  settingItem: {
    display: "grid",
    gap: "8px",
  },

  settingLabel: {
    color: COLORS.muted,
    fontSize: "9px",
    fontWeight: "900",
    letterSpacing: ".7px",
  },

  settingValue: {
    color: COLORS.navy,
    fontSize: "13px",
  },

  allowanceValue: {
    color: COLORS.blue,
    fontSize: "17px",
    fontWeight: "900",
  },

  selectedMonthBanner: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
    padding: "16px 18px",
    borderRadius: "12px",
    background: "linear-gradient(100deg, #EAF2FF, #E6FAFC)",
    border: "1px solid #D7E8F7",
  },

  selectedMonthCaption: {
    display: "block",
    color: COLORS.muted,
    fontSize: "9px",
    fontWeight: "900",
    letterSpacing: ".8px",
    marginBottom: "5px",
  },

  selectedMonthTitle: {
    color: COLORS.navy,
    fontSize: "15px",
    fontWeight: "900",
  },

  currentMonthBadge: {
    background: "#FFFFFF",
    color: COLORS.blue,
    padding: "8px 12px",
    borderRadius: "20px",
    fontSize: "10px",
    fontWeight: "900",
  },

  chartHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: "12px",
  },

  chartTitle: {
    margin: 0,
    color: COLORS.navy,
    fontSize: "14px",
    fontWeight: "900",
  },

  chartSubtitle: {
    margin: "5px 0 0",
    color: COLORS.muted,
    fontSize: "11px",
  },

  chartAllowanceBadge: {
    background: COLORS.purpleLight,
    color: COLORS.purple,
    borderRadius: "20px",
    padding: "7px 11px",
    fontSize: "10px",
    fontWeight: "900",
  },

  chartNote: {
    color: COLORS.muted,
    fontSize: "10px",
    padding: "12px 14px",
    borderRadius: "9px",
    background: "#F4F8FF",
    border: "1px solid #E5EDF8",
    lineHeight: 1.6,
  },

  monthPickerArea: {
    display: "grid",
    gap: "6px",
  },

  monthPickerLabel: {
    color: COLORS.muted,
    fontSize: "9px",
    fontWeight: "900",
    letterSpacing: ".8px",
  },

  registrationFilterBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
    padding: "14px",
    border: "1px solid #E2ECF7",
    background: "#F7FAFF",
    borderRadius: "12px",
  },

  registrationCount: {
    display: "flex",
    alignItems: "baseline",
    gap: "5px",
    color: COLORS.muted,
    fontSize: "11px",
  },

  tableHeading: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
    paddingTop: "3px",
  },

  tableTitle: {
    margin: 0,
    fontSize: "15px",
    fontWeight: "900",
    color: COLORS.navy,
  },

  tableSubtitle: {
    margin: "5px 0 0",
    color: COLORS.muted,
    fontSize: "11px",
  },

  dateValue: {
    color: COLORS.navy,
    whiteSpace: "nowrap",
  },

  registeredBy: {
    color: "#647B96",
    fontWeight: "700",
  },

  physioName: {
    color: "#3478B8",
    fontWeight: "800",
  },

  physicianName: {
    color: "#71839A",
  },

  sessionHistoryList: {
    display: "grid",
    gap: "9px",
  },

  sessionHistoryItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "13px",
    border: "1px solid #E3EBF7",
    borderRadius: "11px",
    background: "#F8FBFF",
  },

  sessionHistoryIcon: {
    width: "30px",
    height: "30px",
    display: "grid",
    placeItems: "center",
    borderRadius: "50%",
    background: COLORS.greenLight,
    color: COLORS.green,
    fontWeight: "900",
    flexShrink: 0,
  },

  sessionHistoryDate: {
    color: COLORS.navy,
    fontSize: "12px",
  },

  sessionHistoryMeta: {
    color: COLORS.muted,
    fontSize: "10px",
    marginTop: "4px",
  },

  sessionRecordedBadge: {
    color: COLORS.green,
    background: COLORS.greenLight,
    padding: "5px 8px",
    borderRadius: "7px",
    fontSize: "9px",
    fontWeight: "900",
    whiteSpace: "nowrap",
  },

  footer: {
    textAlign: "center",
    color: "#91A1B5",
    fontSize: "11px",
    padding: "12px",
  },

  loadingCard: {
    maxWidth: "500px",
    margin: "100px auto",
    padding: "35px",
    background: "#FFFFFF",
    borderRadius: "14px",
    textAlign: "center",
    color: COLORS.muted,
  },

  errorCard: {
    maxWidth: "600px",
    margin: "80px auto",
    background: "#FFFFFF",
    padding: "30px",
    borderRadius: "14px",
    color: COLORS.ink,
  },

  primaryButton: {
    background: COLORS.blue,
    color: "#FFFFFF",
    border: 0,
    borderRadius: "8px",
    padding: "10px 16px",
    marginRight: "10px",
    cursor: "pointer",
  },
};