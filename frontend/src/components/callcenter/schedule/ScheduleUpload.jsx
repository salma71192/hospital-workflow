
import React from "react";

export default function ScheduleUpload({
  excelFile,
  workbookSheets = [],
  selectedSheet,
  importing = false,
  busy = false,
  fileInputRef,
  handleExcelFile,
  clearExcel,
  changeSheet,
  previewExcel,
}) {
  return (
    <section className="csu-panel">
      <div className="csu-section-header">
        <h3>Import Appointment Schedule</h3>

        {excelFile && (
          <button
            type="button"
            className="csu-secondary"
            disabled={busy}
            onClick={clearExcel}
          >
            Clear File
          </button>
        )}
      </div>

      <div className="csu-upload">
        <span aria-hidden="true">📄</span>

        <strong>
          {importing
            ? "Reading file..."
            : "Upload Excel Schedule"}
        </strong>

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          disabled={busy}
          onChange={handleExcelFile}
          aria-label="Upload appointment schedule"
        />
      </div>

      {excelFile && (
        <>
          <div className="csu-file-info">
            <strong>{excelFile.name}</strong>
            <span>
              {(excelFile.size / 1024).toFixed(1)} KB
            </span>
          </div>

          {workbookSheets.length > 1 && (
            <div className="csu-form-grid">
              <label>
                Worksheet
                <select
                  value={selectedSheet}
                  disabled={busy}
                  onChange={(e) =>
                    changeSheet(e.target.value)
                  }
                >
                  {workbookSheets.map((sheet) => (
                    <option key={sheet} value={sheet}>
                      {sheet}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          <div className="csu-actions">
            <button
              type="button"
              className="csu-primary"
              disabled={busy}
              onClick={previewExcel}
            >
              Preview Appointments
            </button>
          </div>
        </>
      )}
    </section>
  );
}
