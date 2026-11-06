
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { STATUS_OPTIONS } from "./scheduleHelpers";

// ============================================================
// CONFIGURATION
// ============================================================

const HOSPITAL_TIME_ZONE = "Asia/Dubai";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAYS = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
];

const pad = (value) =>
  String(value).padStart(2, "0");

const clean = (value) =>
  String(value ?? "").trim();

// ============================================================
// DATE HELPERS
// ============================================================

function getTodayUAE() {
  const parts = new Intl.DateTimeFormat(
    "en-GB",
    {
      timeZone: HOSPITAL_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  ).formatToParts(new Date());

  const values = Object.fromEntries(
    parts.map((part) => [
      part.type,
      part.value,
    ])
  );

  return [
    values.year,
    values.month,
    values.day,
  ].join("-");
}

function isValidISODate(value) {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return false;
  }

  const [year, month, day] = value
    .split("-")
    .map(Number);

  const parsed = new Date(
    Date.UTC(year, month - 1, day)
  );

  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() + 1 === month &&
    parsed.getUTCDate() === day
  );
}

function dateParts(value) {
  if (!isValidISODate(value)) {
    return null;
  }

  const [year, month, day] = value
    .split("-")
    .map(Number);

  return {
    year,
    month,
    day,
  };
}

function buildDate(year, month, day) {
  return [
    year,
    pad(month),
    pad(day),
  ].join("-");
}

function formatDate(value) {
  const parts = dateParts(value);

  if (!parts) {
    return "Select appointment date";
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }
  ).format(
    new Date(
      Date.UTC(
        parts.year,
        parts.month - 1,
        parts.day
      )
    )
  );
}

function buildCalendarDays(year, month) {
  const firstDay = new Date(
    Date.UTC(year, month - 1, 1)
  );

  const offset =
    (firstDay.getUTCDay() + 6) % 7;

  const daysInMonth = new Date(
    Date.UTC(year, month, 0)
  ).getUTCDate();

  const cells = [];

  for (let index = 0; index < offset; index++) {
    cells.push(null);
  }

  for (
    let day = 1;
    day <= daysInMonth;
    day++
  ) {
    cells.push(
      buildDate(year, month, day)
    );
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

function shiftMonth(year, month, amount) {
  const shifted = new Date(
    Date.UTC(year, month - 1 + amount, 1)
  );

  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
  };
}

// ============================================================
// ICONS
// ============================================================

function FilterIcon({
  name,
  size = 18,
}) {
  const paths = {
    filter: (
      <>
        <path d="M4 7h16" />
        <path d="M7 12h10" />
        <path d="M10 17h4" />
      </>
    ),

    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),

    calendar: (
      <>
        <rect
          x="3"
          y="5"
          width="18"
          height="16"
          rx="2"
        />
        <path d="M7 3v4M17 3v4M3 10h18" />
      </>
    ),

    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),

    history: (
      <>
        <path d="M3 12a9 9 0 1 0 3-6.7" />
        <path d="M3 4v5h5" />
        <path d="M12 7v5l4 2" />
      </>
    ),

    lock: (
      <>
        <rect
          x="5"
          y="10"
          width="14"
          height="11"
          rx="2"
        />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),

    check: (
      <path d="m5 12 4 4L19 6" />
    ),

    close: (
      <path d="M6 6l12 12M18 6 6 18" />
    ),

    chevronDown: (
      <path d="m6 9 6 6 6-6" />
    ),

    chevronLeft: (
      <path d="m15 18-6-6 6-6" />
    ),

    chevronRight: (
      <path d="m9 18 6-6-6-6" />
    ),

    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5M12 8h.01" />
      </>
    ),

    refresh: (
      <>
        <path d="M20 7v5h-5" />
        <path d="M4 17v-5h5" />
        <path d="M5 9a8 8 0 0 1 13-2l2 5" />
        <path d="M4 12l2 5a8 8 0 0 0 13-2" />
      </>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.filter}
    </svg>
  );
}

// ============================================================
// SEARCHABLE PHYSIOTHERAPIST DROPDOWN
// ============================================================

