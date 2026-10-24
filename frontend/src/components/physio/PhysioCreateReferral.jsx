import React, { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../api/api";

function getPatientId(patient) {
  return patient?.id ?? patient?.patient_id ?? patient?.pk ?? "";
}

function getPatientName(patient) {
  return String(
    patient?.full_name ??
      patient?.patient_name ??
      patient?.name ??
      patient?.display_name ??
      ""
  ).trim();
}

function getPatientFileNumber(patient) {
  return String(
    patient?.patient_file_id ??
      patient?.patient_id ??
      patient?.file_number ??
      patient?.mrn ??
      ""
  ).trim();
}

function getPhysicianId(physician) {
  return (
    physician?.user_id ??
    physician?.id ??
    physician?.pk ??
    physician?.physician_id ??
    ""
  );
}

function getPhysicianName(physician) {
  if (typeof physician === "string") {
    return physician.trim();
  }

  return String(
    physician?.name ??
      physician?.display_name ??
      physician?.full_name ??
      physician?.username ??
      ""
  ).trim();
}

function extractPhysicianList(data) {
  if (Array.isArray(data)) return data;

  for (const key of ["physicians", "doctors", "users", "results", "data"]) {
    if (Array.isArray(data?.[key])) return data[key];
  }

  return [];
}

function normalizePhysicians(list) {
  const byId = new Map();

  for (const item of Array.isArray(list) ? list : []) {
    const name = getPhysicianName(item);
    const id = getPhysicianId(item);

    if (!name || id === "" || id === null) continue;

    const key = String(id);

    if (!byId.has(key)) {
      byId.set(key, {
        id: key,
        name,
        username: item?.username ?? "",
      });
    }
  }

  return Array.from(byId.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

function getErrorMessage(error) {
  const status = error?.response?.status;
  const data = error?.response?.data;

  if (status === 401) {
    return "Your session has expired. Please sign in again.";
  }

  if (status === 403) {
    return "You do not have permission to access the physician list.";
  }

  if (status === 404) {
    return "The users/physicians/ endpoint could not be found.";
  }

  if (data && typeof data === "object") {
    return (
      data.detail ||
      data.error ||
      data.message ||
      "Unable to complete the request."
    );
  }

  return error?.message || "Unable to complete the request.";
}

export default function PhysioCreateReferral({
  patients = [],
  physicians: parentPhysicians = [],
  loading = false,
  saving = false,
  error = "",
  success = "",
  onCreateReferral,
  onCancel,
}) {
  const [patientId, setPatientId] = useState("");
  const [physicianId, setPhysicianId] = useState("");
  const [reason, setReason] = useState("");

  const [patientSearch, setPatientSearch] = useState("");
  const [physicianSearch, setPhysicianSearch] = useState("");

  const [patientMenuOpen, setPatientMenuOpen] = useState(false);
  const [physicianMenuOpen, setPhysicianMenuOpen] = useState(false);

  const [fetchedPhysicians, setFetchedPhysicians] = useState([]);
  const [physiciansLoading, setPhysiciansLoading] = useState(false);
  const [physiciansError, setPhysiciansError] = useState("");
  const [physicianRetry, setPhysicianRetry] = useState(0);

  const isBusy = Boolean(loading || saving);

  // Reuse the same physician endpoint as Patient Assignment.
  useEffect(() => {
    let cancelled = false;

    async function loadPhysicians() {
      setPhysiciansLoading(true);
      setPhysiciansError("");

      try {
        const response = await api.get("users/physicians/");

        if (cancelled) return;

        const list = normalizePhysicians(
          extractPhysicianList(response.data)
        );

        setFetchedPhysicians(list);

        if (list.length === 0) {
          setPhysiciansError(
            "No physicians with usable user IDs were returned by the server."
          );
        }
      } catch (requestError) {
        if (cancelled) return;

        console.error(
          "Failed to load physicians:",
          requestError?.response?.status,
          requestError?.response?.data || requestError
        );

        setPhysiciansError(getErrorMessage(requestError));
      } finally {
        if (!cancelled) setPhysiciansLoading(false);
      }
    }

    loadPhysicians();

    return () => {
      cancelled = true;
    };
  }, [physicianRetry]);

  const availablePhysicians = useMemo(() => {
    // The endpoint is the primary source. Parent data is a fallback
    // only when it contains physician user IDs.
    const source =
      fetchedPhysicians.length > 0
        ? fetchedPhysicians
        : parentPhysicians;

    return normalizePhysicians(source);
  }, [fetchedPhysicians, parentPhysicians]);

  const selectedPatient = useMemo(
    () =>
      patients.find(
        (patient) => String(getPatientId(patient)) === String(patientId)
      ),
    [patients, patientId]
  );

  const selectedPhysician = useMemo(
    () =>
      availablePhysicians.find(
        (physician) => String(physician.id) === String(physicianId)
      ),
    [availablePhysicians, physicianId]
  );

  const filteredPatients = useMemo(() => {
    const query = patientSearch.trim().toLowerCase();

    return patients.filter((patient) => {
      const name = getPatientName(patient).toLowerCase();
      const fileNumber = getPatientFileNumber(patient).toLowerCase();

      return name.includes(query) || fileNumber.includes(query);
    });
  }, [patients, patientSearch]);

  const filteredPhysicians = useMemo(() => {
    const query = physicianSearch.trim().toLowerCase();

    return availablePhysicians.filter((physician) =>
      physician.name.toLowerCase().includes(query)
    );
  }, [availablePhysicians, physicianSearch]);

  const choosePatient = useCallback((patient) => {
    setPatientId(String(getPatientId(patient)));
    setPatientSearch("");
    setPatientMenuOpen(false);
  }, []);

  const choosePhysician = useCallback((physician) => {
    setPhysicianId(String(physician.id));
    setPhysicianSearch("");
    setPhysicianMenuOpen(false);
  }, []);

  const retryPhysicianFetch = useCallback(() => {
    setPhysiciansError("");
    setPhysicianRetry((previous) => previous + 1);
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isBusy) return;

    if (!selectedPatient || !patientId) {
      alert("Please select a patient.");
      return;
    }

    if (!selectedPhysician || !physicianId) {
      alert("Please select a physician.");
      return;
    }

    if (!reason.trim()) {
      alert("Please enter the referral reason.");
      return;
    }

    if (typeof onCreateReferral !== "function") {
      console.error("onCreateReferral callback is missing.");
      alert("The referral save handler is not configured.");
      return;
    }

    // The physician value is the selected physician USER ID.
    // The parent keeps responsibility for sending the API request.
    await onCreateReferral({
      patient: patientId,
      physician: physicianId,
      reason: reason.trim(),
    });
  };

  const styles = {
    card: {
      width: "100%",
      boxSizing: "border-box",
      padding: "24px",
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: "16px",
      boxShadow: "0 6px 20px rgba(15, 23, 42, 0.06)",
      color: "#1f2937",
    },
    heading: {
      margin: "0 0 6px",
      color: "#142d4e",
      fontSize: "22px",
      fontWeight: 750,
    },
    subtitle: {
      margin: "0 0 22px",
      color: "#64748b",
      fontSize: "13px",
      lineHeight: 1.5,
    },
    field: {
      display: "flex",
      flexDirection: "column",
      gap: "7px",
      marginBottom: "18px",
      minWidth: 0,
    },
    label: {
      color: "#334155",
      fontSize: "13px",
      fontWeight: 700,
    },
    input: {
      width: "100%",
      boxSizing: "border-box",
      padding: "12px 13px",
      border: "1px solid #cbd5e1",
      borderRadius: "9px",
      background: "#fff",
      color: "#1e293b",
      fontSize: "14px",
      outlineColor: "#2563eb",
    },
    textarea: {
      width: "100%",
      boxSizing: "border-box",
      padding: "12px 13px",
      border: "1px solid #cbd5e1",
      borderRadius: "9px",
      background: "#fff",
      color: "#1e293b",
      fontSize: "14px",
      resize: "vertical",
      fontFamily: "inherit",
      outlineColor: "#2563eb",
    },
    autocomplete: {
      position: "relative",
      width: "100%",
    },
    dropdown: {
      position: "absolute",
      top: "calc(100% + 4px)",
      left: 0,
      right: 0,
      zIndex: 20,
      maxHeight: "220px",
      overflowY: "auto",
      background: "#fff",
      border: "1px solid #cbd5e1",
      borderRadius: "9px",
      boxShadow: "0 8px 20px rgba(15, 23, 42, 0.12)",
    },
    option: {
      display: "block",
      width: "100%",
      boxSizing: "border-box",
      padding: "11px 13px",
      border: "none",
      borderBottom: "1px solid #f1f5f9",
      background: "#fff",
      color: "#334155",
      fontSize: "13px",
      textAlign: "left",
      cursor: "pointer",
    },
    selected: {
      padding: "12px 13px",
      border: "1px solid #bfdbfe",
      borderRadius: "9px",
      background: "#eff6ff",
      color: "#1d4ed8",
      fontSize: "14px",
    },
    hint: {
      margin: 0,
      color: "#64748b",
      fontSize: "12px",
      lineHeight: 1.5,
    },
    error: {
      padding: "11px 12px",
      border: "1px solid #fecaca",
      borderRadius: "8px",
      background: "#fef2f2",
      color: "#b91c1c",
      fontSize: "13px",
      lineHeight: 1.5,
    },
    success: {
      padding: "11px 12px",
      border: "1px solid #bbf7d0",
      borderRadius: "8px",
      background: "#f0fdf4",
      color: "#166534",
      fontSize: "13px",
    },
    actions: {
      display: "flex",
      flexWrap: "wrap",
      gap: "10px",
      marginTop: "22px",
    },
    submit: {
      padding: "12px 20px",
      border: "1px solid #1d4ed8",
      borderRadius: "9px",
      background: isBusy ? "#93c5fd" : "#2563eb",
      color: "#fff",
      fontSize: "14px",
      fontWeight: 700,
      cursor: isBusy ? "not-allowed" : "pointer",
    },
    cancel: {
      padding: "12px 18px",
      border: "1px solid #cbd5e1",
      borderRadius: "9px",
      background: "#fff",
      color: "#475569",
      fontSize: "14px",
      fontWeight: 650,
      cursor: "pointer",
    },
  };

  return (
    <form style={styles.card} onSubmit={handleSubmit}>
      <h3 style={styles.heading}>Create Physiotherapy Referral</h3>

      <p style={styles.subtitle}>
        Select a patient and referring physician, then enter the referral
        reason.
      </p>

      {error && (
        <div style={{ ...styles.error, marginBottom: "16px" }} role="alert">
          {typeof error === "string" ? error : "Unable to save the referral."}
        </div>
      )}

      {success && (
        <div
          style={{ ...styles.success, marginBottom: "16px" }}
          role="status"
        >
          {typeof success === "string" ? success : "Referral saved successfully."}
        </div>
      )}

      <div style={styles.field}>
        <label style={styles.label} htmlFor="referral-patient-search">
          Patient *
        </label>

        {selectedPatient ? (
          <div style={styles.selected}>
            <strong>{getPatientName(selectedPatient) || "Selected patient"}</strong>

            {getPatientFileNumber(selectedPatient) && (
              <span> — File No: {getPatientFileNumber(selectedPatient)}</span>
            )}

            <button
              type="button"
              onClick={() => {
                setPatientId("");
                setPatientSearch("");
                setPatientMenuOpen(true);
              }}
              style={{
                marginLeft: "10px",
                border: "none",
                background: "transparent",
                color: "#1d4ed8",
                cursor: "pointer",
                fontWeight: 700,
              }}
              disabled={isBusy}
            >
              Change
            </button>
          </div>
        ) : (
          <div style={styles.autocomplete}>
            <input
              id="referral-patient-search"
              style={styles.input}
              value={patientSearch}
              onFocus={() => setPatientMenuOpen(true)}
              onChange={(event) => {
                setPatientSearch(event.target.value);
                setPatientMenuOpen(true);
              }}
              placeholder="Search patient by name or file number..."
              autoComplete="off"
              disabled={isBusy}
            />

            {patientMenuOpen && (
              <div style={styles.dropdown}>
                {filteredPatients.length ? (
                  filteredPatients.map((patient) => {
                    const id = getPatientId(patient);
                    const name = getPatientName(patient);

                    return (
                      <button
                        type="button"
                        key={String(id)}
                        style={styles.option}
                        onClick={() => choosePatient(patient)}
                        disabled={isBusy}
                      >
                        <strong>{name || `Patient ${id}`}</strong>
                        {getPatientFileNumber(patient) && (
                          <span>
                            {" "}
                            — File No: {getPatientFileNumber(patient)}
                          </span>
                        )}
                      </button>
                    );
                  })
                ) : (
                  <p style={{ padding: "12px", ...styles.hint }}>
                    No matching patients found.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {!selectedPatient && patients.length === 0 && (
          <p style={styles.hint}>No patients are available to select.</p>
        )}
      </div>

      <div style={styles.field}>
        <label style={styles.label} htmlFor="referral-physician-search">
          Referring Physician *
        </label>

        {selectedPhysician ? (
          <div style={styles.selected}>
            <strong>{selectedPhysician.name}</strong>

            <button
              type="button"
              onClick={() => {
                setPhysicianId("");
                setPhysicianSearch("");
                setPhysicianMenuOpen(true);
              }}
              style={{
                marginLeft: "10px",
                border: "none",
                background: "transparent",
                color: "#1d4ed8",
                cursor: "pointer",
                fontWeight: 700,
              }}
              disabled={isBusy}
            >
              Change
            </button>
          </div>
        ) : (
          <div style={styles.autocomplete}>
            <input
              id="referral-physician-search"
              style={styles.input}
              value={physicianSearch}
              onFocus={() => setPhysicianMenuOpen(true)}
              onChange={(event) => {
                setPhysicianSearch(event.target.value);
                setPhysicianMenuOpen(true);
              }}
              placeholder="Search physician..."
              autoComplete="off"
              disabled={isBusy || physiciansLoading}
            />

            {physicianMenuOpen && !physiciansLoading && (
              <div style={styles.dropdown}>
                {filteredPhysicians.length ? (
                  filteredPhysicians.map((physician) => (
                    <button
                      type="button"
                      key={physician.id}
                      style={styles.option}
                      onClick={() => choosePhysician(physician)}
                      disabled={isBusy}
                    >
                      {physician.name}
                    </button>
                  ))
                ) : (
                  <p style={{ padding: "12px", ...styles.hint }}>
                    No matching physicians found.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {physiciansLoading && (
          <p style={styles.hint} role="status">
            Loading physicians...
          </p>
        )}

        {!physiciansLoading && physiciansError && (
          <div style={styles.error} role="alert">
            <p style={{ margin: "0 0 8px" }}>{physiciansError}</p>
            <button
              type="button"
              onClick={retryPhysicianFetch}
              disabled={isBusy}
              style={styles.cancel}
            >
              Retry loading physicians
            </button>
          </div>
        )}
      </div>

      <div style={styles.field}>
        <label style={styles.label} htmlFor="referral-reason">
          Referral Reason *
        </label>

        <textarea
          id="referral-reason"
          style={styles.textarea}
          rows={4}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Enter the reason for physiotherapy referral..."
          required
          disabled={isBusy}
        />
      </div>

      <div style={styles.actions}>
        <button
          type="submit"
          style={styles.submit}
          disabled={
            isBusy ||
            physiciansLoading ||
            !patientId ||
            !physicianId ||
            !reason.trim()
          }
        >
          {saving ? "Saving referral..." : "Create Referral"}
        </button>

        {typeof onCancel === "function" && (
          <button
            type="button"
            style={styles.cancel}
            onClick={onCancel}
            disabled={isBusy}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}