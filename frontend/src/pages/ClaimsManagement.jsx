
import React, { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import api from "../api/api";

import CreateClaim from "../components/rcm/CreateClaim";
import ClaimHistory from "../components/rcm/ClaimHistory";
import RenewalAlerts from "../components/rcm/RenewalAlerts";

const styles = `
.claim-management{min-height:100%;padding:28px;background:#f3f6fc;color:#172b4d;font-family:Arial,Helvetica,sans-serif;box-sizing:border-box;font-size:15px}
.claim-management *{box-sizing:border-box}
.claim-management-header{position:relative;overflow:hidden;padding:30px 32px;margin-bottom:24px;border-radius:19px;color:#fff;background:linear-gradient(120deg,#142b4c 0%,#234b83 58%,#405ed0 100%);box-shadow:0 10px 28px rgba(28,52,100,.16)}
.claim-management-header:after{content:"";position:absolute;width:260px;height:260px;right:-75px;top:-135px;border:35px solid rgba(255,255,255,.07);border-radius:50%;pointer-events:none}
.claim-management-header:before{content:"";position:absolute;width:180px;height:180px;right:95px;bottom:-135px;background:rgba(255,255,255,.055);border-radius:50%;pointer-events:none}
.claim-management-header-content{position:relative;z-index:1}
.claim-management-topline{display:flex;align-items:center;gap:9px;margin-bottom:15px;color:#dbeafe;font-size:13px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase}
.claim-management-topline-dot{width:9px;height:9px;border-radius:50%;background:#8cf0c1;box-shadow:0 0 0 4px rgba(140,240,193,.15)}
.claim-management-header h1{margin:0;color:#fff;font-size:34px;line-height:1.2;font-weight:800;letter-spacing:-.8px}
.claim-management-header p{max-width:700px;margin:12px 0 0;color:#e0eaff;font-size:16px;font-weight:500;line-height:1.65}
.claim-management-header-bottom{display:flex;align-items:center;justify-content:space-between;gap:18px;flex-wrap:wrap;margin-top:25px;padding-top:20px;border-top:1px solid rgba(255,255,255,.19)}
.claim-management-header-note{color:#e0eaff;font-size:14px;font-weight:600}
.claim-back-button{display:inline-flex;align-items:center;justify-content:center;gap:9px;min-height:46px;padding:11px 18px;border:1px solid rgba(255,255,255,.45);border-radius:11px;color:#fff;background:rgba(255,255,255,.12);font-size:14px;font-weight:800;cursor:pointer}
.claim-back-button:hover{background:rgba(255,255,255,.22)}
.claim-management-tabs-card{padding:8px;margin-bottom:20px;background:#fff;border:1px solid #e1e8f2;border-radius:15px;box-shadow:0 5px 18px rgba(25,42,70,.04)}
.claim-tab-bar{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
.claim-tab{display:flex;align-items:center;justify-content:center;gap:10px;min-height:70px;padding:13px 12px;border:1px solid transparent;border-radius:11px;background:transparent;color:#53647b;font-size:15px;font-weight:800;cursor:pointer;min-width:0}
.claim-tab:hover{background:#f4f7ff;color:#2e4eb8}
.claim-tab.active{color:#2547bd;background:#edf2ff;border-color:#dbe4ff}
.claim-tab-icon{display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;flex-shrink:0;border-radius:10px;background:#f0f3f8;color:#53647b;font-size:21px;font-weight:800}
.claim-tab.active .claim-tab-icon{color:#fff;background:#4057cf}
.claim-tab-label{display:flex;flex-direction:column;align-items:flex-start;gap:4px;text-align:left;min-width:0}
.claim-tab-label small{color:#7a8aa1;font-size:12px;font-weight:600;white-space:normal}
.claim-tab.active .claim-tab-label small{color:#5368b4}
.claim-management-content{min-width:0;padding:25px;background:#fff;border:1px solid #e1e8f2;border-radius:17px;box-shadow:0 7px 24px rgba(25,42,70,.045)}
.claim-management-content-heading{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-bottom:23px;padding-bottom:19px;border-bottom:1px solid #e9eef5}
.claim-management-content-heading h2{margin:0;color:#172b4d;font-size:24px;font-weight:800;letter-spacing:-.3px}
.claim-management-content-heading p{margin:7px 0 0;color:#64748b;font-size:15px;font-weight:500;line-height:1.6}
.claim-management-section-tag{display:inline-flex;align-items:center;gap:7px;padding:9px 13px;border-radius:9px;color:#344db5;background:#eef2ff;font-size:13px;font-weight:800;white-space:nowrap}
.claim-management-content .create-claim-page{padding:0}
.claim-management-content .create-claim-header{display:none}
.claim-management-content .create-claim-card{box-shadow:none;border-color:#e3e9f2}
.claim-management-content .create-claim-section-title{font-size:20px;font-weight:800}
.claim-management-content .create-claim-label{font-size:15px;font-weight:800}
.claim-management-content .create-claim-input,.claim-management-content .create-claim-select,.claim-management-content .create-claim-textarea{font-size:15px}
.claim-management-content .create-claim-button{font-size:14px;font-weight:800}
.claim-management-content .create-claim-patient-name{font-size:16px;font-weight:800}
.claim-management-content .create-claim-result{gap:15px}
.claim-management-content .create-claim-results{position:relative;z-index:1}
.claim-management-content .claim-page{padding:0;background:transparent}
.claim-management-content .claim-container{max-width:none}
.claim-management-content .claim-title,.claim-management-content .claim-subtitle{display:none}
.claim-management-alert-error{margin:0 0 18px;padding:14px 16px;border:1px solid #fecaca;border-radius:11px;background:#fef2f2;color:#b91c1c;font-size:14px;line-height:1.6}
.claim-management-loading{padding:35px;text-align:center;color:#64748b}

/* Excel upload */
.claim-upload-page{width:100%}
.claim-upload-intro{margin-bottom:22px}
.claim-upload-intro h3{margin:0 0 8px;color:#172b4d;font-size:20px;font-weight:800}
.claim-upload-intro p{margin:0;color:#64748b;font-size:14px;line-height:1.7}
.claim-upload-dropzone{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:230px;padding:30px;border:2px dashed #bdc9e0;border-radius:15px;background:#f8faff;text-align:center;transition:.2s}
.claim-upload-dropzone:hover{border-color:#4057cf;background:#f2f5ff}
.claim-upload-icon{display:flex;align-items:center;justify-content:center;width:58px;height:58px;margin-bottom:15px;border-radius:15px;background:#e9efff;color:#4057cf;font-size:29px;font-weight:800}
.claim-upload-dropzone h4{margin:0 0 8px;color:#172b4d;font-size:17px;font-weight:800}
.claim-upload-dropzone p{margin:0 0 17px;color:#718096;font-size:13px;line-height:1.6}
.claim-upload-button{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:43px;padding:11px 19px;border:0;border-radius:10px;background:#4057cf;color:#fff;font-size:14px;font-weight:800;cursor:pointer}
.claim-upload-button:hover{background:#3047bd}
.claim-upload-button:disabled{opacity:.6;cursor:not-allowed}
.claim-upload-secondary{background:#eef2ff;color:#344db5;border:1px solid #dbe4ff}
.claim-upload-secondary:hover{background:#e2e9ff}
.claim-upload-file-input{display:none}
.claim-upload-file-info{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:18px;padding:14px 16px;border:1px solid #dce5f2;border-radius:11px;background:#fff}
.claim-upload-file-name{display:flex;align-items:center;gap:10px;min-width:0;color:#334155;font-size:14px;font-weight:700;overflow-wrap:anywhere}
.claim-upload-file-name span:first-child{font-size:21px}
.claim-upload-clear{border:0;background:transparent;color:#dc2626;font-size:13px;font-weight:800;cursor:pointer}
.claim-upload-error{margin-top:15px;padding:13px 15px;border:1px solid #fecaca;border-radius:10px;background:#fef2f2;color:#b91c1c;font-size:14px;line-height:1.6}
.claim-upload-success{margin-top:15px;padding:13px 15px;border:1px solid #bbf7d0;border-radius:10px;background:#f0fdf4;color:#166534;font-size:14px;line-height:1.6}
.claim-upload-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:13px;margin:22px 0}
.claim-upload-summary-card{padding:17px;border:1px solid #e1e8f2;border-radius:12px;background:#fff}
.claim-upload-summary-card span{display:block;margin-bottom:7px;color:#718096;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px}
.claim-upload-summary-card strong{display:block;color:#172b4d;font-size:25px;font-weight:800}
.claim-upload-preview{margin-top:25px}
.claim-upload-preview-header{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:14px}
.claim-upload-preview-header h3{margin:0;color:#172b4d;font-size:18px;font-weight:800}
.claim-upload-table-wrap{width:100%;overflow:auto;border:1px solid #e1e8f2;border-radius:11px}
.claim-upload-table{width:100%;border-collapse:collapse;min-width:650px;background:#fff}
.claim-upload-table th{padding:13px 15px;background:#f3f6fc;color:#475569;font-size:12px;font-weight:800;text-align:left;white-space:nowrap;border-bottom:1px solid #e1e8f2}
.claim-upload-table td{padding:12px 15px;color:#334155;font-size:13px;border-bottom:1px solid #edf1f6;white-space:nowrap;max-width:280px;overflow:hidden;text-overflow:ellipsis}
.claim-upload-table tr:last-child td{border-bottom:0}
.claim-upload-table tbody tr:hover{background:#f8faff}
.claim-upload-note{margin-top:17px;padding:13px 15px;border-radius:10px;background:#f8faff;color:#64748b;font-size:13px;line-height:1.7}
.claim-upload-empty{padding:25px;text-align:center;color:#94a3b8;font-size:14px}
.claim-upload-pagination{margin-top:12px;color:#64748b;font-size:13px;text-align:right}
.claim-upload-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:20px}
.claim-upload-result{margin-top:18px;padding:16px;border:1px solid #dbe4f0;border-radius:11px;background:#f8faff;color:#334155;font-size:14px;line-height:1.7}
.claim-upload-result strong{color:#172b4d}
.claim-upload-result ul{margin:9px 0 0;padding-left:20px}
.claim-upload-warning{margin-top:12px;padding:12px 14px;border:1px solid #fde68a;border-radius:10px;background:#fffbeb;color:#92400e;font-size:13px;line-height:1.6}

@media(min-width:1200px){.claim-management{padding:32px}.claim-management-content{padding:30px}}
@media(max-width:1050px){.claim-tab{gap:7px;padding:12px 8px;font-size:13px}.claim-tab-icon{width:33px;height:33px;font-size:18px}}
@media(max-width:900px){.claim-tab-bar{grid-template-columns:repeat(2,minmax(0,1fr))}.claim-tab{justify-content:flex-start;padding:12px}}
@media(max-width:750px){.claim-management{padding:15px}.claim-management-header{padding:24px 21px;border-radius:15px}.claim-management-header h1{font-size:28px}.claim-management-header p{font-size:15px}.claim-management-header-bottom{align-items:flex-start;flex-direction:column}.claim-back-button{width:100%}.claim-tab{min-height:65px;gap:8px;padding:11px 8px;font-size:14px}.claim-tab-icon{width:32px;height:32px;font-size:18px}.claim-tab-label small{font-size:12px}.claim-management-content{padding:17px;border-radius:14px}.claim-management-content-heading h2{font-size:22px}}
@media(max-width:520px){.claim-tab-bar{grid-template-columns:minmax(0,1fr)}.claim-tab{justify-content:flex-start;padding:12px 15px}.claim-management-content{padding:13px}.claim-management-content-heading{align-items:flex-start;flex-direction:column}.claim-upload-summary{grid-template-columns:1fr}.claim-upload-dropzone{padding:22px 15px}}
`;

/* -----------------------------------------------------
   GENERAL HELPERS
----------------------------------------------------- */

function getApiError(error) {
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

function getClaimDatabaseId(claim) {
  const id =
    claim?.id ??
    claim?.pk ??
    claim?.claim_pk ??
    claim?.claimPk ??
    claim?.database_id ??
    claim?.databaseId;

  return id === undefined || id === null || id === "" ? null : id;
}

function getClaimReference(details) {
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

function getPatientId(details) {
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

/* -----------------------------------------------------
   EXCEL IMPORT HELPERS
----------------------------------------------------- */

function normalizeHeader(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_\-./\\()[\]]+/g, "")
    .replace(/[^a-z0-9]/g, "");
}

const EXCEL_FIELD_ALIASES = {
  patientFileNumber: [
    "patientfilenumber",
    "filenumber",
    "patientfile",
    "patientmrn",
    "mrn",
    "medicalrecordnumber",
    "patientnumber",
    "patientidnumber",
  ],
  claimId: [
    "claimid",
    "claimnumber",
    "claimreference",
    "claimref",
    "claimno",
  ],
  requestingClinician: [
    "requestingclinician",
    "requestingdoctor",
    "clinician",
    "doctor",
    "physician",
    "referringdoctor",
  ],
  authorizationNumber: [
    "authorizationnumber",
    "authorizationno",
    "authorization",
    "authnumber",
    "authno",
    "approvalnumber",
    "approvalno",
  ],
  approvalDate: [
    "approvaldate",
    "dateofapproval",
    "authorizationdate",
    "authdate",
  ],
  expirationDate: [
    "expirationdate",
    "expirydate",
    "validuntil",
    "authorizationexpiry",
    "authorizationexpirationdate",
    "enddate",
  ],
  approvedVisits: [
    "approvedvisits",
    "numberofapprovedvisits",
    "approvedvisit",
    "visitsapproved",
    "visitunits",
  ],
  approvedUnits: [
    "approvedunits",
    "numberofapprovedunits",
    "unitsapproved",
    "approvedquantity",
  ],
  approvedService: [
    "approvedservice",
    "approvedprocedure",
    "service",
    "procedure",
    "servicetype",
    "treatment",
  ],
  payer: [
    "insurance",
    "payer",
    "insurancecompany",
    "insuranceprovider",
    "insurancepayer",
    "payor",
  ],
  status: [
    "approvalstatus",
    "claimstatus",
    "status",
    "authorizationstatus",
  ],
  rejectionReason: [
    "rejectionreason",
    "reasonforrejection",
    "denialreason",
    "rejectionremarks",
  ],
};

function getRowValue(row, aliases) {
  const rowKeys = Object.keys(row);

  for (const alias of aliases) {
    const normalizedAlias = normalizeHeader(alias);

    const matchingKey = rowKeys.find(
      (key) => normalizeHeader(key) === normalizedAlias
    );

    if (matchingKey !== undefined) {
      return row[matchingKey];
    }
  }

  return "";
}

function cleanExcelValue(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function excelDateToISO(value) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // Excel serial date.
  if (typeof value === "number" && Number.isFinite(value)) {
    const parsed = XLSX.SSF.parse_date_code(value);

    if (parsed) {
      const year = String(parsed.y).padStart(4, "0");
      const month = String(parsed.m).padStart(2, "0");
      const day = String(parsed.d).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
  }

  const text = String(value).trim();

  if (!text) return "";

  // Already in ISO format.
  const isoMatch = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);

  if (isoMatch) {
    return `${isoMatch[1]}-${String(isoMatch[2]).padStart(2, "0")}-${String(
      isoMatch[3]
    ).padStart(2, "0")}`;
  }

  // Handle common day/month/year and month/day/year formats.
  const slashMatch = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);

  if (slashMatch) {
    const first = Number(slashMatch[1]);
    const second = Number(slashMatch[2]);
    let year = Number(slashMatch[3]);

    if (year < 100) year += year < 50 ? 2000 : 1900;

    // If the first value cannot be a month, treat it as day/month/year.
    // Otherwise, use month/day/year for Excel's common US date display.
    let month;
    let day;

    if (first > 12) {
      day = first;
      month = second;
    } else {
      month = first;
      day = second;
    }

    const date = new Date(year, month - 1, day);

    if (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    ) {
      return `${year}-${String(month).padStart(2, "0")}-${String(
        day
      ).padStart(2, "0")}`;
    }
  }

  return text;
}

function parseExcelNumber(value, fieldName, rowNumber) {
  if (value === null || value === undefined || value === "") return null;

  const number = Number(String(value).replace(/,/g, "").trim());

  if (!Number.isFinite(number) || number < 0 || !Number.isInteger(number)) {
    throw new Error(
      `Excel row ${rowNumber}: ${fieldName} must be a non-negative whole number.`
    );
  }

  return number;
}

function normalizeClaimStatus(value) {
  const status = cleanExcelValue(value).toLowerCase();

  if (!status) return "Pending";

  if (["approved", "approve", "authorized", "authorised"].includes(status)) {
    return "Approved";
  }

  if (["rejected", "reject", "denied", "declined"].includes(status)) {
    return "Rejected";
  }

  if (["submitted", "sent", "in review", "under review"].includes(status)) {
    return "Submitted";
  }

  if (["pending", "waiting"].includes(status)) {
    return "Pending";
  }

  return cleanExcelValue(value);
}

function convertExcelRowsToClaims(rows) {
  return rows.map((row) => {
    const rowNumber = row.__rowNumber || "?";

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
      throw new Error(`Excel row ${rowNumber}: Claim ID is missing.`);
    }

    const approvedVisits = parseExcelNumber(
      getRowValue(row, EXCEL_FIELD_ALIASES.approvedVisits),
      "Approved Visits",
      rowNumber
    );

    const approvedUnits = parseExcelNumber(
      getRowValue(row, EXCEL_FIELD_ALIASES.approvedUnits),
      "Approved Units",
      rowNumber
    );

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
      approvedVisits,
      approvedUnits,
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

/* -----------------------------------------------------
   EXCEL UPLOAD COMPONENT
----------------------------------------------------- */

function UploadClaims({ onImportComplete }) {
  const [fileName, setFileName] = useState("");
  const [sheetName, setSheetName] = useState("");
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const MAX_PREVIEW_ROWS = 100;

  const clearUpload = () => {
    if (importing) return;

    setFileName("");
    setSheetName("");
    setHeaders([]);
    setRows([]);
    setError("");
    setSuccess("");
    setImportResult(null);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];

    setError("");
    setSuccess("");
    setImportResult(null);

    if (!file) return;

    const extension = file.name.split(".").pop()?.toLowerCase();

    if (!["xlsx", "xls"].includes(extension)) {
      setError("Please upload a valid Excel file (.xlsx or .xls).");
      event.target.value = "";
      return;
    }

    setFileName(file.name);

    const reader = new FileReader();

    reader.onload = (loadEvent) => {
      try {
        const data = loadEvent.target.result;

        const workbook = XLSX.read(data, {
          type: "array",
          cellDates: true,
        });

        if (!workbook.SheetNames.length) {
          throw new Error("The Excel file does not contain any worksheets.");
        }

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const extractedData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: "",
          raw: true,
          blankrows: false,
        });

        if (!extractedData.length) {
          throw new Error("The selected worksheet is empty.");
        }

        const extractedHeaders = extractedData[0].map((header, index) => {
          const value = String(header ?? "").trim();
          return value || `Column ${index + 1}`;
        });

        const extractedRows = extractedData
          .slice(1)
          .filter((row) =>
            row.some(
              (cell) =>
                cell !== null &&
                cell !== undefined &&
                String(cell).trim() !== ""
            )
          )
          .map((row, index) => {
            const record = {
              __rowNumber: index + 2,
            };

            extractedHeaders.forEach((header, columnIndex) => {
              record[header] = row[columnIndex] ?? "";
            });

            return record;
          });

        if (!extractedRows.length) {
          throw new Error(
            "The worksheet contains column headings but no claim records."
          );
        }

        // Check that the spreadsheet contains the two essential columns.
        const normalizedHeaders = extractedHeaders.map(normalizeHeader);

        const hasPatientFileNumber =
          EXCEL_FIELD_ALIASES.patientFileNumber.some((alias) =>
            normalizedHeaders.includes(normalizeHeader(alias))
          );

        const hasClaimId = EXCEL_FIELD_ALIASES.claimId.some((alias) =>
          normalizedHeaders.includes(normalizeHeader(alias))
        );

        if (!hasPatientFileNumber || !hasClaimId) {
          throw new Error(
            "The Excel file must contain Patient File Number and Claim ID columns. Please check the column headings."
          );
        }

        // Validate every row before allowing import.
        const convertedRows = convertExcelRowsToClaims(extractedRows);

        setSheetName(firstSheetName);
        setHeaders(extractedHeaders);
        setRows(extractedRows);
        setSuccess(
          `Successfully extracted ${convertedRows.length} records from worksheet "${firstSheetName}". Review the records before importing.`
        );
      } catch (uploadError) {
        setFileName("");
        setSheetName("");
        setHeaders([]);
        setRows([]);
        setError(
          uploadError.message ||
            "Unable to read this Excel file. Please check its format."
        );
      }
    };

    reader.onerror = () => {
      setError("The selected file could not be read.");
    };

    reader.readAsArrayBuffer(file);
    event.target.value = "";
  };

  const downloadExtractedData = () => {
    if (!rows.length || !headers.length) return;

    const exportRows = rows.map((row) => {
      const record = {};

      headers.forEach((header) => {
        record[header] = row[header] ?? "";
      });

      return record;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Extracted Claims");

    XLSX.writeFile(workbook, "extracted_claims.xlsx");
  };

  const handleImport = async () => {
    setError("");
    setSuccess("");
    setImportResult(null);

    if (!rows.length) {
      setError("Please upload an Excel file before importing.");
      return;
    }

    let claims;

    try {
      claims = convertExcelRowsToClaims(rows);
    } catch (validationError) {
      setError(validationError.message);
      return;
    }

    setImporting(true);

    try {
      const response = await api.post(
        "rcm/claims/bulk-import/",
        { claims },
        { withCredentials: true }
      );

      const result = response?.data || {};

      setImportResult(result);

      const imported =
        result.imported ??
        result.created ??
        result.successful ??
        result.created_count ??
        0;

      const updated =
        result.updated ??
        result.updated_count ??
        0;

      const failed =
        result.failed ??
        result.errors_count ??
        result.failed_count ??
        0;

      setSuccess(
        result.message ||
          `Import completed. Imported: ${imported}, Updated: ${updated}, Failed: ${failed}.`
      );

      if (typeof onImportComplete === "function") {
        onImportComplete();
      }
    } catch (importError) {
      setError(getApiError(importError));
    } finally {
      setImporting(false);
    }
  };

  const getImportErrors = () => {
    if (!importResult) return [];

    const possibleErrors =
      importResult.errors ??
      importResult.results?.filter(
        (item) => item.success === false || item.error
      ) ??
      [];

    return Array.isArray(possibleErrors) ? possibleErrors : [];
  };

  const getResultCount = (keys) => {
    if (!importResult) return 0;

    for (const key of keys) {
      if (importResult[key] !== undefined) {
        return Number(importResult[key]) || 0;
      }
    }

    return 0;
  };

  return (
    <div className="claim-upload-page">
      <div className="claim-upload-intro">
        <h3>Upload Claims from Excel</h3>
        <p>
          Upload your Excel spreadsheet containing patient claim and approval
          information. Review the extracted records, then import them into
          Claims Management.
        </p>
      </div>

      <label className="claim-upload-dropzone" htmlFor="claims-excel-file">
        <div className="claim-upload-icon" aria-hidden="true">
          ⇧
        </div>

        <h4>Select your Excel file</h4>

        <p>
          Choose an Excel spreadsheet from your device.
          <br />
          Supported formats: .xlsx and .xls
        </p>

        <span className="claim-upload-button">
          Browse Excel File
        </span>

        <input
          id="claims-excel-file"
          className="claim-upload-file-input"
          type="file"
          accept=".xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={handleFileUpload}
          disabled={importing}
        />
      </label>

      {fileName && (
        <div className="claim-upload-file-info">
          <div className="claim-upload-file-name">
            <span aria-hidden="true">📊</span>
            <span>{fileName}</span>
          </div>

          <button
            type="button"
            className="claim-upload-clear"
            onClick={clearUpload}
            disabled={importing}
          >
            Remove file
          </button>
        </div>
      )}

      {error && (
        <div className="claim-upload-error" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="claim-upload-success" role="status">
          {success}
        </div>
      )}

      {rows.length > 0 && (
        <>
          <div className="claim-upload-summary">
            <div className="claim-upload-summary-card">
              <span>Total extracted records</span>
              <strong>{rows.length}</strong>
            </div>

            <div className="claim-upload-summary-card">
              <span>Excel columns</span>
              <strong>{headers.length}</strong>
            </div>

            <div className="claim-upload-summary-card">
              <span>Worksheet</span>
              <strong
                style={{
                  fontSize: "17px",
                  overflowWrap: "anywhere",
                }}
              >
                {sheetName}
              </strong>
            </div>
          </div>

          <div className="claim-upload-preview">
            <div className="claim-upload-preview-header">
              <h3>Extracted Claims Preview</h3>

              <button
                type="button"
                className="claim-upload-button claim-upload-secondary"
                onClick={downloadExtractedData}
                disabled={importing}
              >
                ↓ Download Extracted Data
              </button>
            </div>

            <div className="claim-upload-table-wrap">
              <table className="claim-upload-table">
                <thead>
                  <tr>
                    <th>Excel Row</th>

                    {headers.map((header, index) => (
                      <th key={`${header}-${index}`}>{header}</th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {rows.slice(0, MAX_PREVIEW_ROWS).map((row, index) => (
                    <tr key={`${row.__rowNumber}-${index}`}>
                      <td>{row.__rowNumber}</td>

                      {headers.map((header, columnIndex) => {
                        const value = row[header];

                        const displayValue =
                          value instanceof Date
                            ? excelDateToISO(value)
                            : String(value ?? "");

                        return (
                          <td
                            key={`${header}-${columnIndex}`}
                            title={displayValue}
                          >
                            {displayValue || "—"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="claim-upload-pagination">
              Showing {Math.min(rows.length, MAX_PREVIEW_ROWS)} of{" "}
              {rows.length} records
            </div>
          </div>

          <div className="claim-upload-note">
            <strong>Important:</strong> Each row must contain a Patient File
            Number and Claim ID. The patient must already exist in your
            hospital patient database. Existing matching claims may be updated
            by the backend.
          </div>

          <div className="claim-upload-actions">
            <button
              type="button"
              className="claim-upload-button"
              onClick={handleImport}
              disabled={importing || !rows.length}
            >
              {importing ? "Importing Claims..." : "Import Claims to Database"}
            </button>

            <button
              type="button"
              className="claim-upload-button claim-upload-secondary"
              onClick={clearUpload}
              disabled={importing}
            >
              Clear Upload
            </button>
          </div>
        </>
      )}

      {importResult && (
        <div className="claim-upload-result" role="status">
          <strong>Import Results</strong>

          <ul>
            <li>
              Imported:{" "}
              {getResultCount([
                "imported",
                "created",
                "successful",
                "created_count",
              ])}
            </li>
            <li>
              Updated:{" "}
              {getResultCount(["updated", "updated_count"])}
            </li>
            <li>
              Failed:{" "}
              {getResultCount([
                "failed",
                "errors_count",
                "failed_count",
              ])}
            </li>
          </ul>

          {getImportErrors().length > 0 && (
            <div className="claim-upload-warning">
              <strong>Rows requiring attention:</strong>
              <ul>
                {getImportErrors().slice(0, 20).map((item, index) => (
                  <li key={index}>
                    {typeof item === "string"
                      ? item
                      : `Row ${item.rowNumber ?? item.row ?? "?"}: ${
                          item.error ?? item.message ?? JSON.stringify(item)
                        }`}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* -----------------------------------------------------
   CLAIMS MANAGEMENT MAIN PAGE
----------------------------------------------------- */

export default function ClaimsManagement() {
  const navigate = useNavigate();
  const location = useLocation();

  // Keep the edit navigation state available until CreateClaim reads it.
  const routeState = location.state;

  const editClaim =
    routeState?.mode === "edit" &&
    routeState?.editClaim &&
    typeof routeState.editClaim === "object"
      ? routeState.editClaim
      : null;

  const editClaimId =
    routeState?.claimId ?? getClaimDatabaseId(editClaim);

  const isEditMode = Boolean(editClaim && editClaimId);

  const [activeTab, setActiveTab] = useState("create");
  const [refreshKey, setRefreshKey] = useState(0);
  const [alertError, setAlertError] = useState("");
  const [selectedRenewalAlert, setSelectedRenewalAlert] = useState(null);

  useEffect(() => {
    if (isEditMode) {
      setSelectedRenewalAlert(null);
      setActiveTab("create");
      setAlertError("");
    }
  }, [isEditMode, editClaimId]);

  function handleBack() {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/rcm");
    }
  }

  const refreshData = useCallback(() => {
    setRefreshKey((previous) => previous + 1);
  }, []);

  const handleClaimCreated = useCallback(() => {
    refreshData();
    setSelectedRenewalAlert(null);
    setActiveTab("history");
    setAlertError("");
  }, [refreshData]);

  const handleImportComplete = useCallback(() => {
    refreshData();
  }, [refreshData]);

  const handleCreateAlert = useCallback(
    async (alertDetails) => {
      setAlertError("");

      const patientId = getPatientId(alertDetails);
      const alertType = String(
        alertDetails?.alertType || alertDetails?.alert_type || ""
      ).toLowerCase();

      if (!patientId) {
        throw new Error(
          "Cannot create an alert because the patient ID is missing."
        );
      }

      const claimPk =
        alertDetails?.claimPk ??
        alertDetails?.claim_pk ??
        getClaimDatabaseId(alertDetails?.claim);

      const claimId = getClaimReference(alertDetails);

      if (!claimPk) {
        throw new Error(
          "Cannot create an alert because the saved claim database ID is missing."
        );
      }

      if (!claimId) {
        throw new Error(
          "Cannot create an alert because the claim reference is missing."
        );
      }

      let payload;

      if (alertType === "renewal") {
        const renewalDate = String(
          alertDetails?.renewalDate || alertDetails?.renewal_date || ""
        ).slice(0, 10);

        if (!renewalDate) {
          throw new Error(
            "Choose a renewal date before creating a renewal reminder."
          );
        }

        payload = {
          patientId,
          claimPk,
          claimId,
          alertType: "renewal",
          renewalDate,
          status: "Rejected",
          renewalStatus: "Rejected",
          renewal_status: "Rejected",
          message: `Claim ${claimId} renewal reminder`,
        };
      } else if (alertType === "rejection") {
        payload = {
          patientId,
          claimPk,
          claimId,
          alertType: "rejection",
          rejectionReason:
            alertDetails?.rejectionReason ??
            alertDetails?.rejection_reason ??
            "",
          message: `Claim ${claimId} was rejected`,
        };
      } else {
        throw new Error("Unsupported claim alert type.");
      }

      Object.keys(payload).forEach((key) => {
        if (
          payload[key] === null ||
          payload[key] === undefined ||
          payload[key] === ""
        ) {
          delete payload[key];
        }
      });

      try {
        const response = await api.post(
          "rcm/renewal-alerts/",
          payload,
          { withCredentials: true }
        );

        refreshData();
        return response?.data;
      } catch (error) {
        const message = getApiError(error);
        setAlertError(message);
        throw new Error(message);
      }
    },
    [refreshData]
  );

  const handleRenewal = useCallback((alert) => {
    setAlertError("");
    setSelectedRenewalAlert(alert);
    setActiveTab("create");
  }, []);

  const handleRenewalUpdated = useCallback(() => {
    refreshData();
    setSelectedRenewalAlert(null);
    setAlertError("");
    setActiveTab("history");
  }, [refreshData]);

  const getPageHeading = () => {
    if (activeTab === "create") {
      if (isEditMode) return "Edit Claim";

      return selectedRenewalAlert
        ? "Renew Existing Claim"
        : "New Claim Registration";
    }

    if (activeTab === "upload") return "Upload Claims";

    if (activeTab === "history") return "Claim History";

    return "Renewal Alerts";
  };

  const getPageDescription = () => {
    if (activeTab === "create") {
      if (isEditMode) {
        return "Update the selected claim record and save your changes.";
      }

      return selectedRenewalAlert
        ? "Review the existing claim details before submitting its renewal."
        : "Select a patient and complete the claim information.";
    }

    if (activeTab === "upload") {
      return "Upload, preview, and import claim approval details from Excel.";
    }

    if (activeTab === "history") {
      return "Search and review existing claim records.";
    }

    return "Review scheduled renewals and search claims by Claim ID.";
  };

  const getActiveTabLabel = () => {
    if (activeTab === "create") {
      return isEditMode
        ? "✎ EDIT CLAIM"
        : selectedRenewalAlert
          ? "↻ RENEW CLAIM"
          : "＋ CREATE CLAIM";
    }

    if (activeTab === "upload") return "⇧ UPLOAD CLAIMS";

    if (activeTab === "history") return "☷ CLAIM RECORDS";

    return "◷ RENEWAL ALERTS";
  };

  return (
    <main className="claim-management">
      <style>{styles}</style>

      <header className="claim-management-header">
        <div className="claim-management-header-content">
          <div className="claim-management-topline">
            <span className="claim-management-topline-dot" />
            Revenue Cycle Management
          </div>

          <h1>Claims Management</h1>

          <p>
            Manage patient claims, register new claim records, upload Excel
            spreadsheets, and review claim history and scheduled renewals from
            one organized workspace.
          </p>

          <div className="claim-management-header-bottom">
            <div className="claim-management-header-note">
              Patient claims · Submission tracking · Renewal reminders
            </div>

            <button
              type="button"
              className="claim-back-button"
              onClick={handleBack}
            >
              <span aria-hidden="true">←</span>
              Back to Previous Page
            </button>
          </div>
        </div>
      </header>

      <nav className="claim-management-tabs-card">
        <div
          className="claim-tab-bar"
          role="tablist"
          aria-label="Claim sections"
        >
          <button
            type="button"
            role="tab"
            id="create-claim-tab"
            aria-controls="claim-management-panel"
            aria-selected={activeTab === "create"}
            className={`claim-tab ${activeTab === "create" ? "active" : ""}`}
            onClick={() => {
              setSelectedRenewalAlert(null);
              setActiveTab("create");
              setAlertError("");
            }}
          >
            <span className="claim-tab-icon" aria-hidden="true">
              +
            </span>

            <span className="claim-tab-label">
              <span>Create New Claim</span>
              <small>Register a patient claim</small>
            </span>
          </button>

          <button
            type="button"
            role="tab"
            id="upload-claims-tab"
            aria-controls="claim-management-panel"
            aria-selected={activeTab === "upload"}
            className={`claim-tab ${activeTab === "upload" ? "active" : ""}`}
            onClick={() => {
              setSelectedRenewalAlert(null);
              setActiveTab("upload");
              setAlertError("");
            }}
          >
            <span className="claim-tab-icon" aria-hidden="true">
              ⇧
            </span>

            <span className="claim-tab-label">
              <span>Upload Claims</span>
              <small>Import Excel data</small>
            </span>
          </button>

          <button
            type="button"
            role="tab"
            id="claim-history-tab"
            aria-controls="claim-management-panel"
            aria-selected={activeTab === "history"}
            className={`claim-tab ${activeTab === "history" ? "active" : ""}`}
            onClick={() => {
              setSelectedRenewalAlert(null);
              setActiveTab("history");
              setAlertError("");
            }}
          >
            <span className="claim-tab-icon" aria-hidden="true">
              ☷
            </span>

            <span className="claim-tab-label">
              <span>Claim History</span>
              <small>Review and track claims</small>
            </span>
          </button>

          <button
            type="button"
            role="tab"
            id="renewal-alerts-tab"
            aria-controls="claim-management-panel"
            aria-selected={activeTab === "alerts"}
            className={`claim-tab ${activeTab === "alerts" ? "active" : ""}`}
            onClick={() => {
              setSelectedRenewalAlert(null);
              setActiveTab("alerts");
              setAlertError("");
            }}
          >
            <span className="claim-tab-icon" aria-hidden="true">
              ◷
            </span>

            <span className="claim-tab-label">
              <span>Renewal Alerts</span>
              <small>Track scheduled renewals</small>
            </span>
          </button>
        </div>
      </nav>

      <section
        className="claim-management-content"
        id="claim-management-panel"
        role="tabpanel"
        aria-labelledby={
          activeTab === "create"
            ? "create-claim-tab"
            : activeTab === "upload"
              ? "upload-claims-tab"
              : activeTab === "history"
                ? "claim-history-tab"
                : "renewal-alerts-tab"
        }
      >
        <div className="claim-management-content-heading">
          <div>
            <h2>{getPageHeading()}</h2>
            <p>{getPageDescription()}</p>
          </div>

          <span className="claim-management-section-tag">
            {getActiveTabLabel()}
          </span>
        </div>

        {alertError && (
          <div className="claim-management-alert-error" role="alert">
            {alertError}
          </div>
        )}

        {activeTab === "create" ? (
          <CreateClaim
            key={
              isEditMode
                ? `edit-${editClaimId}`
                : selectedRenewalAlert
                  ? `renewal-${selectedRenewalAlert.id}`
                  : "new-claim"
            }
            editClaim={editClaim}
            editClaimId={editClaimId}
            renewalAlert={selectedRenewalAlert}
            onClaimCreated={handleClaimCreated}
            onRenewalUpdated={handleRenewalUpdated}
            onCreateAlert={handleCreateAlert}
          />
        ) : activeTab === "upload" ? (
          <UploadClaims onImportComplete={handleImportComplete} />
        ) : activeTab === "history" ? (
          <ClaimHistory refreshKey={refreshKey} />
        ) : (
          <RenewalAlerts
            key={refreshKey}
            onRenewal={handleRenewal}
          />
        )}
      </section>
    </main>
  );
}