function TherapistSearch({
  id,
  value,
  options = [],
  loading = false,
  disabled = false,
  onChange,
  placeholder = "Search physiotherapist...",
}) {
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] =
    useState(0);

  const selected = useMemo(
    () =>
      options.find(
        (option) =>
          String(option.value) ===
          String(value)
      ),
    [options, value]
  );

  const filteredOptions = useMemo(() => {
    const search = clean(query)
      .normalize("NFKC")
      .toLowerCase();

    if (!search) {
      return options;
    }

    return options.filter((option) => {
      const name = String(
        option.label ?? ""
      )
        .normalize("NFKC")
        .toLowerCase();

      return name.includes(search);
    });
  }, [options, query]);

  useEffect(() => {
    if (!open) {
      setQuery(selected?.label || "");
    }
  }, [selected?.label, open]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target
        )
      ) {
        setOpen(false);
        setQuery(selected?.label || "");
      }
    };

    document.addEventListener(
      "pointerdown",
      handleOutsideClick
    );

    return () =>
      document.removeEventListener(
        "pointerdown",
        handleOutsideClick
      );
  }, [selected?.label]);

  useEffect(() => {
    if (disabled && open) {
      setOpen(false);
    }
  }, [disabled, open]);

  const choose = (option) => {
    onChange(option.value);
    setQuery(option.label);
    setOpen(false);
    setHighlighted(0);
  };

  const clearSelection = () => {
    if (disabled) return;

    onChange("");
    setQuery("");
    setHighlighted(0);
    setOpen(true);
    inputRef.current?.focus();
  };

  const handleInputChange = (event) => {
    setQuery(event.target.value);
    setHighlighted(0);
    setOpen(true);
  };

  const handleKeyDown = (event) => {
    if (disabled) return;

    if (event.key === "Escape") {
      setOpen(false);
      setQuery(selected?.label || "");
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();

      if (!open) {
        setOpen(true);
        setHighlighted(0);
        return;
      }

      setHighlighted((previous) =>
        Math.min(
          previous + 1,
          filteredOptions.length - 1
        )
      );
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      setHighlighted((previous) =>
        Math.max(previous - 1, 0)
      );
    }

    if (
      event.key === "Enter" &&
      open &&
      filteredOptions.length
    ) {
      event.preventDefault();

      choose(
        filteredOptions[
          Math.max(
            0,
            Math.min(
              highlighted,
              filteredOptions.length - 1
            )
          )
        ]
      );
    }
  };

  useEffect(() => {
    if (!open) return;

    const item =
      listRef.current?.querySelector(
        `[data-index="${highlighted}"]`
      );

    item?.scrollIntoView({
      block: "nearest",
    });
  }, [highlighted, open]);

  const showClear = Boolean(
    value || query
  );

  return (
    <div
      ref={containerRef}
      className="sf-combobox"
    >
      <div
        className={`sf-combobox-control ${
          open ? "sf-combobox-open" : ""
        } ${
          disabled ? "sf-combobox-disabled" : ""
        }`}
      >
        <span className="sf-combobox-leading">
          <FilterIcon
            name="search"
            size={17}
          />
        </span>

        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-options`}
          aria-autocomplete="list"
          aria-activedescendant={
            open && filteredOptions.length
              ? `${id}-option-${highlighted}`
              : undefined
          }
          value={query}
          disabled={disabled}
          autoComplete="off"
          placeholder={
            loading
              ? "Loading physiotherapists..."
              : placeholder
          }
          onFocus={() => {
            if (!disabled) {
              setOpen(true);
            }
          }}
          onClick={() => {
            if (!disabled) {
              setOpen(true);
            }
          }}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
        />

        {showClear && !disabled ? (
          <button
            type="button"
            className="sf-combobox-clear"
            aria-label="Clear physiotherapist"
            onClick={clearSelection}
          >
            <FilterIcon
              name="close"
              size={15}
            />
          </button>
        ) : (
          <span className="sf-combobox-chevron">
            <FilterIcon
              name="chevronDown"
              size={16}
            />
          </span>
        )}
      </div>

      {open && !disabled && (
        <div
          className="sf-combobox-dropdown"
        >
          <div className="sf-dropdown-caption">
            {filteredOptions.length}
            {" "}
            {filteredOptions.length === 1
              ? "physiotherapist"
              : "physiotherapists"}
          </div>

          <div
            ref={listRef}
            id={`${id}-options`}
            className="sf-combobox-list"
            role="listbox"
          >
            {loading ? (
              <div className="sf-dropdown-empty">
                Loading physiotherapists...
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="sf-dropdown-empty">
                <FilterIcon
                  name="search"
                  size={21}
                />

                <strong>
                  No physiotherapist found
                </strong>

                <span>
                  Try another name.
                </span>
              </div>
            ) : (
              filteredOptions.map(
                (option, index) => {
                  const isSelected =
                    String(option.value) ===
                    String(value);

                  return (
                    <button
                      key={option.value}
                      id={`${id}-option-${index}`}
                      data-index={index}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      className={`sf-dropdown-option ${
                        highlighted === index
                          ? "sf-option-highlighted"
                          : ""
                      }`}
                      onMouseEnter={() =>
                        setHighlighted(index)
                      }
                      onClick={() =>
                        choose(option)
                      }
                    >
                      <span className="sf-option-avatar">
                        {String(
                          option.label || "?"
                        )
                          .charAt(0)
                          .toUpperCase()}
                      </span>

                      <span className="sf-option-name">
                        {option.label}
                      </span>

                      {isSelected && (
                        <span className="sf-option-check">
                          <FilterIcon
                            name="check"
                            size={17}
                          />
                        </span>
                      )}
                    </button>
                  );
                }
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// CUSTOM CALENDAR PICKER
// ============================================================

function CalendarPicker({
  id,
  value,
  onChange,
  disabled = false,
  minDate = "",
  today,
  labelText = "Appointment Date",
}) {
  const containerRef = useRef(null);
  const triggerRef = useRef(null);

  const [open, setOpen] = useState(false);

  const initialDate =
    dateParts(value) ||
    dateParts(today);

  const [view, setView] = useState(
    () => ({
      year: initialDate?.year ||
        new Date().getFullYear(),
      month: initialDate?.month ||
        new Date().getMonth() + 1,
    })
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const selected =
      dateParts(value) ||
      dateParts(today);

    if (selected) {
      setView({
        year: selected.year,
        month: selected.month,
      });
    }
  }, [open, value, today]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target
        )
      ) {
        setOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener(
      "pointerdown",
      handleOutsideClick
    );

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        handleOutsideClick
      );

      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, []);

  useEffect(() => {
    if (disabled) {
      setOpen(false);
    }
  }, [disabled]);

  const days = useMemo(
    () =>
      buildCalendarDays(
        view.year,
        view.month
      ),
    [view.year, view.month]
  );

  const previousMonth = shiftMonth(
    view.year,
    view.month,
    -1
  );

  const nextMonth = shiftMonth(
    view.year,
    view.month,
    1
  );

  const previousMonthLastDate = buildDate(
    previousMonth.year,
    previousMonth.month,
    new Date(
      Date.UTC(
        previousMonth.year,
        previousMonth.month,
        0
      )
    ).getUTCDate()
  );

  const previousDisabled = Boolean(
    minDate &&
    previousMonthLastDate < minDate
  );

  const handleSelect = (selectedDate) => {
    if (
      disabled ||
      !isValidISODate(selectedDate) ||
      (minDate && selectedDate < minDate)
    ) {
      return;
    }

    onChange(selectedDate);
    setOpen(false);
  };

  const handleToday = () => {
    const current = getTodayUAE();

    if (
      minDate &&
      current < minDate
    ) {
      return;
    }

    handleSelect(current);
  };

  const moveMonth = (amount) => {
    const result = shiftMonth(
      view.year,
      view.month,
      amount
    );

    setView(result);
  };

  const selectedParts = dateParts(value);

  return (
    <div
      ref={containerRef}
      className="sf-calendar-container"
    >
      <button
        ref={triggerRef}
        id={id}
        type="button"
        className={`sf-calendar-trigger ${
          open ? "sf-calendar-open" : ""
        } ${
          disabled ? "sf-calendar-disabled" : ""
        }`}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`${labelText}: ${formatDate(value)}`}
        onClick={() => {
          setOpen((current) => !current);
        }}
      >
        <span className="sf-calendar-trigger-icon">
          <FilterIcon
            name="calendar"
            size={19}
          />
        </span>

        <span className="sf-calendar-trigger-text">
          {selectedParts ? (
            <>
              <strong>
                {pad(selectedParts.day)}
                {" "}
                {MONTHS[
                  selectedParts.month - 1
                ].slice(0, 3)}
                {" "}
                {selectedParts.year}
              </strong>
            </>
          ) : (
            <span className="sf-calendar-placeholder">
              Choose appointment date
            </span>
          )}
        </span>

        <span className="sf-calendar-chevron">
          <FilterIcon
            name="chevronDown"
            size={16}
          />
        </span>
      </button>

      {open && (
        <div
          className="sf-calendar-popup"
          role="dialog"
          aria-label={`${labelText} calendar`}
        >
          <div className="sf-calendar-heading">
            <button
              type="button"
              className="sf-month-nav"
              disabled={previousDisabled}
              onClick={() =>
                moveMonth(-1)
              }
              aria-label="Previous month"
            >
              <FilterIcon
                name="chevronLeft"
                size={20}
              />
            </button>

            <div className="sf-calendar-month-title">
              <strong>
                {MONTHS[view.month - 1]}
              </strong>

              <span>{view.year}</span>
            </div>

            <button
              type="button"
              className="sf-month-nav"
              onClick={() =>
                moveMonth(1)
              }
              aria-label="Next month"
            >
              <FilterIcon
                name="chevronRight"
                size={20}
              />
            </button>
          </div>

          <div className="sf-calendar-weekdays">
            {WEEKDAYS.map((weekday) => (
              <span key={weekday}>
                {weekday}
              </span>
            ))}
          </div>

          <div className="sf-calendar-days">
            {days.map((day, index) => {
              if (!day) {
                return (
                  <span
                    key={`empty-${index}`}
                    className="sf-calendar-empty"
                  />
                );
              }

              const disabledDay = Boolean(
                minDate &&
                day < minDate
              );

              const isToday = day === today;
              const isSelected = day === value;

              return (
                <button
                  key={day}
                  type="button"
                  disabled={disabledDay}
                  aria-label={formatDate(day)}
                  aria-pressed={isSelected}
                  className={[
                    "sf-calendar-day",
                    isToday
                      ? "sf-calendar-today"
                      : "",
                    isSelected
                      ? "sf-calendar-selected"
                      : "",
                    disabledDay
                      ? "sf-calendar-past"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() =>
                    handleSelect(day)
                  }
                >
                  {Number(day.slice(-2))}
                </button>
              );
            })}
          </div>

          <div className="sf-calendar-footer">
            <span className="sf-calendar-footer-note">
              {minDate
                ? "Past days are locked"
                : "All dates available"}
            </span>

            <button
              type="button"
              className="sf-calendar-today-button"
              onClick={handleToday}
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

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

  historyMonth = "",
  onHistoryMonthChange,

  historyTherapist = "all",
  onHistoryTherapistChange,

  autoLoadSchedule = true,
}) {
  const isHistory = activeTab === "history";

  const [today, setToday] = useState(
    getTodayUAE
  );

  const [warning, setWarning] = useState("");

  const lastRequestRef = useRef("");
  const requestRef = useRef(onLoadSchedule);

  // ----------------------------------------------------------
  // KEEP CALLBACK CURRENT
  // ----------------------------------------------------------

  useEffect(() => {
    requestRef.current = onLoadSchedule;
  }, [onLoadSchedule]);

  // ----------------------------------------------------------
  // UPDATE HOSPITAL DATE
  // ----------------------------------------------------------

  useEffect(() => {
    const updateToday = () => {
      setToday(getTodayUAE());
    };

    const interval = window.setInterval(
      updateToday,
      30000
    );

    const visibilityHandler = () => {
      if (!document.hidden) {
        updateToday();
      }
    };

    document.addEventListener(
      "visibilitychange",
      visibilityHandler
    );

    return () => {
      window.clearInterval(interval);

      document.removeEventListener(
        "visibilitychange",
        visibilityHandler
      );
    };
  }, []);

  // ----------------------------------------------------------
  // SELECTED VALUES
  // ----------------------------------------------------------

  const selectedTherapist =
    therapistOptions.find(
      (item) =>
        String(item.value) ===
        String(therapist)
    );

  const isPastDate =
    isValidISODate(date) &&
    date < today;

  const validCreateDate =
    isValidISODate(date) &&
    !isPastDate;

  // ----------------------------------------------------------
  // AUTOMATIC SCHEDULE LOADING
  // ----------------------------------------------------------

  const readyToLoad =
    !isHistory &&
    autoLoadSchedule &&
    Boolean(therapist) &&
    validCreateDate &&
    !busy &&
    !loading &&
    !hasDraft;

  useEffect(() => {
    if (!readyToLoad) {
      return;
    }

    const key = `${therapist}|${date}`;

    if (lastRequestRef.current === key) {
      return;
    }

    let cancelled = false;

    const timer = window.setTimeout(() => {
      if (
        cancelled ||
        lastRequestRef.current === key
      ) {
        return;
      }

      lastRequestRef.current = key;

      Promise.resolve()
        .then(() => {
          if (!cancelled) {
            return requestRef.current();
          }

          return undefined;
        })
        .then((result) => {
          if (
            result === false ||
            result?.success === false
          ) {
            lastRequestRef.current = "";
          }
        })
        .catch(() => {
          lastRequestRef.current = "";
        });
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    readyToLoad,
    therapist,
    date,
  ]);

  // ----------------------------------------------------------
  // HANDLERS
  // ----------------------------------------------------------

  const handleTherapistChange = (value) => {
    setWarning("");

    if (hasDraft && !isHistory) {
      setWarning(
        "Save or discard the current draft before changing physiotherapists."
      );
      return;
    }

    lastRequestRef.current = "";
    onTherapistChange(value);
  };

  const handleDateChange = (value) => {
    setWarning("");

    if (
      !isHistory &&
      value &&
      (
        !isValidISODate(value) ||
        value < getTodayUAE()
      )
    ) {
      setWarning(
        "Past appointment dates are locked. Please select today or a future date."
      );
      return;
    }

    if (hasDraft && !isHistory) {
      setWarning(
        "Save or discard your current appointments before changing the schedule date."
      );
      return;
    }

    lastRequestRef.current = "";
    onDateChange(value);
  };

  const refreshHistory = () => {
    if (!busy && !loadingHistory) {
      onLoadHistory();
    }
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <>
      <section className="sf-panel">

        {/* HEADER */}

        <div className="sf-header">
          <div className="sf-header-left">
            <span className="sf-header-icon">
              <FilterIcon
                name={
                  isHistory
                    ? "history"
                    : "filter"
                }
                size={20}
              />
            </span>

            <div>
              <h3>
                {isHistory
                  ? "Schedule History Filters"
                  : "Schedule Filters"}
              </h3>

              <p>
                {isHistory
                  ? "Search and review saved appointments"
                  : "Select a physiotherapist and appointment date"}
              </p>
            </div>
          </div>

          <div className="sf-header-tag">
            <FilterIcon
              name={
                isHistory
                  ? "history"
                  : "calendar"
              }
              size={14}
            />

            {isHistory
              ? "History"
              : "Scheduling"}
          </div>
        </div>

        {/* MAIN FILTERS */}

        <div className="sf-body">
          <div className="sf-main-grid">

            {/* SEARCHABLE PHYSIOTHERAPIST */}

            <div className="sf-field">
              <label
                htmlFor="sf-therapist"
                className="sf-label"
              >
                <FilterIcon
                  name="user"
                  size={15}
                />

                Physiotherapist
              </label>

              <TherapistSearch
                id="sf-therapist"
                value={therapist}
                options={therapistOptions}
                loading={loadingTherapists}
                disabled={
                  busy ||
                  loadingTherapists ||
                  (hasDraft && !isHistory)
                }
                onChange={handleTherapistChange}
              />
            </div>

            {/* CUSTOM APPOINTMENT CALENDAR */}

            <div className="sf-field">
              <label
                htmlFor="sf-date"
                className="sf-label"
              >
                <FilterIcon
                  name="calendar"
                  size={15}
                />

                {isHistory
                  ? "Schedule Date"
                  : "Appointment Date"}
              </label>

              <CalendarPicker
                id="sf-date"
                labelText={
                  isHistory
                    ? "Schedule Date"
                    : "Appointment Date"
                }
                value={date}
                today={today}
                minDate={
                  isHistory ? "" : today
                }
                disabled={
                  busy ||
                  (hasDraft && !isHistory)
                }
                onChange={handleDateChange}
              />
            </div>

          </div>

          {/* STATUS STRIP */}

          <div className="sf-selection-strip">
            <div className="sf-selection-description">
              {selectedTherapist?.label
                ? (
                  <>
                    <strong>
                      {selectedTherapist.label}
                    </strong>

                    <span className="sf-selection-separator">
                      •
                    </span>
                  </>
                )
                : null}

              <span>
                {isValidISODate(date)
                  ? formatDate(date)
                  : "Choose a date"}
              </span>
            </div>

            <div className="sf-selection-status">
              {loading && !isHistory ? (
                <span className="sf-state sf-state-loading">
                  <span className="sf-spinner" />
                  Loading schedule
                </span>
              ) : isPastDate && !isHistory ? (
                <span className="sf-state sf-state-locked">
                  <FilterIcon
                    name="lock"
                    size={14}
                  />
                  Date locked
                </span>
              ) : therapist && date ? (
                <span className="sf-state sf-state-ready">
                  <FilterIcon
                    name="check"
                    size={14}
                  />

                  Ready
                </span>
              ) : (
                <span className="sf-state sf-state-waiting">
                  Select filters
                </span>
              )}
            </div>
          </div>

          {/* INFORMATION */}

          {!isHistory && (
            <div className="sf-help">
              <FilterIcon
                name="lock"
                size={15}
              />

              <span>
                Past dates are locked.
                Today's and future appointments
                can be created or updated.
              </span>
            </div>
          )}

          {/* UNSAVED DRAFT */}

          {hasDraft && !isHistory && (
            <div className="sf-warning sf-warning-draft">
              <FilterIcon
                name="info"
                size={18}
              />

              <div>
                <strong>
                  Unsaved appointment changes
                </strong>

                <p>
                  Save or discard the current
                  draft before changing the
                  physiotherapist or date.
                </p>
              </div>
            </div>
          )}

          {/* PAST DATE */}

          {isPastDate && !isHistory && (
            <div className="sf-warning sf-warning-error">
              <FilterIcon
                name="lock"
                size={18}
              />

              <div>
                <strong>
                  Historical schedule locked
                </strong>

                <p>
                  Appointments from previous
                  dates cannot be modified.
                  Use Schedule History to
                  review them.
                </p>
              </div>
            </div>
          )}

          {/* WARNING */}

          {warning && (
            <div
              className="sf-warning sf-warning-error"
              role="alert"
            >
              <FilterIcon
                name="info"
                size={18}
              />

              <div>
                <strong>
                  Action not available
                </strong>

                <p>{warning}</p>
              </div>

              <button
                type="button"
                className="sf-dismiss"
                onClick={() =>
                  setWarning("")
                }
                aria-label="Dismiss warning"
              >
                <FilterIcon
                  name="close"
                  size={16}
                />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* =====================================================
          HISTORY FILTERS
      ===================================================== */}

      {isHistory && (
        <section className="sf-panel sf-history-panel">

          <div className="sf-history-header">
            <div className="sf-history-heading">
              <span className="sf-history-heading-icon">
                <FilterIcon
                  name="search"
                  size={19}
                />
              </span>

              <div>
                <h3>
                  Search & Filter History
                </h3>

                <p>
                  Find saved appointments
                  and patient records
                </p>
              </div>
            </div>

            <button
              type="button"
              className="sf-refresh-button"
              disabled={
                busy ||
                loadingHistory
              }
              onClick={refreshHistory}
            >
              <FilterIcon
                name="refresh"
                size={16}
              />

              {loadingHistory
                ? "Refreshing..."
                : "Refresh History"}
            </button>
          </div>

          <div className="sf-history-body">
            <div className="sf-history-grid">

              {/* STATUS */}

              <div className="sf-field">
                <label
                  htmlFor="sf-history-status"
                  className="sf-label"
                >
                  <FilterIcon
                    name="filter"
                    size={15}
                  />

                  Confirmation Status
                </label>

                <select
                  id="sf-history-status"
                  className="sf-control sf-select"
                  value={historyFilter}
                  onChange={(event) =>
                    onHistoryFilterChange(
                      event.target.value
                    )
                  }
                >
                  <option value="all">
                    All Statuses
                  </option>

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
              </div>

              {/* MONTH */}

              <div className="sf-field">
                <label
                  htmlFor="sf-history-month"
                  className="sf-label"
                >
                  <FilterIcon
                    name="calendar"
                    size={15}
                  />

                  Month
                </label>

                <input
                  id="sf-history-month"
                  type="month"
                  className="sf-control sf-month"
                  value={historyMonth}
                  disabled={
                    typeof onHistoryMonthChange !==
                    "function"
                  }
                  onChange={(event) =>
                    onHistoryMonthChange?.(
                      event.target.value
                    )
                  }
                />
              </div>

              {/* THERAPIST FILTER */}

              <div className="sf-field">
                <label
                  htmlFor="sf-history-therapist"
                  className="sf-label"
                >
                  <FilterIcon
                    name="user"
                    size={15}
                  />

                  Filter by Physiotherapist
                </label>

                {typeof onHistoryTherapistChange ===
                "function" ? (
                  <TherapistSearch
                    id="sf-history-therapist"
                    value={
                      historyTherapist === "all"
                        ? ""
                        : historyTherapist
                    }
                    options={therapistOptions}
                    placeholder="All physiotherapists"
                    onChange={(value) =>
                      onHistoryTherapistChange(
                        value || "all"
                      )
                    }
                  />
                ) : (
                  <select
                    id="sf-history-therapist"
                    className="sf-control sf-select"
                    disabled
                  >
                    <option>
                      All Physiotherapists
                    </option>
                  </select>
                )}
              </div>

              {/* PATIENT SEARCH */}

              <div className="sf-field">
                <label
                  htmlFor="sf-history-query"
                  className="sf-label"
                >
                  <FilterIcon
                    name="search"
                    size={15}
                  />

                  Search Patient / File Number
                </label>

                <div className="sf-search-wrapper">
                  <input
                    id="sf-history-query"
                    type="search"
                    className="sf-control sf-search"
                    value={historyQuery}
                    onChange={(event) =>
                      onHistoryQueryChange(
                        event.target.value
                      )
                    }
                    placeholder="Patient name or file number"
                  />

                  {historyQuery && (
                    <button
                      type="button"
                      className="sf-search-clear"
                      onClick={() =>
                        onHistoryQueryChange("")
                      }
                      aria-label="Clear search"
                    >
                      <FilterIcon
                        name="close"
                        size={15}
                      />
                    </button>
                  )}
                </div>
              </div>

            </div>

            <div className="sf-history-note">
              <FilterIcon
                name="lock"
                size={15}
              />

              <span>
                Previous appointment schedules
                remain available for review,
                but cannot be modified.
              </span>
            </div>
          </div>
        </section>
      )}

      {/* =====================================================
          STYLES
      ===================================================== */}

      <style>{`
        .sf-panel {
          --sf-blue: #2563eb;
          --sf-navy: #17345c;
          --sf-border: #e3eaf5;

          position: relative;

          background: white;
          border: 1px solid var(--sf-border);
          border-radius: 17px;

          overflow: visible;

          font-family: Inter, system-ui,
            -apple-system, BlinkMacSystemFont,
            "Segoe UI", sans-serif;

          box-shadow: 0 5px 22px
            rgba(31,65,115,.05);
        }

        .sf-panel,
        .sf-panel * {
          box-sizing: border-box;
        }

        /* HEADER */

        .sf-header {
          padding: 17px 22px;

          background: linear-gradient(
            110deg,
            #f1f5ff,
            #ffffff
          );

          border-radius: 17px 17px 0 0;
          border-bottom: 1px solid #e8eef8;

          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
        }

        .sf-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .sf-header-icon {
          width: 40px;
          height: 40px;

          border-radius: 11px;

          display: grid;
          place-items: center;

          background: linear-gradient(
            135deg,
            #2457cf,
            #4284f5
          );

          color: white;
          flex-shrink: 0;
        }

        .sf-header h3,
        .sf-history-header h3 {
          margin: 0 0 4px;
          color: #172b4d;
          font-size: 16px;
          font-weight: 850;
        }

        .sf-header p,
        .sf-history-header p {
          margin: 0;
          color: #7a8aa4;
          font-size: 12px;
          line-height: 1.5;
        }

        .sf-header-tag {
          display: inline-flex;
          align-items: center;
          gap: 7px;

          padding: 8px 12px;
          border-radius: 999px;

          background: #e5efff;
          color: #2457c6;

          font-size: 11px;
          font-weight: 850;
          white-space: nowrap;
        }

        /* BODY */

        .sf-body {
          padding: 19px 22px;
        }

        .sf-main-grid,
        .sf-history-grid {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));

          gap: 18px;
          align-items: start;
        }

        .sf-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 0;
        }

        .sf-label {
          display: flex;
          align-items: center;
          gap: 7px;

          color: #405577;
          font-size: 12px;
          font-weight: 800;
        }

        .sf-label svg {
          color: #3973d7;
          flex-shrink: 0;
        }

        /* UNIFIED CONTROL HEIGHT */

        .sf-panel .sf-control {
          display: block;
          width: 100%;

          height: 46px;
          min-height: 46px;
          max-height: 46px;

          padding: 0 14px;
          margin: 0;

          border: 1.5px solid #dce5f2;
          border-radius: 10px;

          background: white;
          color: #1f3557;

          font-family: inherit;
          font-size: 14px;
          font-weight: 650;

          outline: none;
          box-shadow: none;
        }

        .sf-panel .sf-control:focus {
          border-color: #3675e9;
          box-shadow: 0 0 0 4px
            rgba(37,99,235,.09);
        }

        .sf-panel .sf-control:disabled {
          background: #f1f5f9;
          color: #94a3b8;
          cursor: not-allowed;
        }

        .sf-panel .sf-select {
          appearance: auto;
          -webkit-appearance: menulist;
          cursor: pointer;
        }

        .sf-panel .sf-month {
          appearance: auto;
          -webkit-appearance: auto;
          color-scheme: light;
        }

        /* SEARCHABLE THERAPIST */

        .sf-combobox {
          position: relative;
          width: 100%;
        }

        .sf-combobox-control {
          display: flex;
          align-items: center;

          height: 46px;
          min-height: 46px;

          border: 1.5px solid #dce5f2;
          border-radius: 10px;

          background: white;
          transition:
            border-color .18s,
            box-shadow .18s;
        }

        .sf-combobox-control:hover {
          border-color: #adc6f5;
        }

        .sf-combobox-open {
          border-color: #3675e9;
          box-shadow: 0 0 0 4px
            rgba(37,99,235,.09);
        }

        .sf-combobox-disabled {
          background: #f1f5f9;
          opacity: .65;
        }

        .sf-combobox-leading {
          display: grid;
          place-items: center;

          padding-left: 13px;
          color: #7294cc;
          flex-shrink: 0;
        }

        .sf-combobox-control input {
          flex: 1;
          min-width: 0;
          height: 100%;

          padding: 0 11px;

          border: none;
          background: transparent;
          outline: none;

          color: #1f3557;
          font-family: inherit;
          font-size: 14px;
          font-weight: 650;
        }

        .sf-combobox-control input::placeholder {
          color: #94a3b8;
          font-weight: 500;
        }

        .sf-combobox-clear {
          display: grid;
          place-items: center;

          width: 28px;
          height: 28px;
          margin-right: 9px;

          border: none;
          border-radius: 7px;

          background: #edf2f9;
          color: #64748b;
          cursor: pointer;
        }

        .sf-combobox-chevron {
          display: grid;
          place-items: center;

          margin-right: 12px;
          color: #8193ae;
        }

        .sf-combobox-dropdown {
          position: absolute;

          top: calc(100% + 7px);
          left: 0;
          right: 0;

          z-index: 1000;

          border: 1px solid #dce5f2;
          border-radius: 13px;

          background: white;

          box-shadow: 0 15px 40px
            rgba(23,52,92,.16);

          overflow: hidden;
        }

        .sf-dropdown-caption {
          padding: 11px 14px;

          background: #f5f8ff;
          border-bottom: 1px solid #edf1f8;

          color: #7a8ba5;
          font-size: 11px;
          font-weight: 800;
        }

        .sf-combobox-list {
          max-height: 265px;
          overflow-y: auto;
          overscroll-behavior: contain;
          -webkit-overflow-scrolling: touch;
        }

        .sf-dropdown-option {
          display: flex;
          align-items: center;
          gap: 11px;

          width: 100%;
          min-height: 49px;

          padding: 9px 13px;

          border: none;
          border-bottom: 1px solid #f0f3f8;

          background: white;
          text-align: left;
          cursor: pointer;
        }

        .sf-dropdown-option:hover,
        .sf-option-highlighted {
          background: #eef5ff;
        }

        .sf-option-avatar {
          display: grid;
          place-items: center;

          width: 30px;
          height: 30px;

          border-radius: 9px;

          background: #e9edff;
          color: #4f46e5;

          font-size: 12px;
          font-weight: 900;

          flex-shrink: 0;
        }

        .sf-option-name {
          flex: 1;
          min-width: 0;

          color: #263b5b;
          font-size: 12px;
          font-weight: 750;
        }

        .sf-option-check {
          color: #059669;
          flex-shrink: 0;
        }

        .sf-dropdown-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 7px;

          padding: 25px 15px;

          color: #94a3b8;
          text-align: center;
          font-size: 12px;
        }

        .sf-dropdown-empty strong {
          color: #52637e;
        }

        /* CUSTOM CALENDAR */

        .sf-calendar-container {
          position: relative;
          width: 100%;
        }

        .sf-calendar-trigger {
          display: flex;
          align-items: center;
          gap: 11px;

          width: 100%;
          height: 46px;

          padding: 0 13px;

          border: 1.5px solid #dce5f2;
          border-radius: 10px;

          background: white;
          color: #1f3557;

          font-family: inherit;
          text-align: left;
          cursor: pointer;
        }

        .sf-calendar-trigger:hover:not(:disabled) {
          border-color: #adc6f5;
        }

        .sf-calendar-open {
          border-color: #3675e9;
          box-shadow: 0 0 0 4px
            rgba(37,99,235,.09);
        }

        .sf-calendar-disabled {
          opacity: .6;
          cursor: not-allowed;
          background: #f1f5f9;
        }

        .sf-calendar-trigger-icon {
          display: grid;
          place-items: center;
          color: #3973d7;
          flex-shrink: 0;
        }

        .sf-calendar-trigger-text {
          flex: 1;
          min-width: 0;
        }

        .sf-calendar-trigger-text strong {
          font-size: 14px;
          font-weight: 750;
        }

        .sf-calendar-placeholder {
          color: #94a3b8;
          font-size: 13px;
        }

        .sf-calendar-chevron {
          display: grid;
          place-items: center;
          color: #8193ae;
        }

        .sf-calendar-popup {
          position: absolute;

          top: calc(100% + 8px);
          right: 0;

          width: 340px;
          max-width: min(340px, 90vw);

          z-index: 1001;

          padding: 17px;

          border: 1px solid #dce5f2;
          border-radius: 17px;

          background: white;

          box-shadow: 0 20px 55px
            rgba(23,52,92,.18);
        }

        .sf-calendar-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 10px;
          margin-bottom: 18px;
        }

        .sf-calendar-month-title {
          display: flex;
          flex-direction: column;
          gap: 3px;
          align-items: center;
        }

        .sf-calendar-month-title strong {
          font-size: 15px;
          color: #172b4d;
          font-weight: 900;
        }

        .sf-calendar-month-title span {
          font-size: 12px;
          color: #8090a8;
          font-weight: 700;
        }

        .sf-month-nav {
          display: grid;
          place-items: center;

          width: 34px;
          height: 34px;

          border: 1px solid #e3eaf5;
          border-radius: 9px;

          background: #f8faff;
          color: #3569c7;

          cursor: pointer;
        }

        .sf-month-nav:disabled {
          opacity: .3;
          cursor: not-allowed;
        }

        .sf-calendar-weekdays,
        .sf-calendar-days {
          display: grid;
          grid-template-columns: repeat(7,1fr);
          gap: 5px;
        }

        .sf-calendar-weekdays {
          margin-bottom: 10px;
        }

        .sf-calendar-weekdays span {
          display: grid;
          place-items: center;

          height: 27px;

          color: #8290a6;
          font-size: 10px;
          font-weight: 850;
        }

        .sf-calendar-day,
        .sf-calendar-empty {
          display: grid;
          place-items: center;

          width: 100%;
          aspect-ratio: 1;

          border: none;
          border-radius: 10px;

          background: transparent;
          color: #30435f;

          font-family: inherit;
          font-size: 12px;
          font-weight: 750;
        }

        .sf-calendar-day {
          cursor: pointer;
        }

        .sf-calendar-day:hover:not(:disabled) {
          background: #e8f0ff;
          color: #2457d8;
        }

        .sf-calendar-today {
          border: 1.5px solid #3675e9;
          color: #2457d8;
        }

        .sf-calendar-selected,
        .sf-calendar-selected:hover:not(:disabled) {
          background: #2563eb;
          color: white;
          box-shadow: 0 4px 10px
            rgba(37,99,235,.2);
        }

        .sf-calendar-past {
          color: #cbd5e1;
          opacity: .55;
          cursor: not-allowed;
        }

        .sf-calendar-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;

          margin-top: 15px;
          padding-top: 14px;

          border-top: 1px solid #e9eef7;
        }

        .sf-calendar-footer-note {
          color: #8a97ab;
          font-size: 10px;
        }

        .sf-calendar-today-button {
          padding: 9px 15px;

          border: none;
          border-radius: 9px;

          background: #e8f0ff;
          color: #2457d8;

          font-size: 12px;
          font-weight: 850;
          cursor: pointer;
        }

        .sf-calendar-today-button:hover {
          background: #dbeafe;
        }

        /* SELECTION STRIP */

        .sf-selection-strip {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;

          margin-top: 17px;
          padding: 12px 14px;

          background: #f5f8ff;
          border: 1px solid #e6edfb;
          border-radius: 11px;
        }

        .sf-selection-description {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;

          color: #66758d;
          font-size: 12px;
        }

        .sf-selection-description strong {
          color: #243d63;
          font-weight: 850;
        }

        .sf-selection-separator {
          color: #b7c3d7;
        }

        .sf-state {
          display: inline-flex;
          align-items: center;
          gap: 7px;

          padding: 7px 11px;
          border-radius: 999px;

          font-size: 11px;
          font-weight: 850;
          white-space: nowrap;
        }

        .sf-state-ready {
          background: #dcfce7;
          color: #047857;
        }

        .sf-state-loading {
          background: #e7efff;
          color: #2457cb;
        }

        .sf-state-locked {
          background: #ffe4e6;
          color: #be123c;
        }

        .sf-state-waiting {
          background: #e2e8f0;
          color: #64748b;
        }

        .sf-spinner {
          width: 13px;
          height: 13px;

          border: 2px solid #bfd4ff;
          border-top-color: #2457cb;
          border-radius: 50%;

          animation: sf-spin .7s linear infinite;
        }

        @keyframes sf-spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* HELP */

        .sf-help {
          display: flex;
          align-items: center;
          gap: 8px;

          margin-top: 13px;

          color: #7a8ba5;
          font-size: 11px;
          line-height: 1.5;
        }

        .sf-help svg {
          flex-shrink: 0;
          color: #6487c3;
        }

        /* WARNINGS */

        .sf-warning {
          display: flex;
          align-items: flex-start;
          gap: 11px;

          margin-top: 14px;
          padding: 13px;

          border-radius: 11px;
        }

        .sf-warning svg {
          flex-shrink: 0;
        }

        .sf-warning-draft {
          background: #fff7e8;
          border: 1px solid #ffe0a3;
          color: #b7791f;
        }

        .sf-warning-error {
          background: #fff1f2;
          border: 1px solid #fecdd3;
          color: #be123c;
        }

        .sf-warning strong {
          display: block;
          font-size: 12px;
          font-weight: 850;
        }

        .sf-warning p {
          margin: 4px 0 0;
          font-size: 11px;
          line-height: 1.6;
        }

        .sf-dismiss {
          margin-left: auto;
          border: none;
          background: transparent;
          color: inherit;
          cursor: pointer;
        }

        /* HISTORY */

        .sf-history-panel {
          margin-top: 16px;
        }

        .sf-history-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;

          padding: 17px 22px;

          background: #f8faff;
          border-radius: 17px 17px 0 0;
          border-bottom: 1px solid #e8eef8;
        }

        .sf-history-heading {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .sf-history-heading-icon {
          display: grid;
          place-items: center;

          width: 39px;
          height: 39px;

          border-radius: 11px;
          background: #e5efff;
          color: #2862d5;
        }

        .sf-refresh-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;

          padding: 10px 14px;

          border: 1px solid #bfd3fa;
          border-radius: 9px;

          background: white;
          color: #2457c8;

          font-family: inherit;
          font-size: 12px;
          font-weight: 850;
          cursor: pointer;
        }

        .sf-refresh-button:disabled {
          opacity: .5;
          cursor: not-allowed;
        }

        .sf-history-body {
          padding: 19px 22px;
        }

        .sf-search-wrapper {
          position: relative;
        }

        .sf-panel .sf-search {
          padding-right: 40px;
        }

        .sf-search-clear {
          position: absolute;
          right: 11px;
          top: 50%;
          transform: translateY(-50%);

          display: grid;
          place-items: center;

          width: 26px;
          height: 26px;

          border: none;
          border-radius: 7px;

          background: #e8eef7;
          color: #66758d;
          cursor: pointer;
        }

        .sf-history-note {
          display: flex;
          align-items: center;
          gap: 8px;

          margin-top: 18px;
          padding: 11px 13px;

          border-radius: 10px;
          background: #f3f6fb;

          color: #7b8ba3;
          font-size: 11px;
          line-height: 1.5;
        }

        .sf-history-note svg {
          flex-shrink: 0;
        }

        /* TABLET */

        @media (max-width: 750px) {
          .sf-main-grid,
          .sf-history-grid {
            grid-template-columns: 1fr;
          }

          .sf-calendar-popup {
            left: 0;
            right: auto;
          }
        }

        /* MOBILE */

        @media (max-width: 600px) {
          .sf-header,
          .sf-history-header {
            padding: 15px;
          }

          .sf-body,
          .sf-history-body {
            padding: 16px 14px;
          }

          .sf-header h3 {
            font-size: 15px;
          }

          .sf-header p {
            font-size: 11px;
          }

          .sf-header-tag {
            display: none;
          }

          .sf-selection-strip {
            gap: 12px;
          }

          .sf-refresh-button {
            width: 100%;
          }

          .sf-calendar-popup {
            width: min(340px, calc(100vw - 65px));
          }
        }
      `}</style>
    </>
  );
}
