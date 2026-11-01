
import * as XLSX from "xlsx";

export function getApiError(error) {
  const data = error?.response?.data;

  if (typeof data === "string") return data;
  if (data?.detail) return String(data.detail);
  if (data?.message) return String(data.message);

  if (data && typeof data === "object") {
    return Object.entries(data)
      .map(([key, value]) => {
        const message = Array.isArray(value)
          ? value.map(String).join(", ")
          : typeof value === "object"
            ? JSON.stringify(value)
            : String(value);

        return `${key}: ${message}`;
      })
      .join(" · ");
  }

  if (error?.message === "Network Error") {
    return "Network error: the server could not be reached. Check the backend and CORS settings.";
  }

  return error?.message || "Unable to complete the request.";
}

export function getClaimDatabaseId(claim) {
  const id =
    claim?.id ??
    claim?.pk ??
    claim?.claim_pk ??
    claim?.claimPk ??
    claim?.database_id ??
    claim?.databaseId;

  return id === undefined || id === null || id === ""
    ? null
    : id;
}

export function getClaimReference(details) {
  return String(
    details?.claimId ??
    details?.claim_id_value ??
    details?.claim?.claimId ??
    details?.claim?.claim_id_value ??
    details?.claim?.claim_id ??
    details?.claim?.claim_number ??
    details?.claim_id ??
    ""
  );
}

export function getPatientId(details) {
  return (
    details?.patient?.id ??
    details?.patientId ??
    details?.patient_id ??
    details?.claim?.patientId ??
    details?.claim?.patient_id ??
    details?.claim?.patient?.id ??
    null
  );
}

export function normalizeHeader(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_\-./\\()[\]]+/g, "")
    .replace(/[^a-z0-9]/g, "");
}

export const EXCEL_FIELD_ALIASES = {
  patientFileNumber: [
    "patientfilenumber", "filenumber", "patientfile",
    "patientmrn", "mrn", "medicalrecordnumber",
    "patientnumber", "patientidnumber", "patientid",
  ],
  claimId: [
    "claimid", "claimnumber", "claimreference",
    "claimref", "claimno",
  ],
  requestingClinician: [
    "requestingclinician", "requestingdoctor",
    "clinician", "doctor", "physician", "referringdoctor",
  ],
  authorizationNumber: [
    "authorizationnumber", "authorizationno",
    "authorization", "authnumber", "authno",
    "approvalnumber", "approvalno",
  ],
  approvalDate: [
    "approvaldate", "dateofapproval",
    "authorizationdate", "authdate",
  ],
  expirationDate: [
    "expirationdate", "expirydate", "validuntil",
    "authorizationexpiry", "authorizationexpirationdate",
    "enddate",
  ],
  approvedVisits: [
    "approvedvisits", "numberofapprovedvisits",
    "approvedvisit", "visitsapproved", "visitunits",
  ],
  approvedUnits: [
    "approvedunits", "numberofapprovedunits",
    "unitsapproved", "approvedquantity",
  ],
  approvedService: [
    "approvedservice", "approvedprocedure",
    "service", "procedure", "servicetype", "treatment",
  ],
  payer: [
    "insurance", "payer", "insurancecompany",
    "insuranceprovider", "insurancepayer", "payor",
  ],
  status: [
    "approvalstatus", "claimstatus",
    "status", "authorizationstatus",
  ],
  rejectionReason: [
    "rejectionreason", "reasonforrejection",
    "denialreason", "rejectionremarks",
  ],
};

export function getRowValue(row, aliases) {
  const rowKeys = Object.keys(row);

  for (const alias of aliases) {
    const matchingKey = rowKeys.find(
      (key) => normalizeHeader(key) === normalizeHeader(alias)
    );

    if (matchingKey !== undefined) {
      return row[matchingKey];
    }
  }

  return "";
}

export function cleanExcelValue(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

export function excelDateToISO(value) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const parsed = XLSX.SSF.parse_date_code(value);

    if (parsed) {
      return [
        String(parsed.y).padStart(4, "0"),
        String(parsed.m).padStart(2, "0"),
        String(parsed.d).padStart(2, "0"),
      ].join("-");
    }
  }

  const text = String(value).trim();
  if (!text) return "";

  const isoMatch = text.match(
    /^(\d{4})-(\d{1,2})-(\d{1,2})/
  );

  if (isoMatch) {
    return [
      isoMatch[1],
      isoMatch[2].padStart(2, "0"),
      isoMatch[3].padStart(2, "0"),
    ].join("-");
  }

  const slashMatch = text.match(
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/
  );

  if (slashMatch) {
    const first = Number(slashMatch[1]);
    const second = Number(slashMatch[2]);
    let year = Number(slashMatch[3]);

    if (year < 100) {
      year += year < 50 ? 2000 : 1900;
    }

    const month = first > 12 ? second : first;
    const day = first > 12 ? first : second;
    const date = new Date(year, month - 1, day);

    if (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    ) {
      return [
        String(year).padStart(4, "0"),
        String(month).padStart(2, "0"),
        String(day).padStart(2, "0"),
      ].join("-");
    }
  }

  return text;
}

