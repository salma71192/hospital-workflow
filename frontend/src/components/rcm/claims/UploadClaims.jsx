
import React, { useRef, useState } from "react";
import * as XLSX from "xlsx";
import api from "../../../api/api";

import {
  EXCEL_FIELD_ALIASES,
  normalizeHeader,
  convertExcelRowsToClaims,
  excelDateToISO,
  getImportCount,
  getImportRowErrors,
  getApiError,
} from "./claimExcelUtils";

const MAX_PREVIEW_ROWS = 100;

const CREATED_KEYS = [
  "created", "imported", "successful", "created_count",
];
const UPDATED_KEYS = ["updated", "updated_count"];
const FAILED_KEYS = ["failed", "errors_count", "failed_count"];

export default function UploadClaims({ onImportComplete }) {
  const inputRef = useRef(null);

  const [fileName, setFileName] = useState("");
  const [sheetName, setSheetName] = useState("");
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  function clearUpload() {
    if (importing) return;

    setFileName("");
    setSheetName("");
    setHeaders([]);
    setRows([]);
    setError("");
    setSuccess("");
    setImportResult(null);

    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleFileUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    setSuccess("");
    setImportResult(null);
    setFileName("");
    setSheetName("");
    setHeaders([]);
    setRows([]);

    try {
      const extension = file.name.split(".").pop()?.toLowerCase();

      if (!["xlsx", "xls"].includes(extension)) {
        throw new Error(
          "Please upload a valid Excel file (.xlsx or .xls)."
        );
      }

      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, {
        type: "array",
        cellDates: true,
      });

      if (!workbook.SheetNames.length) {
        throw new Error("The Excel file has no worksheets.");
      }

      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      const extractedData = XLSX.utils.sheet_to_json(
        worksheet,
        {
          header: 1,
          defval: "",
          raw: true,
          blankrows: true,
        }
      );

      if (!extractedData.length) {
        throw new Error("The selected worksheet is empty.");
      }

      const extractedHeaders = extractedData[0].map(
        (header, index) =>
          String(header ?? "").trim() ||
          `Column ${index + 1}`
      );

      const normalizedHeaders =
        extractedHeaders.map(normalizeHeader);

      const duplicates = normalizedHeaders.filter(
        (header, index) =>
          normalizedHeaders.indexOf(header) !== index
      );

      if (duplicates.length) {
        throw new Error(
          "The Excel file contains duplicate column headings."
        );
      }

      const hasRequiredColumn = (field) =>
        EXCEL_FIELD_ALIASES[field].some((alias) =>
          normalizedHeaders.includes(normalizeHeader(alias))
        );

      if (
        !hasRequiredColumn("patientFileNumber") ||
        !hasRequiredColumn("claimId")
      ) {
        throw new Error(
          "The Excel file must contain Patient File Number and Claim ID columns."
        );
      }

      const extractedRows = extractedData
        .slice(1)
        .map((cells, index) => ({
          cells,
          rowNumber: index + 2,
        }))
        .filter(({ cells }) =>
          cells.some(
            (cell) =>
              cell !== null &&
              cell !== undefined &&
              String(cell).trim() !== ""
          )
        )
        .map(({ cells, rowNumber }) => {
          const record = { __rowNumber: rowNumber };

          extractedHeaders.forEach((header, index) => {
            record[header] = cells[index] ?? "";
          });

          return record;
        });

      if (!extractedRows.length) {
        throw new Error(
          "The worksheet contains headings but no claim records."
        );
      }

      const converted = convertExcelRowsToClaims(
        extractedRows
      );

      setFileName(file.name);
      setSheetName(firstSheetName);
      setHeaders(extractedHeaders);
      setRows(extractedRows);

      setSuccess(
        `Successfully extracted ${converted.length} records from worksheet "${firstSheetName}". Review them before importing.`
      );
    } catch (err) {
      setError(
        err?.message || "Unable to read the Excel file."
      );
    } finally {
      event.target.value = "";
    }
  }

  function downloadExtractedData() {
    if (!rows.length || !headers.length) return;

    const exportRows = rows.map((row) => {
      const record = {};

      headers.forEach((header) => {
        record[header] = row[header] ?? "";
      });

      return record;
    });

    const worksheet = XLSX.utils.json_to_sheet(
      exportRows
    );

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Extracted Claims"
    );

    XLSX.writeFile(
      workbook,
      "extracted_claims.xlsx"
    );
  }

  async function handleImport() {
    if (importing) return;

    setError("");
    setSuccess("");
    setImportResult(null);

    if (!rows.length) {
      setError(
        "Please upload an Excel file before importing."
      );
      return;
    }

    let claims;

    try {
      claims = convertExcelRowsToClaims(rows);
    } catch (err) {
      setError(err.message);
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

      const created = getImportCount(
        result,
        CREATED_KEYS
      );
      const updated = getImportCount(
        result,
        UPDATED_KEYS
      );
      const failed = getImportCount(
        result,
        FAILED_KEYS
      );
      const total =
        getImportCount(result, ["total"]) ||
        claims.length;

      if (created + updated > 0) {
        setSuccess(
          `Import completed: ${created} created and ${updated} updated.`
        );

        onImportComplete?.();
      }

      if (failed > 0) {
        setError(
          `${failed} record(s) failed to import. Review the results below.`
        );
      } else if (created + updated === 0) {
        setError(
          "The server did not report any created or updated claims."
        );
      }

      if (created + updated + failed !== total) {
        setError(
          `The server reported ${created + updated + failed} processed records out of ${total}. Review the results below.`
        );
      }
    } catch (err) {
      const responseData = err?.response?.data;

      if (
        responseData &&
        typeof responseData === "object"
      ) {
        setImportResult(responseData);

        const created = getImportCount(
          responseData,
          CREATED_KEYS
        );
        const updated = getImportCount(
          responseData,
          UPDATED_KEYS
        );

        if (created + updated > 0) {
          onImportComplete?.();
        }
      }

      setError(getApiError(err));
    } finally {
      setImporting(false);
    }
  }

  const createdCount = getImportCount(
    importResult,
    CREATED_KEYS
  );
  const updatedCount = getImportCount(
    importResult,
    UPDATED_KEYS
  );
  const failedCount = getImportCount(
    importResult,
    FAILED_KEYS
  );
  const totalCount =
    getImportCount(importResult, ["total"]) ||
    (importResult ? rows.length : 0);

  const importErrors = getImportRowErrors(
    importResult
  );

  return (
    <div className="claim-upload-page">
      <div className="claim-upload-intro">
        <h3>Upload Claims from Excel</h3>
        <p>
          Upload your Excel spreadsheet containing patient
          claim and approval information. Review the extracted
          records, then import them into Claims Management.
        </p>
      </div>

      <label
        className="claim-upload-dropzone"
        htmlFor="claims-excel-file"
      >
        <div
          className="claim-upload-icon"
          aria-hidden="true"
        >
          ⇧
        </div>

        <h4>Select your Excel file</h4>

        <p>
          Choose an Excel spreadsheet from your device.
          Supported formats: .xlsx and .xls
        </p>

        <span className="claim-upload-button">
          Browse Excel File
        </span>

        <input
          ref={inputRef}
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
        <div
          className="claim-upload-error"
          role="alert"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          className="claim-upload-success"
          role="status"
        >
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
                  fontSize: 17,
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
                  {rows
                    .slice(0, MAX_PREVIEW_ROWS)
                    .map((row) => (
                      <tr key={row.__rowNumber}>
                        <td>{row.__rowNumber}</td>

                        {headers.map((header, index) => {
                          const value = row[header];
                          const display =
                            value instanceof Date
                              ? excelDateToISO(value)
                              : String(value ?? "");

                          return (
                            <td
                              key={`${header}-${index}`}
                              title={display}
                            >
                              {display || "—"}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="claim-upload-pagination">
              Showing{" "}
              {Math.min(
                rows.length,
                MAX_PREVIEW_ROWS
              )}{" "}
              of {rows.length} records
            </div>
          </div>

          <div className="claim-upload-note">
            <strong>Important:</strong> Each row must contain
            a Patient File Number and Claim ID. The patient
            must already exist in your hospital patient
            database. Existing matching claims may be updated
            by the backend.
          </div>

          <div className="claim-upload-actions">
            <button
              type="button"
              className="claim-upload-button"
              onClick={handleImport}
              disabled={importing}
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
        <div
          className="claim-upload-result"
          role="status"
        >
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
                Review the row-level errors below.
              </p>
            </div>
          )}

          {importErrors.length > 0 && (
            <div className="claim-upload-warning">
              <strong>Rows requiring attention:</strong>

              <ul className="claim-upload-result-list">
                {importErrors
                  .slice(0, 100)
                  .map((item, index) => (
                    <li
                      key={`${item.row}-${index}`}
                    >
                      Excel row {item.row}:{" "}
                      {String(item.message)}
                    </li>
                  ))}
              </ul>

              {importErrors.length > 100 && (
                <p>
                  Showing the first 100 errors
                  out of {importErrors.length}.
                </p>
              )}
            </div>
          )}

          {failedCount > 0 &&
            importErrors.length === 0 && (
              <div className="claim-upload-warning">
                The backend reported failed records
                without individual row messages.
              </div>
            )}

          {failedCount === 0 &&
            createdCount + updatedCount > 0 && (
              <div className="claim-upload-success">
                All reported records were imported
                or updated successfully.
              </div>
            )}
        </div>
      )}
    </div>
  );
}
