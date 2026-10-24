
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import DashboardLayout from "../components/DashboardLayout";
import DashboardNotice from "../components/common/DashboardNotice";
import PatientTrackerTable from "../components/patients/PatientTrackerTable";
import PhysioStatisticsSection from "../components/physio/PhysioStatisticsSection";
import EvaluationTrackerSection from "../components/physio/EvaluationTrackerSection";
import PhysioReferrals from "../components/physio/PhysioReferrals";
import LeaderboardSection from "../components/common/LeaderboardSection";
import PerformanceDashboard from "../components/physio/performance/PerformanceDashboard";

const styles = {
  stack: {
    display: "grid",
    gap: 20,
    minWidth: 0,
  },
  filter: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    alignItems: "end",
    gap: 16,
    padding: 22,
    background: "#ffffff",
    border: "1px solid #e5eaf1",
    borderRadius: 18,
    boxShadow: "0 5px 20px rgba(15, 23, 42, 0.035)",
  },
  filterHeading: {
    gridColumn: "1 / -1",
    display: "flex",
    alignItems: "center",
    gap: 10,
    margin: 0,
    color: "#142d4e",
    fontSize: 18,
    fontWeight: 800,
  },
  filterLabel: {
    display: "grid",
    gap: 8,
    minWidth: 0,
  },
  filterCaption: {
    fontSize: 12,
    fontWeight: 750,
    color: "#53657b",
  },
  filterInput: {
    boxSizing: "border-box",
    width: "100%",
    minHeight: 43,
    padding: "10px 12px",
    border: "1px solid #d6deea",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    color: "#203650",
    background: "#ffffff",
    outlineColor: "#059669",
  },
};

function getLocalDateString(date = new Date()) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function getLocalMonthString(date = new Date()) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
  ].join("-");
}

function getMonthDateRange(month) {
  const [year, monthNumber] = month.split("-").map(Number);
  const lastDay = new Date(year, monthNumber, 0).getDate();

  return {
    start_date: `${month}-01`,
    end_date: `${month}-${String(lastDay).padStart(2, "0")}`,
  };
}

function getArray(data, key) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.rows)) return data.rows;
  return [];
}

function getTherapistId(item) {
  return (
    item?.therapist_id ??
    item?.therapist?.id ??
    item?.assigned_therapist_id ??
    item?.physio_id ??
    item?.physiotherapist_id ??
    null
  );
}

function belongsToTherapist(item, therapistId) {
  if (therapistId == null) return false;

  const id = getTherapistId(item);

  return id != null && String(id) === String(therapistId);
}

function getCategory(item) {
  return String(item?.category ?? item?.category_label ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

const CATEGORIES = {
  walkIn: ["walk_in", "walkin", "walk_in_patient"],
  appointment: [
    "appointment",
    "regular_session",
    "treatment_session",
    "follow_up",
    "followup",
  ],
  evaluation: [
    "initial_evaluation",
    "initial_eval",
    "evaluation",
    "eval",
  ],
  cash: [
    "cash",
    "cash_patient",
    "cash_visit",
    "cash_registration",
    "cash_payment",
  ],
  noShow: ["no_show", "noshow", "did_not_attend"],
};

function matchesCategory(item, categories) {
  return categories.includes(getCategory(item));
}

function isNoShow(item) {
  const status = String(
    item?.status ??
      item?.appointment_status ??
      item?.visit_status ??
      item?.registration_status ??
      ""
  )
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  return (
    item?.no_show === true ||
    item?.is_no_show === true ||
    CATEGORIES.noShow.includes(status)
  );
}

function buildPhysioStatistics(assignments) {
  const grouped = new Map();

  assignments.forEach((item) => {
    const therapistId = getTherapistId(item);
    const therapist = item?.therapist ?? {};

    const therapistName =
      item?.therapist_name ??
      item?.physio_name ??
      item?.physiotherapist_name ??
      item?.display_name ??
      therapist?.name ??
      therapist?.username ??
      item?.therapist_username ??
      "Unnamed therapist";

    const key =
      therapistId != null ? String(therapistId) : therapistName;

    if (!grouped.has(key)) {
      grouped.set(key, {
        therapist_id: therapistId ?? key,
        therapist_name: therapistName,
        available_slots: 24,
        booked: 0,
        walk_in: 0,
        initial_eval: 0,
        cash: 0,
        no_show: 0,
        seen: 0,
      });
    }

    const row = grouped.get(key);
    const category = getCategory(item);

    const walkIn = CATEGORIES.walkIn.includes(category);
    const appointment = CATEGORIES.appointment.includes(category);
    const evaluation = CATEGORIES.evaluation.includes(category);
    const cash = CATEGORIES.cash.includes(category);
    const noShow = isNoShow(item);

    if (walkIn) row.walk_in += 1;
    if (evaluation) row.initial_eval += 1;
    if (cash) row.cash += 1;
    if (noShow) row.no_show += 1;

    if ((appointment || evaluation || cash || walkIn) && !noShow) {
      row.seen += 1;
    }
  });

  return {
    rows: Array.from(grouped.values()).sort((a, b) =>
      a.therapist_name.localeCompare(b.therapist_name)
    ),
  };
}

function getMonthLabel(month) {
  if (!month) return "";

  const [year, monthNumber] = month.split("-").map(Number);

  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, monthNumber - 1, 1));
}

