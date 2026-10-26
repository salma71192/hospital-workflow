
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import CreateClaim from "./CreateClaim";

export default function ClaimsManagement() {
  const navigate = useNavigate();
  const requestRef = useRef(0);

  const [search, setSearch] = useState("");
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const patientName = (patient) =>
    patient?.name ||
    patient?.full_name ||
    patient?.patient_name ||
    [
      patient?.first_name,
      patient?.middle_name,
      patient?.last_name,
    ]
      .filter(Boolean)
      .join(" ") ||
    "Unnamed patient";

  const patientFileNumber = (patient) =>
    patient?.patient_id ??
    patient?.file_number ??
    patient?.mrn ??
    patient?.id ??
    "-";

  const patientApproval = (patient) =>
    patient?.current_approval_number ||
    patient?.approval_number ||
    patient?.authorization_number ||
    "-";

  useEffect(() => {
    const query = search.trim();

    if (!query || selectedPatient) {
      requestRef.current += 1;
      setPatients([]);
      setLoading(false);
      return undefined;
    }

    const requestId = ++requestRef.current;
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");

      try {
        const response = await api.get(
          `patients/?search=${encodeURIComponent(query)}`,
          { signal: controller.signal }
        );

        if (requestId !== requestRef.current) return;

        const data = response.data;
        const results = Array.isArray(data)
          ? data
          : Array.isArray(data?.patients)
          ? data.patients
          : Array.isArray(data?.results)
          ? data.results
          : [];

        const normalizedQuery = query.toLowerCase();

        const filtered = results.filter((patient) => {
          const values = [
            patientName(patient),
            patientFileNumber(patient),
            patient?.id,
            patient?.current_approval_number,
            patient?.approval_number,
            patient?.mrn,
          ];

          return values.some((value) =>
            String(value ?? "")
              .toLowerCase()
              .includes(normalizedQuery)
          );
        });

        setPatients(filtered);
      } catch (err) {
        if (
          err.name === "CanceledError" ||
          err.code === "ERR_CANCELED"
        ) {
          return;
        }

        if (requestId !== requestRef.current) return;

        setPatients([]);
        setError(
          err.response?.data?.detail ||
            err.response?.data?.error ||
            "Unable to search patients. Please try again."
        );
      } finally {
        if (requestId === requestRef.current) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [search, selectedPatient]);

  const selectPatient = (patient) => {
    requestRef.current += 1;
    setSelectedPatient(patient);
    setPatients([]);
    setLoading(false);
    setError("");
  };

  const openPatientFile = (patient) => {
    if (patient?.id === undefined || patient?.id === null) {
      setError("This patient record does not contain a valid patient ID.");
      return;
    }

    navigate(`/patients/${patient.id}`);
  };

  const returnToSearch = () => {
    setSelectedPatient(null);
    setError("");
  };

  const clearSearch = () => {
    requestRef.current += 1;
    setSearch("");
    setPatients([]);
    setLoading(false);
    setError("");
  };

  return (
    <main className="rcm-page">
      <style>{`
        .rcm-page {
          --navy: #172b4d;
          --blue: #3767e8;
          --blue-dark: #2853c7;
          --green: #0b9b72;
          --text: #27364b;
          --muted: #7b8799;
          --border: #e5eaf2;
          width: 100%;
          min-width: 0;
          color: var(--text);
          font-family: Inter, -apple-system, BlinkMacSystemFont,
            "Segoe UI", sans-serif;
        }

        .rcm-page * {
          box-sizing: border-box;
        }

        .rcm-page button,
        .rcm-page input {
          font: inherit;
        }

        .rcm-page button {
          cursor: pointer;
        }

        .rcm-page button:focus-visible,
        .rcm-page input:focus-visible {
          outline: 3px solid rgba(55, 103, 232, .2);
          outline-offset: 2px;
        }

        .rcm-hero {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          padding: 30px;
          margin-bottom: 24px;
          border: 1px solid #dce6fa;
          border-radius: 22px;
          background: linear-gradient(
            120deg,
            #fff 0%,
            #f2f6ff 70%,
            #eaf1ff 100%
          );
        }

        .rcm-eyebrow {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
          color: var(--blue);
          font-size: 10px;
          font-weight: 850;
          letter-spacing: 1.5px;
          text-transform: uppercase;
        }

        .rcm-eyebrow-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--green);
        }

        .rcm-hero h1 {
          margin: 0;
          color: var(--navy);
          font-size: clamp(25px, 3vw, 34px);
          font-weight: 850;
          letter-spacing: -1px;
        }

        .rcm-hero p {
          max-width: 590px;
          margin: 10px 0 0;
          color: var(--muted);
          font-size: 13px;
          line-height: 1.8;
        }

        .rcm-hero-icon {
          display: grid;
          place-items: center;
          width: 66px;
          height: 66px;
          flex: 0 0 66px;
          border-radius: 20px;
          background: var(--navy);
          color: white;
          font-size: 29px;
          font-weight: 800;
          box-shadow: 0 12px 25px rgba(23, 43, 77, .16);
        }

        .rcm-workspace {
          border: 1px solid var(--border);
          border-radius: 20px;
          background: white;
          box-shadow: 0 5px 24px rgba(29, 48, 79, .035);
        }

        .rcm-section-head {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 24px 25px 20px;
          border-bottom: 1px solid #edf0f6;
        }

        .rcm-section-icon {
          display: grid;
          place-items: center;
          width: 43px;
          height: 43px;
          flex: 0 0 43px;
          border: 1px solid #dce7ff;
          border-radius: 13px;
          background: #edf3ff;
          color: var(--blue);
          font-size: 21px;
        }

        .rcm-section-head h2 {
          margin: 0;
          color: var(--navy);
          font-size: 17px;
          font-weight: 850;
        }

        .rcm-section-head p {
          margin: 6px 0 0;
          color: var(--muted);
          font-size: 12px;
          line-height: 1.7;
        }

        .rcm-search-content {
          padding: 23px 25px 25px;
        }

        .rcm-search-label {
          display: block;
          margin-bottom: 9px;
          color: var(--text);
          font-size: 12px;
          font-weight: 800;
        }

        .rcm-search-wrap {
          position: relative;
        }

        .rcm-search-symbol {
          position: absolute;
          top: 50%;
          left: 16px;
          transform: translateY(-50%);
          color: var(--blue);
          font-size: 22px;
          pointer-events: none;
        }

        .rcm-search-input {
          width: 100%;
          min-height: 54px;
          padding: 13px 48px 13px 46px;
          border: 1.5px solid #d7e1f1;
          border-radius: 13px;
          background: #f9fbff;
          color: var(--text);
          font-size: 13px;
          transition: border-color .2s, box-shadow .2s;
        }

        .rcm-search-input::placeholder {
          color: #9aa6b8;
        }

        .rcm-search-input:focus {
          border-color: var(--blue);
          background: white;
          box-shadow: 0 0 0 4px rgba(55, 103, 232, .08);
          outline: none;
        }

        .rcm-clear {
          position: absolute;
          top: 50%;
          right: 10px;
          display: grid;
          place-items: center;
          width: 32px;
          height: 32px;
          transform: translateY(-50%);
          border: 0;
          border-radius: 9px;
          background: #eaf0fa;
          color: #53637b;
          font-size: 21px;
        }

        .rcm-search-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 12px;
          color: var(--muted);
          font-size: 11px;
        }

        .rcm-live {
          display: inline-flex;
          align-items: center;
          gap: 7px;
        }

        .rcm-live-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--green);
        }

        .rcm-count {
          padding: 6px 10px;
          border: 1px solid #e1e9fb;
          border-radius: 20px;
          background: #f2f6ff;
          color: #3d5db6;
          font-size: 10px;
          font-weight: 850;
        }

        .rcm-results {
          margin-top: 24px;
          overflow: hidden;
          border: 1px solid var(--border);
          border-radius: 15px;
        }

        .rcm-results-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 15px 17px;
          border-bottom: 1px solid var(--border);
          background: #f8faff;
        }

        .rcm-results-title {
          color: var(--navy);
          font-size: 13px;
          font-weight: 850;
        }

        .rcm-results-subtitle {
          margin-top: 4px;
          color: var(--muted);
          font-size: 11px;
        }

        .rcm-result-list {
          display: grid;
        }

        .rcm-patient-row {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
          padding: 17px;
          border-bottom: 1px solid #edf1f6;
          background: white;
          transition: background .15s;
        }

        .rcm-patient-row:last-child {
          border-bottom: 0;
        }

        .rcm-patient-row:hover {
          background: #fbfcff;
        }

        .rcm-patient-avatar {
          display: grid;
          place-items: center;
          width: 46px;
          height: 46px;
          flex: 0 0 46px;
          border: 1px solid #dce6ff;
          border-radius: 14px;
          background: linear-gradient(145deg, #e6eeff, #f0eaff);
          color: #4058bc;
          font-size: 17px;
          font-weight: 900;
        }

        .rcm-patient-main {
          flex: 1;
          min-width: 0;
        }

        .rcm-patient-name {
          color: var(--navy);
          font-size: 13px;
          font-weight: 850;
          line-height: 1.5;
          overflow-wrap: anywhere;
        }

        .rcm-patient-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin-top: 8px;
        }

        .rcm-meta-chip {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 8px;
          border: 1px solid #e7ecf4;
          border-radius: 7px;
          background: #f8faff;
          color: #65748a;
          font-size: 10px;
          line-height: 1.4;
          overflow-wrap: anywhere;
        }

        .rcm-meta-chip strong {
          color: #43536b;
          font-weight: 800;
        }

        .rcm-patient-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .rcm-action-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          min-height: 37px;
          padding: 0 12px;
          border: 1px solid transparent;
          border-radius: 10px;
          font-size: 11px !important;
          font-weight: 850;
          white-space: nowrap;
          transition: background .15s, transform .15s;
        }

        .rcm-action-btn:hover {
          transform: translateY(-1px);
        }

        .rcm-btn-select {
          border-color: #2b61dd;
          background: var(--blue);
          color: white;
        }

        .rcm-btn-select:hover {
          background: var(--blue-dark);
        }

        .rcm-btn-open {
          border-color: #d8e3f2;
          background: white;
          color: #405571;
        }

        .rcm-btn-open:hover {
          border-color: #a9c4f5;
          background: #f0f5ff;
          color: #2f59b9;
        }

        .rcm-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 36px 20px;
          color: var(--muted);
          text-align: center;
        }

        .rcm-empty-icon {
          display: grid;
          place-items: center;
          width: 46px;
          height: 46px;
          border-radius: 14px;
          background: #f0f4fa;
          color: #71829c;
          font-size: 21px;
        }

        .rcm-empty strong {
          color: var(--navy);
          font-size: 13px;
        }

        .rcm-empty span {
          max-width: 360px;
          font-size: 11px;
          line-height: 1.7;
        }

        .rcm-error {
          display: flex;
          gap: 9px;
          margin-top: 16px;
          padding: 13px 14px;
          border: 1px solid #fecaca;
          border-radius: 11px;
          background: #fff1f2;
          color: #b42332;
          font-size: 12px;
          line-height: 1.6;
          overflow-wrap: anywhere;
        }

        .rcm-back-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 38px;
          margin-bottom: 16px;
          padding: 0 13px;
          border: 1px solid #d8e3f2;
          border-radius: 10px;
          background: white;
          color: #405571;
          font-size: 12px;
          font-weight: 800;
        }

        .rcm-back-button:hover {
          background: #f0f5ff;
          border-color: #a9c4f5;
        }

        @media (max-width: 760px) {
          .rcm-hero {
            padding: 22px;
          }

          .rcm-patient-row {
            align-items: flex-start;
            flex-wrap: wrap;
          }

          .rcm-patient-main {
            flex-basis: calc(100% - 62px);
          }

          .rcm-patient-actions {
            width: 100%;
            padding-left: 60px;
          }

          .rcm-patient-actions .rcm-action-btn {
            flex: 1;
          }
        }

        @media (max-width: 480px) {
          .rcm-hero {
            padding: 19px;
          }

          .rcm-hero-icon {
            display: none;
          }

          .rcm-section-head,
          .rcm-search-content {
            padding-right: 16px;
            padding-left: 16px;
          }

          .rcm-patient-actions {
            padding-left: 0;
          }

          .rcm-action-btn {
            padding: 0 9px;
            font-size: 10px !important;
          }

          .rcm-results-head {
            padding: 13px;
          }
        }
      `}</style>

      <header className="rcm-hero">
        <div>
          <div className="rcm-eyebrow">
            <span className="rcm-eyebrow-dot" />
            Revenue Cycle Management
          </div>
          <h1>Claims Management</h1>
          <p>
            Search patient records, open patient files, and create claims
            from one organized workspace.
          </p>
        </div>

        <div className="rcm-hero-icon" aria-hidden="true">
          $
        </div>
      </header>

      {!selectedPatient ? (
        <section className="rcm-workspace">
          <div className="rcm-section-head">
            <div className="rcm-section-icon" aria-hidden="true">
              ⌕
            </div>
            <div>
              <h2>Find a Patient</h2>
              <p>
                Search by patient name or file number. Each result has
                Select and Open File actions.
              </p>
            </div>
          </div>

          <div className="rcm-search-content">
            <label
              className="rcm-search-label"
              htmlFor="rcm-patient-search"
            >
              Patient search
            </label>

            <div className="rcm-search-wrap">
              <span className="rcm-search-symbol" aria-hidden="true">
                ⌕
              </span>

              <input
                id="rcm-patient-search"
                className="rcm-search-input"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setError("");
                }}
                placeholder="Start typing a patient name or file number..."
                autoComplete="off"
              />

              {search && (
                <button
                  type="button"
                  className="rcm-clear"
                  onClick={clearSearch}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>

            <div className="rcm-search-footer">
              <span className="rcm-live">
                <span className="rcm-live-dot" />
                Results update automatically as you type
              </span>

              {search.trim() && (
                <span className="rcm-count">
                  {loading ? "Searching..." : `${patients.length} result(s)`}
                </span>
              )}
            </div>

            {error && (
              <div className="rcm-error" role="alert">
                <span aria-hidden="true">!</span>
                <span>{error}</span>
              </div>
            )}

            {/* The ONLY patient results list. No second dropdown. */}
            {search.trim() && (
              <div className="rcm-results">
                <div className="rcm-results-head">
                  <div>
                    <div className="rcm-results-title">
                      Patient Search Results
                    </div>
                    <div className="rcm-results-subtitle">
                      Select a patient to create a claim or open their file.
                    </div>
                  </div>

                  <span className="rcm-count">
                    {loading ? "Loading..." : `${patients.length} patient(s)`}
                  </span>
                </div>

                {loading ? (
                  <div className="rcm-empty">
                    <strong>Searching patients...</strong>
                    <span>Please wait while matching records are retrieved.</span>
                  </div>
                ) : patients.length === 0 ? (
                  <div className="rcm-empty">
                    <div className="rcm-empty-icon" aria-hidden="true">
                      ⌕
                    </div>
                    <strong>No patients found</strong>
                    <span>
                      Try another patient name, file number, or record ID.
                    </span>
                  </div>
                ) : (
                  <div className="rcm-result-list">
                    {patients.map((patient) => (
                      <article
                        key={patient.id}
                        className="rcm-patient-row"
                      >
                        <div
                          className="rcm-patient-avatar"
                          aria-hidden="true"
                        >
                          {patientName(patient).charAt(0).toUpperCase()}
                        </div>

                        <div className="rcm-patient-main">
                          <div className="rcm-patient-name">
                            {patientName(patient)}
                          </div>

                          <div className="rcm-patient-meta">
                            <span className="rcm-meta-chip">
                              <strong>File:</strong>
                              {patientFileNumber(patient)}
                            </span>

                            <span className="rcm-meta-chip">
                              <strong>Approval:</strong>
                              {patientApproval(patient)}
                            </span>
                          </div>
                        </div>

                        <div className="rcm-patient-actions">
                          <button
                            type="button"
                            className="rcm-action-btn rcm-btn-select"
                            onClick={() => selectPatient(patient)}
                          >
                            + Select
                          </button>

                          <button
                            type="button"
                            className="rcm-action-btn rcm-btn-open"
                            onClick={() => openPatientFile(patient)}
                          >
                            ↗ Open File
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      ) : (
        <section className="rcm-claim-container">
          <button
            type="button"
            className="rcm-back-button"
            onClick={returnToSearch}
          >
            ← Back to Patient Search
          </button>

          <CreateClaim
            key={selectedPatient.id}
            patient={selectedPatient}
            onClose={returnToSearch}
          />
        </section>
      )}
    </main>
  );
}