export function parseExcelNumber(value, fieldName, rowNumber) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(
    String(value).replace(/,/g, "").trim()
  );

  if (
    !Number.isFinite(number) ||
    number < 0 ||
    !Number.isInteger(number)
  ) {
    throw new Error(
      `Excel row ${rowNumber}: ${fieldName} must be a non-negative whole number.`
    );
  }

  return number;
}

export function normalizeClaimStatus(value) {
  const status = cleanExcelValue(value).toLowerCase();

  if (!status) return "Pending";

  if (
    ["approved", "approve", "authorized", "authorised"]
      .includes(status)
  ) {
    return "Approved";
  }

  if (
    ["rejected", "reject", "denied", "declined"]
      .includes(status)
  ) {
    return "Rejected";
  }

  if (
    ["submitted", "sent", "in review", "under review"]
      .includes(status)
  ) {
    return "Submitted";
  }

  if (["pending", "waiting"].includes(status)) {
    return "Pending";
  }

  return cleanExcelValue(value);
}

export function convertExcelRowsToClaims(rows) {
  return rows.map((row) => {
    const rowNumber = row.__rowNumber ?? "?";

    const patientFileNumber = cleanExcelValue(
      getRowValue(row, EXCEL_FIELD_ALIASES.patientFileNumber)
    );

    const claimId = cleanExcelValue(
      getRowValue(row, EXCEL_FIELD_ALIASES.claimId)
    );

    if (!patientFileNumber) {
      throw new Error(
        `Excel row ${rowNumber}: Patient File Number is missing.`
      );
    }

    if (!claimId) {
      throw new Error(
        `Excel row ${rowNumber}: Claim ID is missing.`
      );
    }

    return {
      rowNumber,
      patientFileNumber,
      claimId,
      requestingClinician: cleanExcelValue(
        getRowValue(row, EXCEL_FIELD_ALIASES.requestingClinician)
      ),
      authorizationNumber: cleanExcelValue(
        getRowValue(row, EXCEL_FIELD_ALIASES.authorizationNumber)
      ),
      approvalDate: excelDateToISO(
        getRowValue(row, EXCEL_FIELD_ALIASES.approvalDate)
      ),
      expirationDate: excelDateToISO(
        getRowValue(row, EXCEL_FIELD_ALIASES.expirationDate)
      ),
      approvedVisits: parseExcelNumber(
        getRowValue(row, EXCEL_FIELD_ALIASES.approvedVisits),
        "Approved Visits",
        rowNumber
      ),
      approvedUnits: parseExcelNumber(
        getRowValue(row, EXCEL_FIELD_ALIASES.approvedUnits),
        "Approved Units",
        rowNumber
      ),
      approvedService: cleanExcelValue(
        getRowValue(row, EXCEL_FIELD_ALIASES.approvedService)
      ),
      payer: cleanExcelValue(
        getRowValue(row, EXCEL_FIELD_ALIASES.payer)
      ),
      status: normalizeClaimStatus(
        getRowValue(row, EXCEL_FIELD_ALIASES.status)
      ),
      rejectionReason: cleanExcelValue(
        getRowValue(row, EXCEL_FIELD_ALIASES.rejectionReason)
      ),
    };
  });
}

export function getImportCount(result, keys) {
  for (const key of keys) {
    if (result?.[key] !== undefined && result?.[key] !== null) {
      const value = Number(result[key]);
      if (Number.isFinite(value)) return value;
    }
  }

  return 0;
}

export function getImportRowErrors(result) {
  if (!result) return [];

  const source = Array.isArray(result.results)
    ? result.results
    : Array.isArray(result.errors)
      ? result.errors
      : [];

  return source
    .filter((item) => {
      const status = String(item?.status || "").toLowerCase();

      return (
        item?.success === false ||
        Boolean(item?.error) ||
        status === "failed" ||
        status === "error"
      );
    })
    .map((item) => ({
      row:
        item?.rowNumber ??
        item?.row ??
        item?.excel_row ??
        "?",
      message:
        item?.message ??
        item?.error ??
        item?.detail ??
        "The backend rejected this row.",
    }));
}