function getLeaderboardName(item) {
  return (
    item?.therapist_name ??
    item?.physio_name ??
    item?.physiotherapist_name ??
    item?.display_name ??
    item?.name ??
    item?.username ??
    item?.therapist?.name ??
    item?.therapist?.username ??
    "Unnamed therapist"
  );
}

function getLeaderboardPatientCount(item) {
  const value =
    item?.monthly_patients_seen ??
    item?.patients_seen ??
    item?.monthly_count ??
    item?.monthly ??
    item?.count ??
    0;

  const count = Number(value);

  return Number.isFinite(count) && count >= 0 ? count : 0;
}

function getLeaderboardId(item) {
  return (
    item?.therapist_id ??
    item?.physio_id ??
    item?.physiotherapist_id ??
    item?.user_id ??
    item?.therapist?.id ??
    item?.id ??
    getLeaderboardName(item)
  );
}

/*
 * Extract useful backend validation messages, including Django REST
 * Framework responses that use "detail", field errors, or "details".
 */
function getApiError(err, fallback) {
  const data = err?.response?.data;

  if (typeof data?.error === "string") return data.error;
  if (typeof data?.detail === "string") return data.detail;
  if (typeof data?.message === "string") return data.message;
  if (typeof data?.details === "string") return data.details;

  if (data && typeof data === "object") {
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === "string") {
        return `${key}: ${value}`;
      }

      if (Array.isArray(value) && value.length) {
        const first = value[0];

        return `${key}: ${
          typeof first === "string"
            ? first
            : JSON.stringify(first)
        }`;
      }

      if (value && typeof value === "object") {
        const nestedMessage =
          value.detail ?? value.message ?? value.error;

        if (typeof nestedMessage === "string") {
          return nestedMessage;
        }
      }
    }
  }

  if (err?.response?.status === 401) {
    return "Your session has expired or authentication is missing. Please log in again.";
  }

  if (err?.response?.status === 403) {
    return "Your account does not have permission to perform this action.";
  }

  if (
    err?.message &&
    err.message !== "Request failed with status code 400"
  ) {
    if (!err.response) {
      return "Cannot connect to the server. Please check your connection.";
    }

    return err.message;
  }

  return fallback;
}

function getPersonName(person) {
  if (typeof person === "string") return person;

  return (
    person?.name ??
    person?.display_name ??
    person?.full_name ??
    person?.physician_name ??
    person?.patient_name ??
    person?.username ??
    [
      person?.first_name,
      person?.last_name,
    ].filter(Boolean).join(" ") ??
    ""
  );
}

function extractList(data, keys = []) {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];

  for (const key of keys) {
    if (Array.isArray(data[key])) return data[key];
  }

  if (Array.isArray(data.results)) return data.results;
  if (Array.isArray(data.rows)) return data.rows;
  if (Array.isArray(data.data)) return data.data;

  if (data.data && typeof data.data === "object") {
    return extractList(data.data, keys);
  }

  return [];
}

/*
 * Keep the ID supplied by users/physicians/.
 * The backend should translate this user ID into the corresponding
 * reception.Physician record before saving a referral.
 */
