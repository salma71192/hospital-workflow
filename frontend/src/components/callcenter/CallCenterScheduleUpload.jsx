
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/* =========================================================
   THERAPIST DAILY SCHEDULE
   Concepts screenshot upload and confirmation
========================================================= */

const API_BASE = "/api/physio/schedule";

const STATUS_OPTIONS = [
  { value: "confirmed", label: "Confirmed" },
  { value: "unconfirmed", label: "Unconfirmed" },
  { value: "cancelled", label: "Cancelled" },
];

const TYPE_OPTIONS = [
  { value: "follow_up", label: "Follow-up" },
  { value: "evaluation", label: "Evaluation" },
  { value: "other", label: "Other" },
];

const CSS = `
.tds {
  color: #334155;
  width: 100%;
  min-width: 0;
}
.tds * { box-sizing: border-box; }
.tds-panel {
  padding: 22px;
  margin-bottom: 20px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
}
.tds-heading {
  margin: 0 0 7px;
  color: #172b4d;
  font-size: 19px;
  font-weight: 800;
}
.tds-description {
  margin: 0 0 20px;
  color: #64748b;
  font-size: 13px;
  line-height: 1.6;
}
.tds-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0,1fr));
  gap: 16px;
}
.tds-field {
  display: flex;
  flex-direction: column;
  gap: 7px;
  min-width: 0;
}
.tds-label {
  font-size: 13px;
  font-weight: 700;
  color: #475569;
}
.tds-input {
  width: 100%;
  min-height: 42px;
  padding: 10px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 9px;
  background: #fff;
  color: #172b4d;
  font: inherit;
  font-size: 13px;
}
.tds-input:focus {
  outline: 2px solid #bfdbfe;
  border-color: #2563eb;
}
.tds-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 30px 20px;
  border: 2px dashed #cbd5e1;
  border-radius: 14px;
  background: #f8fafc;
  text-align: center;
}
.tds-upload-icon { font-size: 35px; }
.tds-upload-title {
  font-size: 15px;
  font-weight: 800;
  color: #172b4d;
}
.tds-upload-text {
  font-size: 12px;
  color: #64748b;
}
.tds-preview {
  display: block;
  width: 100%;
  max-height: 420px;
  margin-top: 16px;
  object-fit: contain;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #f8fafc;
}
.tds-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 16px;
}
.tds-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 42px;
  padding: 10px 16px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  background: #fff;
  color: #334155;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
}
.tds-button:hover:not(:disabled) {
  background: #f8fafc;
}
.tds-button:disabled {
  opacity: .55;
  cursor: not-allowed;
}
.tds-primary {
  background: #be185d;
  border-color: #be185d;
  color: white;
}
.tds-primary:hover:not(:disabled) {
  background: #9d174d;
}
.tds-blue {
  background: #2563eb;
  border-color: #2563eb;
  color: white;
}
.tds-blue:hover:not(:disabled) {
  background: #1d4ed8;
}
.tds-message {
  padding: 13px 15px;
  margin-bottom: 18px;
  border-radius: 10px;
  font-size: 13px;
  line-height: 1.6;
}
.tds-success {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #166534;
}
.tds-error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
}
.tds-info {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1e40af;
}
.tds-summary {
  display: grid;
  grid-template-columns: repeat(4,minmax(0,1fr));
  gap: 12px;
  margin-bottom: 20px;
}
.tds-stat {
  padding: 17px;
  border: 1px solid #e2e8f0;
  border-radius: 13px;
  background: #fff;
}
.tds-stat-label {
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
}
.tds-stat-value {
  margin-top: 7px;
  color: #172b4d;
  font-size: 27px;
  font-weight: 800;
}
.tds-table-wrap {
  width: 100%;
  overflow-x: auto;
}
.tds-table {
  width: 100%;
  min-width: 850px;
  border-collapse: collapse;
}
.tds-table th {
  padding: 12px;
  background: #f8fafc;
  color: #475569;
  text-align: left;
  font-size: 12px;
  font-weight: 800;
}
.tds-table td {
  padding: 12px;
  border-top: 1px solid #e2e8f0;
  vertical-align: top;
}
.tds-table .tds-input {
  min-width: 115px;
}
.tds-patient-input {
  min-width: 170px !important;
}
.tds-match {
  margin-top: 6px;
  color: #15803d;
  font-size: 11px;
}
.tds-unmatched {
  margin-top: 6px;
  color: #c2410c;
  font-size: 11px;
}
.tds-results {
  max-height: 160px;
  overflow-y: auto;
  margin-top: 6px;
  border: 1px solid #e2e8f0;
  border-radius: 9px;
  background: white;
}
.tds-result {
  display: block;
  width: 100%;
  padding: 10px;
  border: 0;
  border-bottom: 1px solid #f1f5f9;
  background: white;
  color: #334155;
  text-align: left;
  font-size: 12px;
  cursor: pointer;
}
.tds-result:hover { background: #eff6ff; }
.tds-remove {
  border: 0;
  background: transparent;
  color: #dc2626;
  font-weight: 800;
  cursor: pointer;
}
.tds-empty {
  padding: 30px;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  color: #64748b;
  text-align: center;
  font-size: 13px;
}
.tds-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 20px;
}
@media(max-width:750px) {
  .tds-grid { grid-template-columns: 1fr; }
  .tds-summary {
    grid-template-columns: repeat(2,minmax(0,1fr));
  }
  .tds-panel { padding: 16px; }
}
`;

