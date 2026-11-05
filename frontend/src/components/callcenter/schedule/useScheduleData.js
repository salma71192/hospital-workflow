
import { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import api from "../../../api/api";

import {
  API,
  MAX_FILE_SIZE,
  MAX_APPOINTMENTS,
  ACCEPTED_EXTENSIONS,
  FOLLOW_UP_STATUSES,
  today,
  validDate,
  validTime,
  normalizeTherapists,
  normalizeHistory,
  emptyAppointment,
  normalizeAppointment,
  extractRows,
  errorMessage,
  validateAppointment,
  payloadForAppointment,
} from "./scheduleHelpers";

import {
  detectScheduleHeader,
  extractScheduleAppointments,
  appointmentImportKey,
  matchTherapist,
  parseExcelTime,
} from "./excelImportRules";

/*
 * Excel state.
 */
const EMPTY_EXCEL = {
  file: null,
  sheets: [],
  selectedSheet: "",
  rows: [],
  headerRowIndex: 0,
  headers: [],
  mapping: [],
  preview: [],
  warnings: [],
  skipped: 0,
  unmatchedTherapists: 0,
};

/*
 * General helpers.
 */
const confirmDiscard = () =>
  window.confirm("Discard unsaved appointment changes?");

const normalizeSaved = (rows) =>
  rows.map((row) => normalizeAppointment(row, true));

const sortByTime = (rows) =>
  [...rows].sort((a, b) => {
    const aTime = parseExcelTime(a.time) || "99:99";
    const bTime = parseExcelTime(b.time) || "99:99";

    return aTime.localeCompare(bTime);
  });

const isValidTherapist = (value) =>
  value !== null &&
  value !== undefined &&
  String(value).trim() !== "";

const isFollowUpStatus = (status) =>
  status === "unconfirmed" ||
  FOLLOW_UP_STATUSES.has(status);

const getTherapistId = (row) => {
  const value =
    row.therapist ??
    row.therapist_id ??
    row.physiotherapist ??
    "";

  if (value && typeof value === "object") {
    return (
      value.value ??
      value.id ??
      value.user_id ??
      ""
    );
  }

  return value;
};

const getAppointmentDate = (row, fallbackDate) =>
  row.appointment_date ||
  row.date ||
  fallbackDate;

/*
 * Normalize raw Django users without losing
 * their registered names.
 *
 * Supports:
 * - Django User
 * - Physiotherapist profile
 * - React select option
 * - Nested user object
 */
function buildTherapistOptions(rawUsers = []) {
  const source = Array.isArray(rawUsers)
    ? rawUsers
    : [];

  return source
    .map((item) => {
      const user = item.user || item;

      const id =
        item.value ??
        item.id ??
        item.user_id ??
        user.id ??
        user.pk ??
        user.username ??
        "";

      const firstName =
        user.first_name ||
        item.first_name ||
        "";

      const middleName =
        user.middle_name ||
        item.middle_name ||
        "";

      const lastName =
        user.last_name ||
        item.last_name ||
        "";

      const composedName = [
        firstName,
        middleName,
        lastName,
      ]
        .filter(Boolean)
        .join(" ")
        .trim();

      const label = String(
        item.full_name ||
        user.full_name ||
        composedName ||
        item.name ||
        user.name ||
        item.label ||
        user.username ||
        item.username ||
        ""
      ).trim();

      return {
        value: id,
        label,
        id,
        name: label,
        full_name: label,
        first_name: firstName,
        middle_name: middleName,
        last_name: lastName,
        username:
          user.username ||
          item.username ||
          "",
        original: item,
      };
    })
    .filter(
      (item) =>
        isValidTherapist(item.value) &&
        item.label
    );
}

/*
 * Combine raw registered users and normalized
 * therapist options.
 *
 * Keep the best available display name.
 */
function combineTherapists(
  frontendUsers = [],
  backendUsers = []
) {
  const combined = [
    ...buildTherapistOptions(frontendUsers),
    ...buildTherapistOptions(backendUsers),
    ...normalizeTherapists(frontendUsers),
    ...normalizeTherapists(backendUsers),
  ];

  const map = new Map();

  for (const item of combined) {
    const id = String(
      item.value ?? item.id ?? ""
    );

    if (!id) continue;

    const label = String(
      item.label ||
      item.full_name ||
      item.name ||
      ""
    ).trim();

    if (!label) continue;

    const previous = map.get(id);

    if (!previous) {
      map.set(id, {
        ...item,
        value: item.value ?? item.id,
        label,
      });
      continue;
    }

    // Prefer a more complete registered name.
    const previousWords =
      String(previous.label)
        .trim()
        .split(/\s+/)
        .length;

    const currentWords =
      label.split(/\s+/).length;

    if (
      currentWords > previousWords ||
      (
        currentWords === previousWords &&
        label.length > previous.label.length
      )
    ) {
      map.set(id, {
        ...previous,
        ...item,
        value: item.value ?? item.id,
        label,
      });
    }
  }

  return Array.from(map.values());
}

/*
 * Match an imported appointment to the
 * latest registered therapist list.
 *
 * Never overwrite a manually assigned therapist.
 */
function reconcilePreviewTherapists(
  preview = [],
  therapistOptions = [],
  selectedTherapist = ""
) {
  return preview.map((row) => {
    const currentId = getTherapistId(row);

    // A valid manually selected therapist takes priority.
    if (
      row.therapist_manually_assigned &&
      therapistOptions.some(
        (option) =>
          String(option.value) ===
          String(currentId)
      )
    ) {
      return row;
    }

    const excelName =
      row.excel_therapist_name ||
      row.therapist_name ||
      "";

    const matched = matchTherapist(
      excelName,
      therapistOptions,
      selectedTherapist
    );

    if (!matched) {
      // Preserve a previously valid assignment.
      const existing = therapistOptions.find(
        (option) =>
          String(option.value) ===
          String(currentId)
      );

      if (existing) {
        return {
          ...row,
          therapist: existing.value,
          therapist_name: existing.label,
          therapist_matched: true,
        };
      }

      return {
        ...row,
        therapist: "",
        therapist_name: excelName,
        therapist_matched: false,
      };
    }

    return {
      ...row,
      therapist: matched.id,
      therapist_name: matched.name,
      therapist_matched: true,
    };
  });
}

export default function useScheduleData(
  therapists = []
) {
  /*
   * Main schedule state.
   */
  const [activeTab, setActiveTab] =
    useState("create");

  const [therapist, setTherapist] =
    useState("");

  const [date, setDate] =
    useState(today());

  const [
    backendTherapists,
    setBackendTherapists,
  ] = useState([]);

  const [appointments, setAppointments] =
    useState([]);

  const [
    historyAppointments,
    setHistoryAppointments,
  ] = useState([]);

  const [alerts, setAlerts] =
    useState([]);

  const [excel, setExcel] =
    useState(EMPTY_EXCEL);

  /*
   * Loading state.
   */
  const [loading, setLoading] =
    useState(false);

  const [
    loadingHistory,
    setLoadingHistory,
  ] = useState(false);

  const [
    loadingAlerts,
    setLoadingAlerts,
  ] = useState(false);

  const [
    loadingTherapists,
    setLoadingTherapists,
  ] = useState(false);

  const [saving, setSaving] =
    useState(false);

  const [importing, setImporting] =
    useState(false);

  /*
   * Messages.
   */
  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [alertsError, setAlertsError] =
    useState("");

  /*
   * Draft state.
   */
  const [hasDraft, setHasDraft] =
    useState(false);

  const [
    loadedSchedule,
    setLoadedSchedule,
  ] = useState(false);

  /*
   * Appointment editor.
   */
  const [
    editingAppointment,
    setEditingAppointment,
  ] = useState(null);

  const [
    detailsAppointment,
    setDetailsAppointment,
  ] = useState(null);

  const [
    detailsHistory,
    setDetailsHistory,
  ] = useState([]);

  /*
   * Patient search.
   */
  const [
    patientSearchOpen,
    setPatientSearchOpen,
  ] = useState(false);

  const [
    patientQuery,
    setPatientQuery,
  ] = useState("");

  const [
    patientMatches,
    setPatientMatches,
  ] = useState([]);

  const [
    searchingPatients,
    setSearchingPatients,
  ] = useState(false);

  /*
   * Filters.
   */
  const [
    historyFilter,
    setHistoryFilter,
  ] = useState("all");

  const [
    historyQuery,
    setHistoryQuery,
  ] = useState("");

  const [
    scheduleFilter,
    setScheduleFilter,
  ] = useState("all");

  /*
   * References.
   */
  const fileInputRef = useRef(null);
  const workbookRef = useRef(null);

  const requestRef = useRef(0);
  const historyRequestRef = useRef(0);
  const patientRequestRef = useRef(0);
  const alertsRequestRef = useRef(0);

  const busy =
    loading ||
    saving ||
    importing;

  /*
   * Registered physiotherapists.
   *
   * IMPORTANT:
   * This combines frontend users and Django users,
   * preserving their full names and IDs.
   */
  const therapistOptions = useMemo(
    () =>
      combineTherapists(
        therapists,
        backendTherapists
      ),
    [therapists, backendTherapists]
  );

  const therapistName =
    therapistOptions.find(
      (item) =>
        String(item.value) ===
        String(therapist)
    )?.label || therapist;

  /*
   * Load registered therapists from Django.
   */
  useEffect(() => {
    let active = true;

    async function loadTherapists() {
      setLoadingTherapists(true);

      try {
        const response = await api.get(
          `${API}therapists/`,
          { timeout: 30000 }
        );

        if (!active) return;

        const data = response.data;

        const users =
          Array.isArray(data)
            ? data
            : data?.therapists ||
              data?.results ||
              data?.users ||
              [];

        setBackendTherapists(
          Array.isArray(users)
            ? users
            : []
        );
      } catch (err) {
        if (
          active &&
          !therapists.length
        ) {
          setError(
            errorMessage(err)
          );
        }
      } finally {
        if (active) {
          setLoadingTherapists(false);
        }
      }
    }

    loadTherapists();

    return () => {
      active = false;
    };
  }, [therapists.length]);

  /*
   * Automatically retry therapist matching
   * when registered users become available.
   *
   * This fixes the case where Excel preview
   * was created before Django users loaded.
   */
  useEffect(() => {
    if (!therapistOptions.length) {
      return;
    }

    setExcel((previous) => {
      if (!previous.preview.length) {
        return previous;
      }

      const preview =
        reconcilePreviewTherapists(
          previous.preview,
          therapistOptions,
          therapist
        );

      const unmatchedTherapists =
        preview.filter(
          (row) =>
            !isValidTherapist(
              getTherapistId(row)
            )
        ).length;

      const changed = preview.some(
        (row, index) => {
          const old =
            previous.preview[index];

          return (
            String(row.therapist) !==
              String(old.therapist) ||
            row.therapist_name !==
              old.therapist_name ||
            row.therapist_matched !==
              old.therapist_matched
          );
        }
      );

      if (
        !changed &&
        unmatchedTherapists ===
          previous.unmatchedTherapists
      ) {
        return previous;
      }

      return {
        ...previous,
        preview,
        unmatchedTherapists,
      };
    });
  }, [therapistOptions, therapist]);

  /*
   * Summary cards.
   */
  const totals = useMemo(() => {
    const count = (status) =>
      appointments.filter(
        (row) =>
          row.confirmation_status ===
          status
      ).length;

    return {
      total: appointments.length,
      confirmed: count("confirmed"),
      unconfirmed: count("unconfirmed"),
      cancelled: count("cancelled"),
      rescheduled: count("rescheduled"),
      no_answer: count("no_answer"),
      phone_off: count("phone_off"),
      evaluations: appointments.filter(
        (row) =>
          row.appointment_type ===
          "evaluation"
      ).length,
      missingTime: appointments.filter(
        (row) =>
          !validTime(row.time)
      ).length,
    };
  }, [appointments]);

  /*
   * Schedule filtering.
   * Earliest appointment first.
   */
  const filteredAppointments = useMemo(
    () =>
      sortByTime(
        appointments.filter((row) => {
          if (
            scheduleFilter === "all"
          ) {
            return true;
          }

          if (
            scheduleFilter ===
            "evaluations"
          ) {
            return (
              row.appointment_type ===
              "evaluation"
            );
          }

          return (
            row.confirmation_status ===
            scheduleFilter
          );
        })
      ),
    [appointments, scheduleFilter]
  );

  /*
   * History filtering.
   */
  const filteredHistory = useMemo(() => {
    const query =
      historyQuery
        .trim()
        .toLowerCase();

    return sortByTime(
      historyAppointments.filter(
        (row) => {
          const statusMatches =
            historyFilter === "all" ||
            row.confirmation_status ===
              historyFilter;

          const searchMatches =
            !query ||
            String(
              row.patient_name || ""
            )
              .toLowerCase()
              .includes(query) ||
            String(
              row.file_number || ""
            )
              .toLowerCase()
              .includes(query);

          return (
            statusMatches &&
            searchMatches
          );
        }
      )
    );
  }, [
    historyAppointments,
    historyFilter,
    historyQuery,
  ]);

  /*
   * Follow-up alerts.
   */
  const followUpAlerts = useMemo(
    () =>
      sortByTime(
        alerts.filter(
          (row) =>
            isFollowUpStatus(
              row.confirmation_status
            )
        )
      ),
    [alerts]
  );

  const changedCount =
    appointments.filter(
      (row) =>
        row.isNew ||
        row.isDirty
    ).length;

  /*
   * Message helpers.
   */
  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const updateExcel = (update) => {
    setExcel((previous) => ({
      ...previous,
      ...(typeof update === "function"
        ? update(previous)
        : update),
    }));
  };

  /*
   * Clear Excel.
   */
  const clearExcel = () => {
    workbookRef.current = null;

    setExcel(EMPTY_EXCEL);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /*
   * Cancel preview.
   */
  const cancelPreview = () => {
    updateExcel({
      preview: [],
      warnings: [],
      skipped: 0,
      unmatchedTherapists: 0,
    });

    clearMessages();
  };

  /*
   * Reset workspace.
   */
  const resetWorkspace = () => {
    requestRef.current++;
    historyRequestRef.current++;
    patientRequestRef.current++;
    alertsRequestRef.current++;

    setAppointments([]);
    setHistoryAppointments([]);
    setAlerts([]);

    setHasDraft(false);
    setLoadedSchedule(false);

    setEditingAppointment(null);
    setDetailsAppointment(null);
    setDetailsHistory([]);

    setPatientSearchOpen(false);
    setPatientMatches([]);
    setPatientQuery("");

    setScheduleFilter("all");

    clearExcel();
    clearMessages();
  };

  /*
   * Change selected physiotherapist or date.
   */
  const changeContext = (
    field,
    value
  ) => {
    if (busy) return;

    if (
      hasDraft &&
      !confirmDiscard()
    ) {
      return;
    }

    resetWorkspace();

    if (
      field === "therapist"
    ) {
      setTherapist(value);
    } else {
      setDate(value);
    }
  };

  /*
   * Load schedule.
   */
  const loadSchedule = async () => {
    if (
      !therapist ||
      !validDate(date)
    ) {
      setError(
        "Select a therapist and valid date."
      );
      return;
    }

    if (
      hasDraft &&
      !confirmDiscard()
    ) {
      return;
    }

    const requestId =
      ++requestRef.current;

    setLoading(true);
    clearMessages();

    try {
      const response = await api.get(
        `${API}list/`,
        {
          params: {
            therapist,
            date,
          },
          timeout: 30000,
        }
      );

      if (
        requestId !==
        requestRef.current
      ) {
        return;
      }

      const rows =
        extractRows(response.data);

      setAppointments(
        normalizeSaved(rows)
      );

      setHasDraft(false);
      setLoadedSchedule(true);

      setSuccess(
        `${rows.length} appointments loaded.`
      );
    } catch (err) {
      if (
        requestId ===
        requestRef.current
      ) {
        setError(
          errorMessage(err)
        );
      }
    } finally {
      if (
        requestId ===
        requestRef.current
      ) {
        setLoading(false);
      }
    }
  };

  /*
   * Load worksheet.
   */
  const loadSheet = (
    workbook,
    sheetName
  ) => {
    const sheet =
      workbook.Sheets[sheetName];

    if (!sheet) return;

    const rows =
      XLSX.utils.sheet_to_json(
        sheet,
        {
          header: 1,
          raw: true,
          defval: "",
          blankrows: false,
        }
      );

    let headerRowIndex = 0;
    let headers = rows[0] || [];

    try {
      const detected =
        detectScheduleHeader(rows);

      headerRowIndex =
        detected.index;

      headers =
        rows[headerRowIndex] || [];
    } catch {
      // Header validation occurs during preview.
    }

    updateExcel({
      selectedSheet: sheetName,
      rows,
      headerRowIndex,
      headers,
      mapping: [],
      preview: [],
      warnings: [],
      skipped: 0,
      unmatchedTherapists: 0,
    });
  };

  /*
   * Upload Excel.
   */
  const handleExcelFile = async (
    event
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    clearMessages();

    const extension =
      `.${file.name
        .split(".")
        .pop()
        .toLowerCase()}`;

    if (
      !ACCEPTED_EXTENSIONS.includes(
        extension
      )
    ) {
      setError(
        "Select an XLSX, XLS, or CSV file."
      );

      event.target.value = "";
      return;
    }

    if (
      !file.size ||
      file.size > MAX_FILE_SIZE
    ) {
      setError(
        "Excel file is empty or exceeds the size limit."
      );

      event.target.value = "";
      return;
    }

    setImporting(true);

    try {
      const workbook = XLSX.read(
        await file.arrayBuffer(),
        {
          type: "array",
          cellDates: false,
        }
      );

      if (
        !workbook.SheetNames.length
      ) {
        throw new Error(
          "Excel file has no worksheets."
        );
      }

      workbookRef.current =
        workbook;

      let selectedSheet =
        workbook.SheetNames[0];

      for (
        const sheetName of
        workbook.SheetNames
      ) {
        const sheet =
          workbook.Sheets[sheetName];

        const rows =
          XLSX.utils.sheet_to_json(
            sheet,
            {
              header: 1,
              raw: true,
              defval: "",
              blankrows: false,
            }
          );

        try {
          detectScheduleHeader(rows);
          selectedSheet = sheetName;
          break;
        } catch {
          // Continue checking worksheets.
        }
      }

      updateExcel({
        file,
        sheets:
          workbook.SheetNames,
      });

      loadSheet(
        workbook,
        selectedSheet
      );

      setSuccess(
        "Excel loaded. Preview appointments."
      );
    } catch (err) {
      clearExcel();

      setError(
        err.message ||
        "Unable to read Excel."
      );
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  };

  const changeSheet = (
    sheetName
  ) => {
    if (
      workbookRef.current
    ) {
      loadSheet(
        workbookRef.current,
        sheetName
      );
    }
  };

  /*
   * Legacy compatibility.
   */
  const changeHeaderRow = (
    value
  ) => {
    const index =
      Number(value);

    updateExcel({
      headerRowIndex: index,
      headers:
        excel.rows[index] || [],
      preview: [],
    });
  };

  const updateMapping = () => {
    // Automatic column detection is used.
  };

  /*
   * Preview Excel appointments.
   */
  const previewExcel = () => {
    clearMessages();

    if (!validDate(date)) {
      setError(
        "Select a valid appointment date."
      );
      return;
    }

    if (!excel.rows.length) {
      setError(
        "Upload an Excel schedule first."
      );
      return;
    }

    try {
      const result =
        extractScheduleAppointments({
          rows: excel.rows,
          therapistUsers:
            therapistOptions,
          selectedTherapist:
            therapist,
          appointmentDate:
            date,
          existingAppointments:
            appointments,
        });

      if (
        result.appointments.length >
        MAX_APPOINTMENTS
      ) {
        throw new Error(
          `Maximum ${MAX_APPOINTMENTS} appointments allowed.`
        );
      }

      const preview =
        reconcilePreviewTherapists(
          result.appointments,
          therapistOptions,
          therapist
        );

      const unmatchedTherapists =
        preview.filter(
          (row) =>
            !isValidTherapist(
              getTherapistId(row)
            )
        ).length;

      updateExcel({
        preview:
          sortByTime(preview),
        skipped:
          result.skipped,
        warnings:
          result.warnings,
        unmatchedTherapists,
      });

      setSuccess(
        `${preview.length} appointments ready. ` +
        `${unmatchedTherapists} therapists unmatched. ` +
        `${result.skipped} rows skipped.`
      );
    } catch (err) {
      setError(
        err.message ||
        "Excel preview failed."
      );
    }
  };

  /*
   * Edit preview appointment.
   */
  const updateImportPreviewRow = (
    localId,
    field,
    value
  ) => {
    updateExcel((previous) => {
      const preview =
        previous.preview.map(
          (row) => {
            if (
              row.localId !==
              localId
            ) {
              return row;
            }

            if (
              field === "therapist" ||
              field === "therapist_id"
            ) {
              const selected =
                therapistOptions.find(
                  (option) =>
                    String(
                      option.value
                    ) ===
                    String(value)
                );

              return {
                ...row,
                therapist:
                  selected?.value ?? "",
                therapist_name:
                  selected?.label ??
                  row.excel_therapist_name ??
                  "",
                therapist_matched:
                  Boolean(selected),
                therapist_manually_assigned:
                  Boolean(selected),
                isDirty: true,
              };
            }

            if (
              field === "time"
            ) {
              return {
                ...row,
                time:
                  parseExcelTime(value),
                isDirty: true,
              };
            }

            return {
              ...row,
              [field]: value,
              isDirty: true,
            };
          }
        );

      return {
        preview:
          sortByTime(preview),
        unmatchedTherapists:
          preview.filter(
            (row) =>
              !isValidTherapist(
                getTherapistId(row)
              )
          ).length,
      };
    });
  };

  /*
   * Remove preview appointment.
   */
  const removeImportPreviewRow = (
    localId
  ) => {
    updateExcel((previous) => {
      const preview =
        previous.preview.filter(
          (row) =>
            row.localId !==
            localId
        );

      return {
        preview,
        unmatchedTherapists:
          preview.filter(
            (row) =>
              !isValidTherapist(
                getTherapistId(row)
              )
          ).length,
      };
    });
  };

  /*
   * Add preview to draft.
   */
  const addPreviewToDraft = () => {
    clearMessages();

    if (
      !excel.preview.length
    ) {
      setError(
        "No appointments available to import."
      );
      return;
    }

    const unmatched =
      excel.preview.filter(
        (row) =>
          !isValidTherapist(
            getTherapistId(row)
          ) ||
          !therapistOptions.some(
            (option) =>
              String(
                option.value
              ) ===
              String(
                getTherapistId(row)
              )
          )
      );

    if (
      unmatched.length
    ) {
      setError(
        `${unmatched.length} appointments have unmatched therapists. ` +
        "Assign registered physiotherapists before importing."
      );
      return;
    }

    for (
      const row of
      excel.preview
    ) {
      if (
        !row.patient_name?.trim() ||
        !validTime(row.time)
      ) {
        setError(
          `${row.patient_name || "Appointment"}: ` +
          "Valid patient name and time are required."
        );
        return;
      }
    }

    const seen =
      new Set(
        appointments.map(
          appointmentImportKey
        )
      );

    const accepted = [];
    let duplicateCount = 0;

    for (
      const row of
      excel.preview
    ) {
      const key =
        appointmentImportKey(row);

      if (
        seen.has(key)
      ) {
        duplicateCount++;
        continue;
      }

      seen.add(key);
      accepted.push(row);
    }

    if (
      !accepted.length
    ) {
      setError(
        "All appointments already exist."
      );
      return;
    }

    if (
      appointments.length +
      accepted.length >
      MAX_APPOINTMENTS
    ) {
      setError(
        "Maximum appointment count exceeded."
      );
      return;
    }

    if (
      !window.confirm(
        `Add ${accepted.length} appointments to draft?`
      )
    ) {
      return;
    }

    setAppointments(
      (previous) =>
        sortByTime([
          ...previous,
          ...accepted.map(
            (row) => ({
              ...row,
              isNew: true,
              isDirty: true,
            })
          ),
        ])
    );

    setHasDraft(true);

    updateExcel({
      preview: [],
      unmatchedTherapists: 0,
    });

    setSuccess(
      `${accepted.length} appointments added to draft.` +
      (duplicateCount
        ? ` ${duplicateCount} duplicates skipped.`
        : "")
    );
  };

  /*
   * Manually add appointment.
   */
  const addAppointment = () => {
    if (
      !therapist ||
      !validDate(date)
    ) {
      setError(
        "Select therapist and date first."
      );
      return;
    }

    if (
      appointments.length >=
      MAX_APPOINTMENTS
    ) {
      setError(
        "Maximum appointments reached."
      );
      return;
    }

    setEditingAppointment({
      ...emptyAppointment(),
      therapist,
      therapist_name:
        therapistName,
      appointment_date:
        date,
      date,
      confirmation_status:
        "unconfirmed",
      approval_status:
        "approved",
    });

    clearMessages();
  };

  /*
   * Save editor to draft.
   */
  const saveEditorToDraft = () => {
    if (
      !editingAppointment
    ) {
      return;
    }

    const issue =
      validateAppointment(
        editingAppointment
      );

    if (issue) {
      setError(issue);
      return;
    }

    const updated = {
      ...editingAppointment,
      isDirty: true,
    };

    setAppointments(
      (previous) => {
        const exists =
          previous.some(
            (row) =>
              row.localId ===
              updated.localId
          );

        return sortByTime(
          exists
            ? previous.map(
                (row) =>
                  row.localId ===
                  updated.localId
                    ? updated
                    : row
              )
            : [
                ...previous,
                updated,
              ]
        );
      }
    );

    setHasDraft(true);
    setEditingAppointment(null);
    setError("");

    setSuccess(
      "Appointment added to draft."
    );
  };

  /*
   * Remove draft appointment.
   */
  const removeDraftAppointment = (
    row
  ) => {
    if (row.id) {
      setError(
        "Saved appointments must be cancelled, not deleted."
      );
      return;
    }

    if (
      !window.confirm(
        "Remove this draft appointment?"
      )
    ) {
      return;
    }

    setAppointments(
      (previous) =>
        previous.filter(
          (item) =>
            item.localId !==
            row.localId
        )
    );

    setHasDraft(true);
  };

  /*
   * Search patients.
   */
  const findPatient = async () => {
    const query =
      patientQuery.trim();

    if (
      query.length < 2
    ) {
      return;
    }

    const requestId =
      ++patientRequestRef.current;

    setSearchingPatients(true);

    try {
      const response = await api.get(
        `${API}patients/`,
        {
          params: {
            q: query,
          },
          timeout: 30000,
        }
      );

      if (
        requestId ===
        patientRequestRef.current
      ) {
        setPatientMatches(
          response.data?.matches ||
          []
        );
      }
    } catch (err) {
      if (
        requestId ===
        patientRequestRef.current
      ) {
        setError(
          errorMessage(err)
        );
      }
    } finally {
      if (
        requestId ===
        patientRequestRef.current
      ) {
        setSearchingPatients(false);
      }
    }
  };

  const selectPatient = (
    patient
  ) => {
    setEditingAppointment(
      (previous) =>
        previous
          ? {
              ...previous,
              patient_id:
                patient.id,
              patient_name:
                patient.name,
              file_number:
                patient.file_number ||
                patient.patient_id ||
                "",
              matched: true,
              isDirty: true,
            }
          : previous
    );

    setPatientSearchOpen(false);
    setPatientMatches([]);
    setPatientQuery("");
  };

  /*
   * Save appointments to Django.
   */
  const saveAppointments = async () => {
    const changed =
      appointments.filter(
        (row) =>
          row.isNew ||
          row.isDirty
      );

    if (
      !changed.length
    ) {
      setSuccess(
        "No changes to save."
      );
      return;
    }

    for (
      const row of
      changed
    ) {
      const issue =
        validateAppointment(row);

      if (issue) {
        setError(
          `${row.patient_name || "Appointment"}: ${issue}`
        );
        return;
      }

      const therapistId =
        getTherapistId(row) ||
        (
          row.source !== "excel"
            ? therapist
            : ""
        );

      if (
        !isValidTherapist(
          therapistId
        )
      ) {
        setError(
          `${row.patient_name || "Appointment"}: ` +
          "Assign a physiotherapist before saving."
        );
        return;
      }
    }

    if (
      !window.confirm(
        `Save ${changed.length} appointments to Django?`
      )
    ) {
      return;
    }

    setSaving(true);
    clearMessages();

    const saved = [];

    try {
      for (
        const row of
        changed
      ) {
        const therapistId =
          getTherapistId(row) ||
          therapist;

        const appointmentDate =
          getAppointmentDate(
            row,
            date
          );

        const payload =
          payloadForAppointment(
            row,
            therapistId,
            appointmentDate
          );

        const response =
          row.id && !row.isNew
            ? await api.patch(
                `${API}appointments/${row.id}/`,
                payload,
                {
                  timeout: 30000,
                  withCredentials: true,
                }
              )
            : await api.post(
                `${API}appointments/`,
                payload,
                {
                  timeout: 30000,
                  withCredentials: true,
                }
              );

        saved.push({
          localId:
            row.localId,
          id:
            response.data?.appointment?.id ??
            response.data?.id ??
            row.id,
        });
      }

      setAppointments(
        (previous) =>
          previous.map(
            (row) => {
              const match =
                saved.find(
                  (item) =>
                    item.localId ===
                    row.localId
                );

              return match
                ? {
                    ...row,
                    id: match.id,
                    isNew: false,
                    isDirty: false,
                  }
                : row;
            }
          )
      );

      setHasDraft(false);
      setLoadedSchedule(true);

      setSuccess(
        `${saved.length} appointments saved successfully.`
      );

      await loadAlerts();
    } catch (err) {
      setAppointments(
        (previous) =>
          previous.map(
            (row) => {
              const match =
                saved.find(
                  (item) =>
                    item.localId ===
                    row.localId
                );

              return match
                ? {
                    ...row,
                    id: match.id,
                    isNew: false,
                    isDirty: false,
                  }
                : row;
            }
          )
      );

      setHasDraft(true);

      setError(
        `${saved.length}/${changed.length} saved. ` +
        errorMessage(err) +
        " Review remaining changes before retrying."
      );
    } finally {
      setSaving(false);
    }
  };

  /*
   * Load history.
   */
  const loadHistory = async () => {
    if (
      !therapist ||
      !validDate(date)
    ) {
      return;
    }

    const requestId =
      ++historyRequestRef.current;

    setLoadingHistory(true);

    try {
      const response = await api.get(
        `${API}list/`,
        {
          params: {
            therapist,
            date,
          },
          timeout: 30000,
        }
      );

      if (
        requestId ===
        historyRequestRef.current
      ) {
        setHistoryAppointments(
          normalizeSaved(
            extractRows(
              response.data
            )
          )
        );
      }
    } catch (err) {
      if (
        requestId ===
        historyRequestRef.current
      ) {
        setError(
          errorMessage(err)
        );
      }
    } finally {
      if (
        requestId ===
        historyRequestRef.current
      ) {
        setLoadingHistory(false);
      }
    }
  };

  /*
   * Load alerts.
   */
  const loadAlerts = async () => {
    const requestId =
      ++alertsRequestRef.current;

    setLoadingAlerts(true);
    setAlertsError("");

    try {
      const response = await api.get(
        `${API}alerts/`,
        {
          timeout: 30000,
        }
      );

      if (
        requestId !==
        alertsRequestRef.current
      ) {
        return;
      }

      const rows =
        response.data?.alerts ||
        extractRows(
          response.data
        );

      setAlerts(
        normalizeSaved(rows)
      );
    } catch (err) {
      if (
        requestId ===
        alertsRequestRef.current
      ) {
        setAlerts([]);
        setAlertsError(
          errorMessage(err)
        );
      }
    } finally {
      if (
        requestId ===
        alertsRequestRef.current
      ) {
        setLoadingAlerts(false);
      }
    }
  };

  /*
   * Load history and alerts
   * when the history tab opens.
   */
  useEffect(() => {
    if (
      activeTab !== "history"
    ) {
      return;
    }

    if (
      therapist &&
      validDate(date)
    ) {
      loadHistory();
    }

    loadAlerts();
  }, [
    activeTab,
    therapist,
    date,
  ]);

  /*
   * Open appointment details.
   */
  const openDetails = async (
    row
  ) => {
    setDetailsAppointment(row);

    setDetailsHistory(
      normalizeHistory(
        row.history
      )
    );

    if (!row.id) return;

    try {
      const response = await api.get(
        `${API}appointments/${row.id}/history/`
      );

      setDetailsHistory(
        normalizeHistory(
          response.data?.history ||
          response.data?.events ||
          []
        )
      );
    } catch {
      // Preserve available history.
    }
  };

  /*
   * Record call attempt.
   */
  const recordCallAttempt = async (
    row
  ) => {
    if (!row.id) {
      setError(
        "Save appointment first."
      );
      return;
    }

    try {
      await api.post(
        `${API}alerts/${row.id}/call-attempt/`,
        {},
        {
          timeout: 30000,
          withCredentials: true,
        }
      );

      setSuccess(
        "Call attempt recorded."
      );

      await loadAlerts();
    } catch (err) {
      setError(
        errorMessage(err)
      );
    }
  };

  return {
    activeTab,
    setActiveTab,

    therapist,
    date,
    therapistName,
    therapistOptions,
    changeContext,

    appointments,
    filteredAppointments,
    totals,

    scheduleFilter,
    setScheduleFilter,

    changedCount,
    hasDraft,
    loadedSchedule,

    excel,
    updateExcel,
    fileInputRef,
    handleExcelFile,
    clearExcel,
    changeSheet,
    changeHeaderRow,
    updateMapping,
    previewExcel,
    updateImportPreviewRow,
    removeImportPreviewRow,
    cancelPreview,
    addPreviewToDraft,

    addAppointment,
    saveAppointments,
    removeDraftAppointment,

    editingAppointment,
    setEditingAppointment,
    saveEditorToDraft,

    patientSearchOpen,
    setPatientSearchOpen,
    patientQuery,
    setPatientQuery,
    patientMatches,
    setPatientMatches,
    searchingPatients,
    findPatient,
    selectPatient,

    historyFilter,
    setHistoryFilter,
    historyQuery,
    setHistoryQuery,
    filteredHistory,
    loadHistory,

    followUpAlerts,
    loadAlerts,

    openDetails,
    detailsAppointment,
    setDetailsAppointment,
    detailsHistory,
    recordCallAttempt,

    busy,
    loading,
    loadingHistory,
    loadingAlerts,
    loadingTherapists,
    saving,
    importing,

    error,
    success,
    alertsError,
    clearMessages,
    loadSchedule,
  };
}