function normalizePhysicians(data) {
  const rows = extractList(data, [
    "physicians",
    "doctors",
    "users",
    "results",
    "data",
  ]);

  const unique = new Map();

  rows.forEach((person) => {
    if (!person || typeof person !== "object") return;

    const id =
      person.user_id ??
      person.id ??
      person.physician_id ??
      person.pk;

    if (id == null || String(id).trim() === "") return;

    const name = getPersonName(person) || `Physician ${id}`;

    unique.set(String(id), {
      ...person,
      id,
      user_id: person.user_id ?? id,
      name,
      display_name: person.display_name ?? name,
      full_name: person.full_name ?? name,
    });
  });

  return Array.from(unique.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

function getReferralResponse(data) {
  if (!data || typeof data !== "object") return null;

  if (data.referral && typeof data.referral === "object") {
    return data.referral;
  }

  if (data.data && typeof data.data === "object") {
    if (
      data.data.referral &&
      typeof data.data.referral === "object"
    ) {
      return data.data.referral;
    }

    if (data.data.id != null) return data.data;
  }

  if (data.id != null) return data;

  return null;
}

function getReferralPatientId(formData) {
  const patient =
    formData?.patient ??
    formData?.patient_id ??
    formData?.selectedPatient;

  if (patient == null) return null;

  if (typeof patient === "object") {
    return (
      patient.id ??
      patient.patient_id ??
      patient.pk ??
      null
    );
  }

  return patient;
}

function getReferralPhysicianId(formData) {
  const physician =
    formData?.physician_user_id ??
    formData?.physician ??
    formData?.physician_id ??
    formData?.selectedPhysician;

  if (physician == null) return null;

  if (typeof physician === "object") {
    return (
      physician.user_id ??
      physician.id ??
      physician.physician_id ??
      physician.pk ??
      null
    );
  }

  return physician;
}

function normalizeReferralRows(data) {
  return extractList(data, ["referrals", "results", "data"]);
}

function isValidReferralId(id) {
  return (
    id != null &&
    String(id).trim() !== "" &&
    !String(id).startsWith("temporary-")
  );
}

export default function PhysioFollowupWorkspace({
  user,
  onLogout,
  actingAs,
  onStopImpersonation,
}) {
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState("statistics");
  const [error, setError] = useState("");
  const [patientTrackerRows, setPatientTrackerRows] = useState([]);

  const [trackerMonth, setTrackerMonth] = useState(
    getLocalMonthString()
  );

  const [statisticsDate, setStatisticsDate] = useState(
    getLocalDateString()
  );

  const [statisticsMonth, setStatisticsMonth] = useState(
    getLocalMonthString()
  );

  const [dailyAssignments, setDailyAssignments] = useState([]);
  const [monthlyAssignments, setMonthlyAssignments] = useState([]);

  const [dailyStatisticsLoading, setDailyStatisticsLoading] =
    useState(false);

  const [monthlyStatisticsLoading, setMonthlyStatisticsLoading] =
    useState(false);

  const [leaderboardMonth, setLeaderboardMonth] = useState(
    getLocalMonthString()
  );

  const [monthlyLeaderboardRows, setMonthlyLeaderboardRows] = useState([]);

  const [monthlyLeaderboardLoading, setMonthlyLeaderboardLoading] =
    useState(false);

  const [monthlyLeaderboardError, setMonthlyLeaderboardError] =
    useState("");

  const [evaluationMonth, setEvaluationMonth] = useState(
    getLocalMonthString()
  );

  const [evaluationAssignments, setEvaluationAssignments] = useState([]);
  const [evaluationLoading, setEvaluationLoading] = useState(false);
  const [evaluationError, setEvaluationError] = useState("");

  const [referralPatients, setReferralPatients] = useState([]);
  const [referralPhysicians, setReferralPhysicians] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [referralsLoading, setReferralsLoading] = useState(false);
  const [referralSaving, setReferralSaving] = useState(false);
  const [referralError, setReferralError] = useState("");
  const [referralSuccess, setReferralSuccess] = useState("");

  const selectedTherapistId = actingAs?.id ?? user?.id ?? null;

  const loadPatientTracker = useCallback(async () => {
    if (!trackerMonth) return;

    try {
      const params = new URLSearchParams({ month: trackerMonth });
      const res = await api.get(
        `patients/tracker/?${params.toString()}`
      );

      setPatientTrackerRows(getArray(res.data, "patients"));
      setError("");
    } catch (err) {
      console.error("Failed to load patient tracker:", err);
      setPatientTrackerRows([]);
      setError(getApiError(err, "Failed to load patient tracker."));
    }
  }, [trackerMonth]);

  const loadDailyStatistics = useCallback(async () => {
    if (!statisticsDate) return;

    setDailyStatisticsLoading(true);

    try {
      const params = new URLSearchParams({
        start_date: statisticsDate,
        end_date: statisticsDate,
      });

      const res = await api.get(
        `reception/assignments/?${params.toString()}`
      );

      setDailyAssignments(getArray(res.data, "assignments"));
      setError("");
    } catch (err) {
      console.error("Failed to load daily registrations:", err);
      setDailyAssignments([]);
      setError(
        getApiError(
          err,
          "Failed to load daily registrations for the selected date."
        )
      );
    } finally {
      setDailyStatisticsLoading(false);
    }
  }, [statisticsDate]);

  const loadMonthlyStatistics = useCallback(async () => {
    if (!statisticsMonth) return;

    setMonthlyStatisticsLoading(true);

    try {
      const params = new URLSearchParams(
        getMonthDateRange(statisticsMonth)
      );

      const res = await api.get(
        `reception/assignments/?${params.toString()}`
      );

      setMonthlyAssignments(getArray(res.data, "assignments"));
    } catch (err) {
      console.error("Failed to load monthly registrations:", err);
      setMonthlyAssignments([]);
      setError(
        getApiError(
          err,
          "Failed to load monthly registrations for the selected month."
        )
      );
    } finally {
      setMonthlyStatisticsLoading(false);
    }
  }, [statisticsMonth]);

  const loadEvaluationTracker = useCallback(async () => {
    if (!evaluationMonth) return;

    setEvaluationLoading(true);
    setEvaluationError("");

    try {
      const params = new URLSearchParams(
        getMonthDateRange(evaluationMonth)
      );

      const res = await api.get(
        `reception/assignments/?${params.toString()}`
      );

      setEvaluationAssignments(getArray(res.data, "assignments"));
    } catch (err) {
      console.error("Failed to load evaluation tracker:", err);
      setEvaluationAssignments([]);
      setEvaluationError(
        getApiError(
          err,
          "Failed to load evaluations for the selected month."
        )
      );
    } finally {
      setEvaluationLoading(false);
    }
  }, [evaluationMonth]);

  const loadMonthlyLeaderboard = useCallback(async () => {
    if (!leaderboardMonth) return;

    setMonthlyLeaderboardLoading(true);
    setMonthlyLeaderboardError("");

    try {
      const params = new URLSearchParams({
        month: leaderboardMonth,
      });

      const res = await api.get(
        `physio/leaderboard/monthly/?${params.toString()}`
      );

      const results = getArray(res.data, "results");

      const rows = results.length
        ? results
        : getArray(res.data, "rows").length
          ? getArray(res.data, "rows")
          : getArray(res.data, "leaderboard");

      setMonthlyLeaderboardRows(rows);
    } catch (err) {
      console.error("Failed to load monthly leaderboard:", err);
      setMonthlyLeaderboardRows([]);

      setMonthlyLeaderboardError(
        err?.response?.status === 404
          ? "The monthly physiotherapy leaderboard API is not configured yet."
          : getApiError(
              err,
              "Failed to load the monthly leaderboard. Please try refreshing."
            )
      );
    } finally {
      setMonthlyLeaderboardLoading(false);
    }
  }, [leaderboardMonth]);

  // Load referral patients, physician accounts, and referral history.
  const loadReferralData = useCallback(async () => {
    setReferralsLoading(true);
    setReferralError("");

    const problems = [];

    try {
      const [patientsResult, referralsResult] =
        await Promise.allSettled([
          api.get("patients/"),
          api.get("reception/physio-referrals/"),
        ]);

      if (patientsResult.status === "fulfilled") {
        const patients = extractList(
          patientsResult.value.data,
          ["patients", "results", "data"]
        );

        setReferralPatients(patients);
      } else {
        setReferralPatients([]);

        problems.push(
          `Patients: ${getApiError(
            patientsResult.reason,
            "Could not load patients."
          )}`
        );

        console.error(
          "Patient list request failed:",
          patientsResult.reason?.response?.data ||
            patientsResult.reason?.message
        );
      }

      let physicianData = null;
      let physicianError = null;

      // Use the physician USER endpoint because the form selects user IDs.
      try {
        const response = await api.get("users/physicians/");
        physicianData = response.data;
      } catch (err) {
        physicianError = err;

        console.error(
          "Physician endpoint failed:",
          err?.response?.status,
          err?.response?.data || err?.message
        );
      }

      if (physicianData !== null) {
        const physicians = normalizePhysicians(physicianData);

        setReferralPhysicians(physicians);

        if (!physicians.length) {
          problems.push(
            "The users/physicians/ endpoint responded, but its response contained no usable physician IDs and names."
          );

          console.error(
            "Unexpected physician API response:",
            physicianData
          );
        }
      } else {
        setReferralPhysicians([]);

        problems.push(
          `Physicians: ${getApiError(
            physicianError,
            "Could not load physician accounts."
          )}`
        );
      }

      if (referralsResult.status === "fulfilled") {
        setReferrals(
          normalizeReferralRows(referralsResult.value.data)
        );
      } else {
        setReferrals([]);

        problems.push(
          `Referrals: ${getApiError(
            referralsResult.reason,
            "Could not load referral history."
          )}`
        );

        console.error(
          "Referral list request failed:",
          referralsResult.reason?.response?.data ||
            referralsResult.reason?.message
        );
      }

      setReferralError(problems.join(" "));
    } catch (err) {
      console.error("Failed to load referral data:", err);

      setReferralError(
        getApiError(err, "Could not load physiotherapy referral data.")
      );
    } finally {
      setReferralsLoading(false);
    }
  }, []);

  // Create referral.
  const handleCreateReferral = useCallback(
    async (formData) => {
      if (referralSaving) return;

      setReferralSaving(true);
      setReferralError("");
      setReferralSuccess("");

      try {
        const patientId = getReferralPatientId(formData);
        const physicianId = getReferralPhysicianId(formData);
        const reason = String(formData?.reason ?? "").trim();

        if (patientId == null || String(patientId).trim() === "") {
          throw new Error("Please select a patient.");
        }

        if (physicianId == null || String(physicianId).trim() === "") {
          throw new Error("Please select a physician.");
        }

        if (!reason) {
          throw new Error("Please enter the referral reason.");
        }

        const selectedPatient = referralPatients.find(
          (patient) =>
            String(patient?.id ?? patient?.patient_id ?? patient?.pk) ===
            String(patientId)
        );

        const selectedPhysician = referralPhysicians.find(
          (physician) =>
            String(
              physician?.user_id ??
                physician?.id ??
                physician?.physician_id ??
                physician?.pk
            ) === String(physicianId)
        );

        if (!selectedPatient) {
          throw new Error(
            "The selected patient is not in the loaded patient list. Refresh the list and select the patient again."
          );
        }

        if (!selectedPhysician) {
          throw new Error(
            "The selected physician is not in the loaded physician list. Refresh the list and select the physician again."
          );
        }

        // Send the USER ID; the Django backend resolves the Physician model.
        const payload = {
          patient: patientId,
          physician_user_id: physicianId,
          reason,
        };

        const response = await api.post(
          "reception/physio-referrals/",
          payload
        );

        if (
          response.status < 200 ||
          response.status >= 300 ||
          response.data?.success === false
        ) {
          throw new Error(
            response.data?.error ||
              response.data?.detail ||
              response.data?.message ||
              "The server did not confirm that the referral was created."
          );
        }

        const savedReferral = getReferralResponse(response.data);

        if (savedReferral?.id) {
          const immediateReferral = {
            ...savedReferral,
            patient: savedReferral.patient ?? selectedPatient,
            patient_id:
              savedReferral.patient_id ??
              selectedPatient.id ??
              selectedPatient.patient_id,
            patient_name:
              savedReferral.patient_name ??
              getPersonName(selectedPatient),
            physician: savedReferral.physician ?? selectedPhysician,
            physician_name:
              savedReferral.physician_name ??
              getPersonName(selectedPhysician),
            physician_id:
              savedReferral.physician_id ??
              selectedPhysician.id,
            reason: savedReferral.reason ?? reason,
            status: savedReferral.status ?? "awaiting",
            referred_by_name:
              savedReferral.referred_by_name ??
              user?.name ??
              user?.display_name ??
              user?.username ??
              "",
          };

          setReferrals((current) => {
            const exists = current.some(
              (item) => String(item?.id) === String(savedReferral.id)
            );

            return exists
              ? current.map((item) =>
                  String(item?.id) === String(savedReferral.id)
                    ? { ...item, ...immediateReferral }
                    : item
                )
              : [immediateReferral, ...current];
          });
        }

        setReferralSuccess("Referral created successfully.");

        await loadReferralData();

        setReferralSuccess("Referral created successfully.");
      } catch (err) {
        console.error("Failed to create referral:", err);

        setReferralError(
          getApiError(err, "Could not create the referral.")
        );
      } finally {
        setReferralSaving(false);
      }
    },
    [
      referralSaving,
      referralPatients,
      referralPhysicians,
      loadReferralData,
      user,
    ]
  );

  // Edit referral.
  const handleEditReferral = useCallback(
    async (referralId, formData) => {
      setReferralError("");
      setReferralSuccess("");

      if (!isValidReferralId(referralId)) {
        setReferralError(
          "This referral does not have a valid database ID. Refresh the referral history and try again."
        );
        return;
      }

      const patientId = getReferralPatientId(formData);
      const physicianId = getReferralPhysicianId(formData);
      const reason = String(formData?.reason ?? "").trim();

      if (patientId == null || String(patientId).trim() === "") {
        setReferralError("Please select a patient.");
        return;
      }

      if (physicianId == null || String(physicianId).trim() === "") {
        setReferralError("Please select a physician.");
        return;
      }

      if (!reason) {
        setReferralError("Please enter the referral reason.");
        return;
      }

      const selectedPatient = referralPatients.find(
        (patient) =>
          String(patient?.id ?? patient?.patient_id ?? patient?.pk) ===
          String(patientId)
      );

      const selectedPhysician = referralPhysicians.find(
        (physician) =>
          String(
            physician?.user_id ??
              physician?.id ??
              physician?.physician_id ??
              physician?.pk
          ) === String(physicianId)
      );

      if (!selectedPatient) {
        setReferralError(
          "The selected patient is not in the loaded patient list. Refresh the list and try again."
        );
        return;
      }

      if (!selectedPhysician) {
        setReferralError(
          "The selected physician is not in the loaded physician list. Refresh the list and try again."
        );
        return;
      }

      // Use the physician USER ID consistently for edits as well.
      const payload = {
        patient: patientId,
        physician_user_id: physicianId,
        reason,
      };

      try {
        const response = await api.patch(
          `reception/physio-referrals/${referralId}/`,
          payload
        );

        if (response.data?.success === false) {
          throw new Error(
            response.data?.error ||
              response.data?.detail ||
              response.data?.message ||
              "The server did not confirm that the referral was updated."
          );
        }

        const updatedReferral = getReferralResponse(response.data);

        setReferrals((current) =>
          current.map((referral) =>
            String(referral?.id) === String(referralId)
              ? {
                  ...referral,
                  ...(updatedReferral ?? {}),
                  patient:
                    updatedReferral?.patient ?? selectedPatient,
                  patient_id: patientId,
                  patient_name: getPersonName(selectedPatient),
                  physician:
                    updatedReferral?.physician ?? selectedPhysician,
                  physician_id: physicianId,
                  physician_name: getPersonName(selectedPhysician),
                  reason,
                }
              : referral
          )
        );

        setReferralSuccess("Referral updated successfully.");

        await loadReferralData();

        setReferralSuccess("Referral updated successfully.");
      } catch (err) {
        console.error("Failed to edit referral:", err);

        setReferralError(
          getApiError(err, "Could not update the referral.")
        );
      }
    },
    [
      referralPatients,
      referralPhysicians,
      loadReferralData,
    ]
  );

  // Delete referral.
  const handleDeleteReferral = useCallback(
    async (referralId) => {
      setReferralError("");
      setReferralSuccess("");

      if (!isValidReferralId(referralId)) {
        setReferralError(
          "This referral does not have a valid database ID. Refresh the referral history and try again."
        );
        return;
      }

      const referralExists = referrals.some(
        (referral) => String(referral?.id) === String(referralId)
      );

      if (!referralExists) {
        setReferralError(
          "This referral could not be found in the current history. Refresh and try again."
        );
        return;
      }

      try {
        const response = await api.delete(
          `reception/physio-referrals/${referralId}/`
        );

        if (response.data?.success === false) {
          throw new Error(
            response.data?.error ||
              response.data?.detail ||
              response.data?.message ||
              "The server did not confirm that the referral was deleted."
          );
        }

        setReferrals((current) =>
          current.filter(
            (referral) => String(referral?.id) !== String(referralId)
          )
        );

        setReferralSuccess("Referral deleted successfully.");

        await loadReferralData();

        setReferralSuccess("Referral deleted successfully.");
      } catch (err) {
        console.error("Failed to delete referral:", err);

        setReferralError(
          getApiError(err, "Could not delete the referral.")
        );
      }
    },
    [referrals, loadReferralData]
  );

  // Update referral status.
  const handleUpdateReferralStatus = useCallback(
    async (referralId, status) => {
      setReferralError("");
      setReferralSuccess("");

      if (!isValidReferralId(referralId)) {
        setReferralError(
          "This referral does not have a valid database ID. Refresh the referral history and try again."
        );
        return;
      }

      if (!["awaiting", "completed"].includes(status)) {
        setReferralError("Invalid referral status.");
        return;
      }

      const previousReferrals = referrals;

      setReferrals((current) =>
        current.map((referral) =>
          String(referral?.id) === String(referralId)
            ? { ...referral, status }
            : referral
        )
      );

      try {
        const response = await api.patch(
          `reception/physio-referrals/${referralId}/`,
          { status }
        );

        if (response.data?.success === false) {
          throw new Error(
            response.data?.error ||
              response.data?.detail ||
              response.data?.message ||
              "The server did not confirm that the status was updated."
          );
        }

        const updatedReferral = getReferralResponse(response.data);

        if (updatedReferral) {
          setReferrals((current) =>
            current.map((referral) =>
              String(referral?.id) === String(referralId)
                ? { ...referral, ...updatedReferral }
                : referral
            )
          );
        }

        setReferralSuccess("Referral status updated successfully.");

        await loadReferralData();

        setReferralSuccess("Referral status updated successfully.");
      } catch (err) {
        console.error("Failed to update referral status:", err);

        setReferrals(previousReferrals);

        setReferralError(
          getApiError(err, "Could not update the referral status.")
        );
      }
    },
    [referrals, loadReferralData]
  );

  useEffect(() => {
    loadPatientTracker();
  }, [loadPatientTracker]);

  useEffect(() => {
    loadDailyStatistics();
  }, [loadDailyStatistics]);

  useEffect(() => {
    loadMonthlyStatistics();
  }, [loadMonthlyStatistics]);

  useEffect(() => {
    if (activeSection === "leaderboard") {
      loadMonthlyLeaderboard();
    }
  }, [activeSection, loadMonthlyLeaderboard]);

  useEffect(() => {
    if (activeSection === "evaluation-tracker") {
      loadEvaluationTracker();
    }
  }, [activeSection, loadEvaluationTracker]);

  useEffect(() => {
    if (activeSection === "referrals") {
      loadReferralData();
    }
  }, [activeSection, loadReferralData]);

  const handleBackToAdmin = useCallback(() => {
    onStopImpersonation?.();
    navigate("/admin");
  }, [onStopImpersonation, navigate]);

  const handleSidebarSectionChange = useCallback(
    (key) => {
      if (key === "home") {
        navigate("/physio");
        return;
      }

      setActiveSection(key);
    },
    [navigate]
  );

  const physioDailyAssignments = useMemo(
    () =>
      dailyAssignments.filter((item) =>
        belongsToTherapist(item, selectedTherapistId)
      ),
    [dailyAssignments, selectedTherapistId]
  );

  const physioMonthlyAssignments = useMemo(
    () =>
      monthlyAssignments.filter((item) =>
        belongsToTherapist(item, selectedTherapistId)
      ),
    [monthlyAssignments, selectedTherapistId]
  );

  const physioEvaluationAssignments = useMemo(
    () =>
      evaluationAssignments.filter((item) =>
        belongsToTherapist(item, selectedTherapistId)
      ),
    [evaluationAssignments, selectedTherapistId]
  );

  const dailyStatistics = useMemo(
    () => buildPhysioStatistics(physioDailyAssignments),
    [physioDailyAssignments]
  );

  const monthlyStatistics = useMemo(
    () => buildPhysioStatistics(physioMonthlyAssignments),
    [physioMonthlyAssignments]
  );

  const walkInAssignments = useMemo(
    () =>
      physioDailyAssignments.filter((item) =>
        matchesCategory(item, CATEGORIES.walkIn)
      ),
    [physioDailyAssignments]
  );

  const appointmentAssignments = useMemo(
    () =>
      physioDailyAssignments.filter((item) =>
        matchesCategory(item, CATEGORIES.appointment)
      ),
    [physioDailyAssignments]
  );

  const initialEvalAssignments = useMemo(
    () =>
      physioDailyAssignments.filter((item) =>
        matchesCategory(item, CATEGORIES.evaluation)
      ),
    [physioDailyAssignments]
  );

  const taskWithoutEligibilityAssignments = useMemo(
    () =>
      physioDailyAssignments.filter((item) =>
        [
          "task_without_eligibility",
          "no_eligibility",
          "without_eligibility",
        ].includes(getCategory(item))
      ),
    [physioDailyAssignments]
  );

  const statisticsCount = dailyStatistics.rows.length;

  return (
    <DashboardLayout
      title="Patient Workflow"
      subtitle={`Welcome, ${
        actingAs?.name ||
        actingAs?.username ||
        user?.name ||
        user?.username ||
        "Physio User"
      }`}
      accent="#059669"
      sidebarTitle="Patient Workflow"
      sidebarItems={[
        { key: "home", label: "Home" },
        { key: "statistics", label: `Statistics (${statisticsCount})` },
        { key: "tracker", label: "Patient Tracker" },
        { key: "evaluation-tracker", label: "Evaluation Tracker" },
        { key: "performance", label: "Performance" },
        { key: "referrals", label: "Physio Referrals" },
        { key: "leaderboard", label: "Leaderboard" },
      ]}
      activeSection={activeSection}
      setActiveSection={handleSidebarSectionChange}
      onLogout={onLogout}
      actingAs={actingAs}
      actingAsName={actingAs?.name || actingAs?.username}
      onBackToAdmin={handleBackToAdmin}
    >
      {error ? (
        <DashboardNotice type="error">{error}</DashboardNotice>
      ) : null}

      {activeSection === "statistics" && (
        <PhysioStatisticsSection
          statisticsDate={statisticsDate}
          setStatisticsDate={setStatisticsDate}
          statisticsMonth={statisticsMonth}
          setStatisticsMonth={setStatisticsMonth}
          dailyStatistics={dailyStatistics}
          monthlyStatistics={monthlyStatistics}
          dailyStatisticsLoading={dailyStatisticsLoading}
          monthlyStatisticsLoading={monthlyStatisticsLoading}
          monthlyLabel={getMonthLabel(statisticsMonth)}
          walkInAssignments={walkInAssignments}
          appointmentAssignments={appointmentAssignments}
          initialEvalAssignments={initialEvalAssignments}
          taskWithoutEligibilityAssignments={
            taskWithoutEligibilityAssignments
          }
          dailyAssignments={physioDailyAssignments}
          monthlyAssignments={physioMonthlyAssignments}
        />
      )}

      {activeSection === "tracker" && (
        <PatientTrackerTable
          patients={patientTrackerRows}
          title="Patient Tracker"
          selectedMonth={trackerMonth}
          onMonthChange={setTrackerMonth}
          monthLabel={getMonthLabel(trackerMonth)}
          onRefresh={loadPatientTracker}
        />
      )}

      {activeSection === "performance" && (
        <PerformanceDashboard user={user} actingAs={actingAs} />
      )}

      {activeSection === "evaluation-tracker" && (
        <div style={styles.stack}>
          <EvaluationTrackerSection
            assignments={physioEvaluationAssignments}
            month={evaluationMonth}
            onMonthChange={setEvaluationMonth}
            loading={evaluationLoading}
            error={evaluationError}
            onReload={loadEvaluationTracker}
          />
        </div>
      )}

      {activeSection === "referrals" && (
        <PhysioReferrals
          patients={referralPatients}
          physicians={referralPhysicians}
          referrals={referrals}
          loading={referralsLoading}
          saving={referralSaving}
          error={referralError}
          success={referralSuccess}
          onCreateReferral={handleCreateReferral}
          onUpdateStatus={handleUpdateReferralStatus}
          onEditReferral={handleEditReferral}
          onDeleteReferral={handleDeleteReferral}
          onRefresh={loadReferralData}
        />
      )}

      {activeSection === "leaderboard" && (
        <div style={styles.stack}>
          <section style={styles.filter}>
            <h3 style={styles.filterHeading}>
              <span
                aria-hidden="true"
                style={{
                  display: "grid",
                  placeItems: "center",
                  width: 35,
                  height: 35,
                  borderRadius: 10,
                  background: "#ecfdf5",
                  color: "#059669",
                  fontSize: 18,
                }}
              >
                ◷
              </span>
              Leaderboard Filters
            </h3>

            <label style={styles.filterLabel}>
              <span style={styles.filterCaption}>
                Leaderboard month
              </span>

              <input
                type="month"
                value={leaderboardMonth}
                onChange={(event) =>
                  setLeaderboardMonth(event.target.value)
                }
                style={styles.filterInput}
              />
            </label>
          </section>

          <LeaderboardSection
            title="Leaderboard"
            department={`Physiotherapy · ${getMonthLabel(leaderboardMonth)}`}
            rows={monthlyLeaderboardRows}
            loading={monthlyLeaderboardLoading}
            error={monthlyLeaderboardError}
            onReload={loadMonthlyLeaderboard}
            target={400}
            showTarget
            todayLabel="TODAY"
            monthlyLabel="THIS MONTH"
            countLabel="patients"
            emptyMessage={`No leaderboard data is available for ${getMonthLabel(
              leaderboardMonth
            )}.`}
            getName={getLeaderboardName}
            getMonthly={getLeaderboardPatientCount}
            getId={getLeaderboardId}
          />
        </div>
      )}
    </DashboardLayout>
  );
}
