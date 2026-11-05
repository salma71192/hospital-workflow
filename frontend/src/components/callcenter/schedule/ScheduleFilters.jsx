
import React from "react";
import { STATUS_OPTIONS } from "./scheduleHelpers";

export default function ScheduleFilters({
  activeTab = "create",

  therapist = "",
  therapistOptions = [],
  loadingTherapists = false,
  onTherapistChange = () => {},

  date = "",
  onDateChange = () => {},

  busy = false,
  loading = false,
  loadingHistory = false,
  onLoadSchedule = () => {},
  onLoadHistory = () => {},

  hasDraft = false,

  historyFilter = "all",
  onHistoryFilterChange = () => {},

  historyQuery = "",
  onHistoryQueryChange = () => {},
}) {
  const isHistory = activeTab === "history";

  const canLoad = Boolean(therapist && date) && !busy;

  const handleRefresh = () => {
    if (isHistory) {
      onLoadHistory();
    } else {
      onLoadSchedule();
    }
  };

  return (
    <>
      <section className="csu-panel">
        <div className="csu-section-header">
          <h3>Therapist and Schedule Date</h3>
        </div>

        <div className="csu-form-grid">
          <label>
            Therapist

            <select
              value={therapist}
              disabled={busy}
              onChange={(event) =>
                onTherapistChange(event.target.value)
              }
            >
              <option value="">
                {loadingTherapists
                  ? "Loading therapists..."
                  : "Select therapist"}
              </option>

              {therapistOptions.map((item) => (
                <option
                  key={item.value}
                  value={item.value}
                >
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Schedule Date

            <input
              type="date"
              value={date}
              disabled={busy}
              onChange={(event) =>
                onDateChange(event.target.value)
              }
            />
          </label>

          <button
            type="button"
            className="csu-secondary"
            disabled={!canLoad}
            onClick={handleRefresh}
          >
            {loading || loadingHistory
              ? "Loading..."
              : isHistory
              ? "Refresh History"
              : "Load Schedule"}
          </button>
        </div>

        {hasDraft && !isHistory && (
          <p className="csu-note csu-draft">
            You have unsaved appointment changes.
          </p>
        )}
      </section>

      {isHistory && (
        <section className="csu-panel">
          <div className="csu-section-header">
            <h3>History Filters</h3>
          </div>

          <div className="csu-form-grid">
            <label>
              Filter by Status

              <select
                value={historyFilter}
                onChange={(event) =>
                  onHistoryFilterChange(
                    event.target.value
                  )
                }
              >
                <option value="all">
                  All statuses
                </option>

                {STATUS_OPTIONS.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Search Patient / File Number

              <input
                type="search"
                value={historyQuery}
                onChange={(event) =>
                  onHistoryQueryChange(
                    event.target.value
                  )
                }
                placeholder="Search patient or file number..."
              />
            </label>
          </div>
        </section>
      )}
    </>
  );
}
