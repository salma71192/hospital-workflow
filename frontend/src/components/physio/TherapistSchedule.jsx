
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import api from "../../api/api";

const COLORS = {
  navy: "#142B4D",
  yellow: "#EAB308",
  brown: "#92400E",
  orange: "#EA580C",
};

function localDate() {
  const date = new Date();

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatTime(value) {
  if (!value) return "—";

  const [hour, minute] = String(value)
    .slice(0, 5)
    .split(":")
    .map(Number);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return value;
  }

  const displayHour = hour % 12 || 12;

  return `${displayHour}:${String(minute).padStart(2, "0")} ${
    hour >= 12 ? "PM" : "AM"
  }`;
}

function SummaryCard({ label, value, color }) {
  return (
    <div className="rts-summary-card">
      <span>{label}</span>
      <strong style={{ color }}>{value}</strong>
    </div>
  );
}

export default function TherapistSchedule() {
  const [date, setDate] = useState(localDate());
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [therapistName, setTherapistName] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadSchedule = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      // Backend must determine the logged-in therapist.
      // Do not accept a therapist name supplied by the browser.
      const response = await api.get(
        "/physio/schedule/my/",
        {
          params: { date },
        }
      );

      const data = response.data || {};

      setAppointments(
        Array.isArray(data.appointments)
          ? data.appointments
          : []
      );

      setTherapistName(data.therapist_name || "");
      setLastUpdated(data.last_updated || null);
    } catch (err) {
      setAppointments([]);

      setError(
        err.response?.data?.error ||
        err.response?.data?.detail ||
        "Unable to load the schedule."
      );
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  const sortedAppointments = useMemo(() => {
    return [...appointments].sort((a, b) =>
      String(a.time || "").localeCompare(
        String(b.time || "")
      )
    );
  }, [appointments]);

  const statistics = useMemo(() => {
    const total = appointments.length;

    const confirmed = appointments.filter(
      (a) => a.confirmation_status === "confirmed"
    ).length;

    const unconfirmed = appointments.filter(
      (a) => a.confirmation_status === "unconfirmed"
    ).length;

    const evaluations = appointments.filter(
      (a) => a.appointment_type === "evaluation"
    ).length;

    return {
      total,
      confirmed,
      unconfirmed,
      evaluations,
    };
  }, [appointments]);

  return (
    <div className="rts-page">
      <style>{styles}</style>

      <div className="rts-container">
        <div className="rts-hero">
          <div>
            <div className="rts-eyebrow">
              PHYSIOTHERAPY WORKSPACE
            </div>

            <h1>My Daily Schedule</h1>

            <p>
              View appointments published by the
              Call Center.
            </p>
          </div>

          <div className="rts-hero-icon">📅</div>
        </div>

        <div className="rts-toolbar">
          <div className="rts-therapist">
            <span>Therapist</span>
            <strong>
              {therapistName || "My schedule"}
            </strong>
          </div>

          <label className="rts-date">
            Schedule date
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>

          <button
            type="button"
            className="rts-refresh"
            onClick={loadSchedule}
            disabled={loading}
          >
            {loading ? "Loading..." : "↻ Refresh"}
          </button>
        </div>

        {error && (
          <div className="rts-error">
            {error}
          </div>
        )}

        <div className="rts-summary-grid">
          <SummaryCard
            label="Total appointments"
            value={statistics.total}
            color={COLORS.navy}
          />

          <SummaryCard
            label="Confirmed"
            value={statistics.confirmed}
            color={COLORS.yellow}
          />

          <SummaryCard
            label="Not confirmed"
            value={statistics.unconfirmed}
            color={COLORS.brown}
          />

          <SummaryCard
            label="Evaluations"
            value={statistics.evaluations}
            color={COLORS.orange}
          />
        </div>

        <div className="rts-panel">
          <div className="rts-panel-header">
            <div>
              <h2>Daily Appointments</h2>
              <p>
                {date} · {statistics.total} appointments
              </p>
            </div>

            <span className="rts-readonly">
              🔒 View only
            </span>
          </div>

          <div className="rts-legend">
            <span>
              <i className="rts-dot rts-yellow" />
              Confirmed
            </span>

            <span>
              <i className="rts-dot rts-brown" />
              Not confirmed
            </span>

            <span>
              <i className="rts-dot rts-orange" />
              Evaluation
            </span>
          </div>

          {loading ? (
            <div className="rts-empty">
              Loading appointments...
            </div>
          ) : sortedAppointments.length === 0 ? (
            <div className="rts-empty">
              <div className="rts-empty-icon">📅</div>
              <strong>No appointments available</strong>
              <p>
                The Call Center has not published
                appointments for this date, or the
                schedule is empty.
              </p>
            </div>
          ) : (
            <div className="rts-appointment-list">
              {sortedAppointments.map((appointment) => {
                const isEvaluation =
                  appointment.appointment_type ===
                  "evaluation";

                const confirmed =
                  appointment.confirmation_status ===
                  "confirmed";

                return (
                  <div
                    key={appointment.id}
                    className={`rts-appointment ${
                      isEvaluation
                        ? "rts-evaluation"
                        : confirmed
                        ? "rts-confirmed"
                        : "rts-unconfirmed"
                    }`}
                  >
                    <div className="rts-time">
                      {formatTime(appointment.time)}
                    </div>

                    <div className="rts-patient">
                      <strong>
                        {appointment.patient_name}
                      </strong>

                      <span>
                        {appointment.file_number
                          ? `File: ${appointment.file_number}`
                          : "File number unavailable"}
                      </span>
                    </div>

                    <div className="rts-statuses">
                      {isEvaluation && (
                        <span className="rts-badge evaluation">
                          Evaluation
                        </span>
                      )}

                      <span
                        className={`rts-badge ${
                          confirmed
                            ? "confirmed"
                            : "unconfirmed"
                        }`}
                      >
                        {confirmed
                          ? "Confirmed"
                          : "Not confirmed"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="rts-panel-footer">
            <span>
              Managed by Call Center
            </span>

            {lastUpdated && (
              <span>
                Last updated:{" "}
                {new Date(lastUpdated).toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = `
.rts-page {
  width: 100%;
  min-width: 0;
  background: #f5f8fc;
  color: #142b4d;
  padding: 20px;
  overflow-x: hidden;
}

.rts-page * {
  box-sizing: border-box;
}

.rts-container {
  width: 100%;
  max-width: 1500px;
  min-width: 0;
  margin: 0 auto;
}

.rts-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 30px;
  background: linear-gradient(
    120deg,
    #142b4d,
    #24518b
  );
  border-radius: 20px;
  color: white;
  margin-bottom: 20px;
}

.rts-eyebrow {
  color: #bfd7f5;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 2px;
}

.rts-hero h1 {
  color: white;
  font-size: 28px;
  margin: 10px 0;
}

.rts-hero p {
  color: #dbeafe;
  font-size: 13px;
  margin: 0;
}

.rts-hero-icon {
  font-size: 55px;
}

.rts-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 15px;
  padding: 18px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 15px;
  margin-bottom: 20px;
}

.rts-therapist,
.rts-date {
  display: flex;
  flex-direction: column;
  gap: 7px;
  flex: 1 1 200px;
  min-width: 0;
}

.rts-therapist span,
.rts-date {
  font-size: 12px;
  font-weight: 700;
}

.rts-therapist strong {
  font-size: 15px;
}

.rts-date input {
  width: 100%;
  min-width: 0;
  padding: 11px;
  border: 1px solid #d9e2ee;
  border-radius: 9px;
  background: white;
  color: #142b4d;
  font: inherit;
}

.rts-refresh {
  border: none;
  border-radius: 10px;
  padding: 12px 18px;
  background: #24518b;
  color: white;
  font-weight: 800;
  cursor: pointer;
}

.rts-refresh:disabled {
  opacity: .5;
  cursor: not-allowed;
}

.rts-summary-grid {
  display: grid;
  grid-template-columns: repeat(
    4,
    minmax(0, 1fr)
  );
  gap: 14px;
  margin-bottom: 20px;
}

.rts-summary-card {
  min-width: 0;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 15px;
  padding: 20px;
}

.rts-summary-card span {
  display: block;
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
}

.rts-summary-card strong {
  display: block;
  font-size: 32px;
  margin-top: 12px;
}

.rts-panel {
  min-width: 0;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  padding: 22px;
}

.rts-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}

.rts-panel-header h2 {
  font-size: 19px;
  margin: 0 0 6px;
}

.rts-panel-header p {
  color: #64748b;
  font-size: 12px;
  margin: 0;
}

.rts-readonly {
  background: #edf4ff;
  color: #24518b;
  border-radius: 20px;
  padding: 8px 12px;
  font-size: 11px;
  font-weight: 800;
}

.rts-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  margin-bottom: 20px;
  font-size: 12px;
  color: #64748b;
}

.rts-legend span {
  display: flex;
  align-items: center;
  gap: 7px;
}

.rts-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}

.rts-yellow {
  background: #eab308;
}

.rts-brown {
  background: #92400e;
}

.rts-orange {
  background: #ea580c;
}

.rts-appointment-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.rts-appointment {
  display: flex;
  align-items: center;
  gap: 18px;
  min-width: 0;
  padding: 16px;
  border: 1px solid #e2e8f0;
  border-left: 5px solid #eab308;
  border-radius: 11px;
  background: #fffbeb;
}

.rts-appointment.rts-unconfirmed {
  background: #f8f0e8;
  border-left-color: #92400e;
}

.rts-appointment.rts-evaluation {
  background: #fff7ed;
  border-left-color: #ea580c;
}

.rts-time {
  flex: 0 0 100px;
  font-weight: 800;
  font-size: 13px;
}

.rts-patient {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.rts-patient strong {
  font-size: 13px;
  overflow-wrap: anywhere;
}

.rts-patient span {
  font-size: 11px;
  color: #64748b;
}

.rts-statuses {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.rts-badge {
  padding: 8px 11px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 800;
  white-space: nowrap;
}

.rts-badge.confirmed {
  color: #854d0e;
  background: #fef3c7;
}

.rts-badge.unconfirmed {
  color: #78350f;
  background: #f1e2d5;
}

.rts-badge.evaluation {
  color: #c2410c;
  background: #ffedd5;
}

.rts-empty {
  padding: 65px 15px;
  text-align: center;
  color: #64748b;
}

.rts-empty-icon {
  font-size: 40px;
  margin-bottom: 12px;
}

.rts-empty strong {
  display: block;
  color: #142b4d;
}

.rts-empty p {
  font-size: 12px;
  max-width: 370px;
  margin: 10px auto;
}

.rts-panel-footer {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  padding-top: 18px;
  margin-top: 20px;
  border-top: 1px solid #e2e8f0;
  color: #64748b;
  font-size: 11px;
}

.rts-error {
  background: #fef2f2;
  color: #991b1b;
  padding: 14px;
  border-radius: 10px;
  margin-bottom: 18px;
}

@media (max-width: 900px) {
  .rts-summary-grid {
    grid-template-columns: repeat(
      2,
      minmax(0, 1fr)
    );
  }
}

@media (max-width: 600px) {
  .rts-page {
    padding: 10px;
  }

  .rts-hero {
    padding: 22px;
  }

  .rts-hero h1 {
    font-size: 23px;
  }

  .rts-hero-icon {
    display: none;
  }

  .rts-panel {
    padding: 15px;
  }

  .rts-appointment {
    flex-wrap: wrap;
    gap: 12px;
  }

  .rts-time {
    flex: 0 0 100%;
  }

  .rts-statuses {
    width: 100%;
  }

  .rts-summary-card {
    padding: 14px;
  }

  .rts-summary-card strong {
    font-size: 26px;
  }
}
`;