/* =========================================================
   HELPERS
========================================================= */

function todayISO() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function createAppointment(data = {}) {
  return {
    localId:
      `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    time:
      data.time ||
      data.appointment_time ||
      data.start_time ||
      "",
    patient_name:
      data.patient_name ||
      data.patientName ||
      "",
    patient_id:
      data.patient_id ||
      data.patient?.id ||
      null,
    confirmation_status:
      data.confirmation_status ||
      data.status ||
      "unconfirmed",
    appointment_type:
      data.appointment_type ||
      data.type ||
      "follow_up",
  };
}

function patientName(patient) {
  return (
    patient.full_name ||
    patient.patient_name ||
    patient.name ||
    [
      patient.first_name,
      patient.last_name,
    ].filter(Boolean).join(" ") ||
    `Patient ${patient.id}`
  );
}

function asArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.patients)) return data.patients;
  if (Array.isArray(data?.appointments)) return data.appointments;
  if (Array.isArray(data?.therapists)) return data.therapists;
  return [];
}

function normalizeStatus(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  if (
    normalized === "confirmed" ||
    normalized === "unconfirmed" ||
    normalized === "cancelled"
  ) {
    return normalized;
  }

  return "unconfirmed";
}

function normalizeType(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  if (
    normalized === "evaluation" ||
    normalized === "follow_up" ||
    normalized === "other"
  ) {
    return normalized;
  }

  return "follow_up";
}

function normalizeAppointment(data) {
  return createAppointment({
    ...data,
    confirmation_status: normalizeStatus(
      data.confirmation_status || data.status
    ),
    appointment_type: normalizeType(
      data.appointment_type || data.type
    ),
  });
}

function getCookie(name) {
  const cookie = document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${name}=`));

  return cookie
    ? decodeURIComponent(cookie.split("=").slice(1).join("="))
    : "";
}

