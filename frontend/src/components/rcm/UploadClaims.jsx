
import React, { useState } from "react";
import * as XLSX from "xlsx";
import api from "../../api/api";

/* =========================================================
   EXCEL HELPERS
========================================================= */

const MAX_PREVIEW_ROWS = 100;

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
    "patientid",
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

function normalizeHeader(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function cleanValue(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function getRowValue(row, aliases) {
  const keys = Object.keys(row);

  for (const alias of aliases) {
    const matchingKey = keys.find(
      (key) => normalizeHeader(key) === normalizeHeader(alias)
    );

    if (matchingKey !== undefined) {
      return row[matchingKey];
    }
  }

  return "";
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

  const isoMatch = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);

  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2].padStart(2, "0")}-${isoMatch[3].padStart(2, "0")}`;
  }

  // Supports DD/MM/YYYY and MM/DD/YYYY.
  // If the first number is greater than 12, it is treated as the day.
  const slashMatch = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);

  if (slashMatch) {
    const first = Number(slashMatch[1]);
    const second = Number(slashMatch[2]);

    let year = Number(slashMatch[3]);

    if (year < 100) {
      year += year < 50 ? 2000 : 1900;
    }

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
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }

  return text;
}

function parseExcelNumber(value, fieldName, rowNumber) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(String(value).replace(/,/g, "").trim());

  if (!Number.isFinite(number) || number < 0 || !Number.isInteger(number)) {
    throw new Error(
      `Excel row ${rowNumber}: ${fieldName} must be a non-negative whole number.`
    );
  }

  return number;
}

function normalizeClaimStatus(value) {
  const status = cleanValue(value).toLowerCase();

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

  return cleanValue(value);
}

function convertExcelRowsToClaims(rows) {
  return rows.map((row) => {
    const rowNumber = row.__rowNumber || "?";

    const patientFileNumber = cleanValue(
      getRowValue(row, EXCEL_FIELD_ALIASES.patientFileNumber)
    );

    const claimId = cleanValue(
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

    return {
      rowNumber,
      patientFileNumber,
      claimId,
      requestingClinician: cleanValue(
        getRowValue(row, EXCEL_FIELD_ALIASES.requestingClinician)
      ),
      authorizationNumber: cleanValue(
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
      approvedService: cleanValue(
        getRowValue(row, EXCEL_FIELD_ALIASES.approvedService)
      ),
      payer: cleanValue(
        getRowValue(row, EXCEL_FIELD_ALIASES.payer)
      ),
      status: normalizeClaimStatus(
        getRowValue(row, EXCEL_FIELD_ALIASES.status)
      ),
      rejectionReason: cleanValue(
        getRowValue(row, EXCEL_FIELD_ALIASES.rejectionReason)
      ),
    };
  });
}

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

function getImportCount(result, keys) {
  for (const key of keys) {
    if (result?.[key] !== undefined && result?.[key] !== null) {
      const value = Number(result[key]);

      if (Number.isFinite(value)) return value;
    }
  }

  return 0;
}

function getImportRowErrors(result) {
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
      row: item?.rowNumber ?? item?.row ?? item?.excel_row ?? "?",
      message:
        item?.message ??
        item?.error ??
        item?.detail ??
        "The backend rejected this row.",
    }));
}

/* =========================================================
   UPLOAD CLAIMS COMPONENT
========================================================= */

export default function UploadClaims({ onImportComplete }) {
  const [fileName, setFileName] = useState("");
  const [sheetName, setSheetName] = useState("");
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const clearUpload = () => {
    if (importing) return;

    setFileName("");
    setSheetName("");
    setHeaders([]);
    setRows([]);
    setError("");
    setSuccess("");
    setImportResult(null);

    const input = document.getElementById("claims-excel-file");
    if (input) input.value = "";
  };

  /* ---------------- READ EXCEL FILE ---------------- */

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
        const workbook = XLSX.read(loadEvent.target.result, {
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
          .map((row, index) => {
            const record = {
              __rowNumber: index + 2,
            };

            extractedHeaders.forEach((header, columnIndex) => {
              record[header] = row[columnIndex] ?? "";
            });

            return record;
          })
          .filter((row) =>
            extractedHeaders.some(
              (header) =>
                row[header] !== null &&
                row[header] !== undefined &&
                String(row[header]).trim() !== ""
            )
          );

        if (!extractedRows.length) {
          throw new Error(
            "The worksheet contains column headings but no claim records."
          );
        }

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
            "The Excel file must contain Patient File Number and Claim ID columns."
          );
        }

        // Validate the extracted data before displaying it.
        convertExcelRowsToClaims(extractedRows);

        setSheetName(firstSheetName);
        setHeaders(extractedHeaders);
        setRows(extractedRows);

        setSuccess(
          `Successfully extracted ${extractedRows.length} records from "${firstSheetName}". Review the records before importing.`
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

    // Allow the same file to be selected again.
    event.target.value = "";
  };

  /* ---------------- DOWNLOAD EXTRACTED DATA ---------------- */

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

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Extracted Claims"
    );

    XLSX.writeFile(workbook, "extracted_claims.xlsx");
  };

  /* ---------------- IMPORT TO DATABASE ---------------- */

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

      const created = getImportCount(result, [
        "created",
        "imported",
        "successful",
        "created_count",
      ]);

      const updated = getImportCount(result, [
        "updated",
        "updated_count",
      ]);

      const failed = getImportCount(result, [
        "failed",
        "errors_count",
        "failed_count",
      ]);

      const total =
        getImportCount(result, ["total"]) || claims.length;

      if (created + updated > 0) {
        setSuccess(
          `Import completed. ${created} created and ${updated} updated.`
        );

        if (typeof onImportComplete === "function") {
          await onImportComplete();
        }
      }

      if (failed > 0) {
        setError(
          `${failed} of ${total} records could not be imported. Review the results below.`
        );
      } else if (created + updated === 0) {
        setError(
          "The server did not report any created or updated claims. Please review the response below."
        );
      }
    } catch (importError) {
      const responseData = importError?.response?.data;

      if (responseData && typeof responseData === "object") {
        setImportResult(responseData);
      }

      setError(getApiError(importError));
    } finally {
      setImporting(false);
    }
  };

  /* ---------------- IMPORT SUMMARY ---------------- */

  const createdCount = getImportCount(importResult, [
    "created",
    "imported",
    "successful",
    "created_count",
  ]);

  const updatedCount = getImportCount(importResult, [
    "updated",
    "updated_count",
  ]);

  const failedCount = getImportCount(importResult, [
    "failed",
    "errors_count",
    "failed_count",
  ]);

  const totalCount =
    getImportCount(importResult, ["total"]) ||
    (importResult ? rows.length : 0);

  const importErrors = getImportRowErrors(importResult);

  /* =========================================================
     COMPONENT UI
  ========================================================= */

  return (
    <div className="claim-upload-page">
      <div className="claim-upload-intro">
        <h3>Upload Claims from Excel</h3>
        <p>
          Upload your Excel spreadsheet containing patient claim and
          approval information. Review the extracted records before
          importing them into Claims Management.
        </p>
      </div>

      <label
        className="claim-upload-dropzone"
        htmlFor="claims-excel-file"
      >
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
                      <th key={`${header}-${index}`}>
                        {header}
                      </th>
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
            <strong>Important:</strong> Each row must contain a Patient
            File Number and Claim ID. The patient must already exist in
            your hospital patient database. Existing matching claims
            may be updated by the backend.
          </div>

          <div className="claim-upload-actions">
            <button
              type="button"
              className="claim-upload-button"
              onClick={handleImport}
              disabled={importing || !rows.length}
            >
              {importing
                ? "Importing Claims..."
                : "Import Claims to Database"}
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
            <li>Total records: {totalCount}</li>
            <li>Created: {createdCount}</li>
            <li>Updated: {updatedCount}</li>
            <li>Failed: {failedCount}</li>
          </ul>

          {failedCount > 0 && (
            <div className="claim-upload-failure">
              <strong>
                {failedCount === totalCount
                  ? "No claims were imported."
                  : "Some claims could not be imported."}
              </strong>

              <p>
                Review the row-level errors below to identify what
                needs to be corrected.
              </p>
            </div>
          )}

          {importErrors.length > 0 && (
            <div className="claim-upload-warning">
              <strong>Rows requiring attention:</strong>

              <ul className="claim-upload-result-list">
                {importErrors.slice(0, 100).map((item, index) => (
                  <li key={`${item.row}-${index}`}>
                    Excel row {item.row}: {String(item.message)}
                  </li>
                ))}
              </ul>

              {importErrors.length > 100 && (
                <p>
                  Showing the first 100 errors out of{" "}
                  {importErrors.length}.
                </p>
              )}
            </div>
          )}

          {failedCount > 0 && importErrors.length === 0 && (
            <div className="claim-upload-warning">
              The backend reported failed records but did not provide
              individual row messages. The backend response needs to
              be inspected.
            </div>
          )}

          {failedCount === 0 && createdCount + updatedCount > 0 && (
            <div className="claim-upload-success">
              All reported records were imported or updated successfully.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