async function apiRequest(path, options = {}) {
  const {
    method = "GET",
    body,
    signal,
  } = options;

  const headers = {
    Accept: "application/json",
  };

  if (body && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const csrfToken = getCookie("csrftoken");

  if (csrfToken) {
    headers["X-CSRFToken"] = csrfToken;
  }

  const response = await fetch(
    `${API_BASE}${path}`,
    {
      method,
      credentials: "include",
      headers,
      body:
        body instanceof FormData
          ? body
          : body
          ? JSON.stringify(body)
          : undefined,
      signal,
    }
  );

  const contentType =
    response.headers.get("content-type") || "";

  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const error = new Error(
      typeof data === "object"
        ? data.detail ||
          data.error ||
          data.message ||
          `Request failed (${response.status})`
        : `Request failed (${response.status})`
    );

    error.status = response.status;
    throw error;
  }

  return data;
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function CallCenterScheduleUpload({
  therapists = [],
}) {
  const fileInputRef = useRef(null);
  const searchTimerRef = useRef(null);
  const searchControllerRef = useRef(null);

  const [therapistList, setTherapistList] =
    useState(Array.isArray(therapists) ? therapists : []);

  const [selectedTherapist, setSelectedTherapist] =
    useState("");

  const [selectedDate, setSelectedDate] =
    useState(todayISO());

  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const [appointments, setAppointments] =
    useState([]);

  const [searchResults, setSearchResults] =
    useState({});

  const [activeSearch, setActiveSearch] =
    useState(null);

  const [searchLoading, setSearchLoading] =
    useState(false);

  const [extracting, setExtracting] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [loadingTherapists, setLoadingTherapists] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  /* =========================================================
     THERAPISTS
  ========================================================= */

  useEffect(() => {
    if (Array.isArray(therapists) && therapists.length) {
      setTherapistList(therapists);
    }
  }, [therapists]);

  useEffect(() => {
    let mounted = true;

    async function loadTherapists() {
      setLoadingTherapists(true);

      try {
        const data = await apiRequest("/therapists/");

        if (mounted) {
          const results = asArray(data);

          if (results.length) {
            setTherapistList(results);
          }
        }
      } catch (err) {
        console.warn(
          "Schedule therapist lookup failed:",
          err
        );
      } finally {
        if (mounted) {
          setLoadingTherapists(false);
        }
      }
    }

    loadTherapists();

    return () => {
      mounted = false;
    };
  }, []);

  const therapistOptions = useMemo(() => {
    return therapistList
      .map((therapist) => {
        const username =
          therapist.username ||
          therapist.user?.username ||
          "";

        const id =
          therapist.id ??
          therapist.user?.id ??
          "";

        const name =
          therapist.name ||
          therapist.full_name ||
          [
            therapist.first_name,
            therapist.last_name,
          ].filter(Boolean).join(" ") ||
          username;

        return {
          id,
          username,
          name,
        };
      })
      .filter((therapist) => therapist.username);
  }, [therapistList]);

  /* =========================================================
     SCREENSHOT PREVIEW
  ========================================================= */

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl("");
      return undefined;
    }

    const url = URL.createObjectURL(imageFile);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  useEffect(() => {
    return () => {
      clearTimeout(searchTimerRef.current);
      searchControllerRef.current?.abort();
    };
  }, []);

  function handleFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (
      !file.type.startsWith("image/")
    ) {
      setError("Please select an image file.");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setError("Maximum screenshot size is 15 MB.");
      return;
    }

    setImageFile(file);
    setError("");
    setMessage("");
  }

  function clearScreenshot() {
    setImageFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  /* =========================================================
     APPOINTMENT EDITING
  ========================================================= */

  function addAppointment() {
    setAppointments((previous) => [
      ...previous,
      createAppointment(),
    ]);

    setError("");
    setMessage("");
  }

  function updateAppointment(localId, field, value) {
    setAppointments((previous) =>
      previous.map((appointment) => {
        if (appointment.localId !== localId) {
          return appointment;
        }

        const next = {
          ...appointment,
          [field]: value,
        };

        if (field === "patient_name") {
          next.patient_id = null;
        }

        return next;
      })
    );
  }

  function removeAppointment(localId) {
    setAppointments((previous) =>
      previous.filter(
        (appointment) =>
          appointment.localId !== localId
      )
    );

    setSearchResults((previous) => {
      const next = { ...previous };
      delete next[localId];
      return next;
    });

    if (activeSearch === localId) {
      setActiveSearch(null);
    }
  }

  /* =========================================================
     PATIENT SEARCH
  ========================================================= */

  async function searchPatients(localId, query) {
    clearTimeout(searchTimerRef.current);
    searchControllerRef.current?.abort();

    if (query.trim().length < 2) {
      setSearchResults((previous) => ({
        ...previous,
        [localId]: [],
      }));

      setActiveSearch(null);
      setSearchLoading(false);
      return;
    }

    setActiveSearch(localId);

    searchTimerRef.current = setTimeout(async () => {
      const controller = new AbortController();
      searchControllerRef.current = controller;
      setSearchLoading(true);

      try {
        const params = new URLSearchParams({
          search: query.trim(),
        });

        const data = await apiRequest(
          `/patients/?${params.toString()}`,
          { signal: controller.signal }
        );

        if (!controller.signal.aborted) {
          setSearchResults((previous) => ({
            ...previous,
            [localId]: asArray(data),
          }));
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Patient search error:", err);
          setError(
            "Unable to search patient records."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setSearchLoading(false);
        }
      }
    }, 350);
  }

  function selectPatient(localId, patient) {
    setAppointments((previous) =>
      previous.map((appointment) =>
        appointment.localId === localId
          ? {
              ...appointment,
              patient_id: patient.id,
              patient_name: patientName(patient),
            }
          : appointment
      )
    );

    setActiveSearch(null);
    setSearchResults((previous) => ({
      ...previous,
      [localId]: [],
    }));
  }

  /* =========================================================
     SCREENSHOT EXTRACTION
  ========================================================= */

  async function extractScreenshot() {
    if (!selectedTherapist) {
      setError("Please select a therapist first.");
      return;
    }

    if (!selectedDate) {
      setError("Please select the schedule date.");
      return;
    }

    if (!imageFile) {
      setError("Please upload a Concepts screenshot.");
      return;
    }

    setExtracting(true);
    setError("");
    setMessage("");

    try {
      const formData = new FormData();

      formData.append("image", imageFile);
      formData.append(
        "therapist",
        selectedTherapist
      );
      formData.append("date", selectedDate);

      const data = await apiRequest("/extract/", {
        method: "POST",
        body: formData,
      });

      const extracted = asArray(data).map(
        normalizeAppointment
      );

      if (!extracted.length) {
        setMessage(
          "No appointments were extracted. You can enter them manually."
        );
        return;
      }

      setAppointments((previous) => [
        ...previous,
        ...extracted,
      ]);

      setMessage(
        `${extracted.length} appointments extracted. Review every appointment before publishing.`
      );
    } catch (err) {
      if (err.status === 501) {
        setMessage(
          "Automatic screenshot extraction is not implemented yet. Keep the screenshot for reference and add appointments manually."
        );
      } else {
        setError(
          `Screenshot extraction failed: ${err.message}`
        );
      }
    } finally {
      setExtracting(false);
    }
  }

  /* =========================================================
     VALIDATION
  ========================================================= */

  function validateAppointments() {
    if (!selectedTherapist) {
      return "Please select a therapist.";
    }

    if (!selectedDate) {
      return "Please select an appointment date.";
    }

    if (!appointments.length) {
      return "Please add at least one appointment.";
    }

    for (let index = 0; index < appointments.length; index++) {
      const appointment = appointments[index];

      if (!appointment.time) {
        return `Appointment ${index + 1}: time is required.`;
      }

      if (
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(
          appointment.time
        )
      ) {
        return `Appointment ${index + 1}: enter time as HH:MM.`;
      }

      if (!appointment.patient_name.trim()) {
        return `Appointment ${index + 1}: patient name is required.`;
      }
    }

    return "";
  }

  /* =========================================================
     SAVE SCHEDULE
  ========================================================= */

  async function saveSchedule() {
    const validationError =
      validateAppointments();

    if (validationError) {
      setError(validationError);
      return;
    }

    const confirmed = appointments.filter(
      (appointment) =>
        appointment.confirmation_status === "confirmed"
    ).length;

    const unmatched = appointments.filter(
      (appointment) => !appointment.patient_id
    ).length;

    const warning =
      `Publish ${appointments.length} appointments for ` +
      `${selectedTherapist} on ${selectedDate}?\n\n` +
      `${confirmed} confirmed.\n` +
      `${unmatched} without a matched patient record.\n\n` +
      "Saving may replace the existing schedule for this therapist and date.";

    if (!window.confirm(warning)) {
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const payload = {
        therapist: selectedTherapist,
        date: selectedDate,
        appointments: appointments.map(
          (appointment) => ({
            time: appointment.time,
            patient_id:
              appointment.patient_id || null,
            patient_name:
              appointment.patient_name.trim(),
            confirmation_status:
              appointment.confirmation_status,
            appointment_type:
              appointment.appointment_type,
          })
        ),
      };

      await apiRequest("/save/", {
        method: "POST",
        body: payload,
      });

      setMessage(
        "Therapist daily schedule published successfully."
      );
    } catch (err) {
      setError(
        `Unable to publish schedule: ${err.message}`
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     SUMMARY
  ========================================================= */

  const summary = useMemo(() => {
    return {
      total: appointments.length,
      confirmed: appointments.filter(
        (item) =>
          item.confirmation_status === "confirmed"
      ).length,
      unconfirmed: appointments.filter(
        (item) =>
          item.confirmation_status === "unconfirmed"
      ).length,
      cancelled: appointments.filter(
        (item) =>
          item.confirmation_status === "cancelled"
      ).length,
    };
  }, [appointments]);

  const selectedTherapistName =
    therapistOptions.find(
      (therapist) =>
        therapist.username === selectedTherapist
    )?.name || selectedTherapist;

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="tds">
      <style>{CSS}</style>

      {error && (
        <div className="tds-message tds-error" role="alert">
          {error}
        </div>
      )}

      {message && (
        <div className="tds-message tds-info" role="status">
          {message}
        </div>
      )}

      {/* THERAPIST AND DATE */}

      <section className="tds-panel">
        <h2 className="tds-heading">
          Therapist Daily Schedule
        </h2>

        <p className="tds-description">
          Select the therapist and date before uploading
          the daily Concepts schedule.
        </p>

        <div className="tds-grid">
          <div className="tds-field">
            <label
              className="tds-label"
              htmlFor="tds-therapist"
            >
              Physiotherapist
            </label>

            <select
              id="tds-therapist"
              className="tds-input"
              value={selectedTherapist}
              onChange={(event) => {
                setSelectedTherapist(
                  event.target.value
                );
                setAppointments([]);
                setError("");
                setMessage("");
              }}
            >
              <option value="">
                Select therapist
              </option>

              {therapistOptions.map(
                (therapist) => (
                  <option
                    key={
                      therapist.id ||
                      therapist.username
                    }
                    value={therapist.username}
                  >
                    {therapist.name}
                  </option>
                )
              )}
            </select>

            {loadingTherapists && (
              <small>Loading therapists...</small>
            )}
          </div>

          <div className="tds-field">
            <label
              className="tds-label"
              htmlFor="tds-date"
            >
              Appointment Date
            </label>

            <input
              id="tds-date"
              type="date"
              className="tds-input"
              value={selectedDate}
              onChange={(event) => {
                setSelectedDate(event.target.value);
                setAppointments([]);
                setError("");
                setMessage("");
              }}
            />
          </div>
        </div>
      </section>

      {/* SCREENSHOT UPLOAD */}

      <section className="tds-panel">
        <h2 className="tds-heading">
          Concepts Screenshot
        </h2>

        <p className="tds-description">
          Upload an image of the therapist's daily
          schedule from Concepts.
        </p>

        <div className="tds-upload">
          <div className="tds-upload-icon">
            🖼️
          </div>

          <div className="tds-upload-title">
            Upload daily schedule screenshot
          </div>

          <div className="tds-upload-text">
            PNG, JPG, or other supported image
            format. Maximum 15 MB.
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: "none" }}
            aria-label="Concepts schedule screenshot"
          />

          <button
            type="button"
            className="tds-button tds-blue"
            onClick={() =>
              fileInputRef.current?.click()
            }
          >
            Choose Screenshot
          </button>

          {imageFile && (
            <div className="tds-upload-text">
              Selected: {imageFile.name}
            </div>
          )}
        </div>

        {previewUrl && (
          <img
            src={previewUrl}
            alt="Concepts daily schedule preview"
            className="tds-preview"
          />
        )}

        <div className="tds-actions">
          <button
            type="button"
            className="tds-button tds-primary"
            disabled={
              !imageFile ||
              !selectedTherapist ||
              extracting
            }
            onClick={extractScreenshot}
          >
            {extracting
              ? "Extracting..."
              : "Extract Appointments"}
          </button>

          <button
            type="button"
            className="tds-button"
            onClick={addAppointment}
          >
            + Add Appointment Manually
          </button>

          {imageFile && (
            <button
              type="button"
              className="tds-button"
              onClick={clearScreenshot}
            >
              Remove Screenshot
            </button>
          )}
        </div>

        <div
          className="tds-message tds-info"
          style={{ marginTop: 16, marginBottom: 0 }}
        >
          Automatic screenshot extraction requires a
          working backend extraction service. Until
          that service is implemented, enter the
          appointments manually using the screenshot
          as reference.
        </div>
      </section>

      {/* SUMMARY */}

      <div className="tds-summary">
        {[
          ["Total", summary.total],
          ["Confirmed", summary.confirmed],
          ["Unconfirmed", summary.unconfirmed],
          ["Cancelled", summary.cancelled],
        ].map(([label, value]) => (
          <div className="tds-stat" key={label}>
            <div className="tds-stat-label">
              {label}
            </div>
            <div className="tds-stat-value">
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* APPOINTMENT TABLE */}

      <section className="tds-panel">
        <h2 className="tds-heading">
          Appointment Review
        </h2>

        <p className="tds-description">
          Review patient names, match hospital
          records, and set each appointment's
          confirmation status.
        </p>

        {!appointments.length ? (
          <div className="tds-empty">
            No appointments added yet.
            Upload a screenshot and extract appointments,
            or add them manually.
          </div>
        ) : (
          <div className="tds-table-wrap">
            <table className="tds-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Time</th>
                  <th>Patient</th>
                  <th>Type</th>
                  <th>Confirmation</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {appointments.map(
                  (appointment, index) => (
                    <tr key={appointment.localId}>
                      <td>{index + 1}</td>

                      <td>
                        <input
                          type="time"
                          className="tds-input"
                          value={appointment.time}
                          onChange={(event) =>
                            updateAppointment(
                              appointment.localId,
                              "time",
                              event.target.value
                            )
                          }
                        />
                      </td>

                      <td>
                        <input
                          type="text"
                          className="tds-input tds-patient-input"
                          placeholder="Patient name"
                          value={
                            appointment.patient_name
                          }
                          onChange={(event) => {
                            const value =
                              event.target.value;

                            updateAppointment(
                              appointment.localId,
                              "patient_name",
                              value
                            );

                            searchPatients(
                              appointment.localId,
                              value
                            );
                          }}
                        />

                        {appointment.patient_id ? (
                          <div className="tds-match">
                            ✓ Patient matched
                          </div>
                        ) : (
                          <div className="tds-unmatched">
                            Not matched
                          </div>
                        )}

                        {activeSearch ===
                          appointment.localId && (
                          <div className="tds-results">
                            {searchLoading && (
                              <div
                                className="tds-result"
                              >
                                Searching...
                              </div>
                            )}

                            {!searchLoading &&
                              (searchResults[
                                appointment.localId
                              ] || []).map(
                                (patient) => (
                                  <button
                                    type="button"
                                    className="tds-result"
                                    key={patient.id}
                                    onClick={() =>
                                      selectPatient(
                                        appointment.localId,
                                        patient
                                      )
                                    }
                                  >
                                    {patientName(patient)}
                                    {" — "}
                                    {patient.file_number ||
                                      patient.mrn ||
                                      patient.id}
                                  </button>
                                )
                              )}
                          </div>
                        )}
                      </td>

                      <td>
                        <select
                          className="tds-input"
                          value={
                            appointment.appointment_type
                          }
                          onChange={(event) =>
                            updateAppointment(
                              appointment.localId,
                              "appointment_type",
                              event.target.value
                            )
                          }
                        >
                          {TYPE_OPTIONS.map(
                            (option) => (
                              <option
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </option>
                            )
                          )}
                        </select>
                      </td>

                      <td>
                        <select
                          className="tds-input"
                          value={
                            appointment.confirmation_status
                          }
                          onChange={(event) =>
                            updateAppointment(
                              appointment.localId,
                              "confirmation_status",
                              event.target.value
                            )
                          }
                        >
                          {STATUS_OPTIONS.map(
                            (option) => (
                              <option
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </option>
                            )
                          )}
                        </select>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="tds-remove"
                          onClick={() =>
                            removeAppointment(
                              appointment.localId
                            )
                          }
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="tds-actions">
          <button
            type="button"
            className="tds-button"
            onClick={addAppointment}
          >
            + Add Appointment
          </button>
        </div>
      </section>

      {/* PUBLISH */}

      <section className="tds-panel">
        <h2 className="tds-heading">
          Publish Therapist Schedule
        </h2>

        <p className="tds-description">
          Save the reviewed daily schedule for the
          selected therapist.
        </p>

        <div className="tds-grid">
          <div className="tds-field">
            <span className="tds-label">
              Therapist
            </span>
            <strong>
              {selectedTherapistName ||
                "Not selected"}
            </strong>
          </div>

          <div className="tds-field">
            <span className="tds-label">
              Date
            </span>
            <strong>
              {selectedDate || "Not selected"}
            </strong>
          </div>
        </div>

        <div className="tds-footer">
          <span className="tds-description">
            {summary.total} appointments,
            {" "}
            {summary.confirmed} confirmed
          </span>

          <button
            type="button"
            className="tds-button tds-primary"
            disabled={
              saving ||
              !selectedTherapist ||
              !appointments.length
            }
            onClick={saveSchedule}
          >
            {saving
              ? "Publishing..."
              : "Publish Daily Schedule"}
          </button>
        </div>
      </section>
    </div>
  );
}
