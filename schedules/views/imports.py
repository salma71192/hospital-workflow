
import logging
import re
import unicodedata
from datetime import date, datetime, time

from django.views.decorators.http import require_http_methods

from openpyxl import load_workbook
from openpyxl.utils.datetime import from_excel

from patients.models import Patient

from .schedule import (
    MAX_APPOINTMENTS,
    DEFAULT_CONFIRMATION_STATUS,
    DEFAULT_APPOINTMENT_TYPE,
    error,
    require_manager,
    parse_date,
    normalized_name,
    get_active_therapist,
    therapist_display_name,
    calculate_summary,
)


logger = logging.getLogger(__name__)

MAX_EXCEL_BYTES = 10 * 1024 * 1024
MAX_EXCEL_ROWS = 10000


# =========================================================
# ADMINISTRATIVE TEXT
# =========================================================

ADMINISTRATIVE_TERMS = (
    "ask the therapist",
    "ask the terapist",
    "double booking",
    "duty time",
    "system initialized",
    "file version",
    "employees",
    "information",
    "schedule",
    "appointment",
    "working hours",
    "break time",
    "lunch break",
    "not available",
    "patient search",
    "select therapist",
)


# =========================================================
# EXCEL HEADER ALIASES
# =========================================================

EXCEL_HEADER_ALIASES = {
    "patient_name": {
        "patient name",
        "patient",
        "name",
        "patient full name",
        "full name",
        "patientname",
    },
    "time": {
        "time",
        "appointment time",
        "start time",
        "booking time",
        "start",
        "from",
    },
    "date": {
        "date",
        "appointment date",
        "booking date",
        "visit date",
    },
    "therapist": {
        "therapist",
        "therapist name",
        "physiotherapist",
        "physio",
        "provider",
        "doctor",
    },
    "file_number": {
        "file number",
        "file no",
        "file no.",
        "file",
        "patient id",
        "patient number",
        "medical record number",
        "mrn",
    },
    "confirmation_status": {
        "confirmation status",
        "confirmation",
        "status",
        "booking status",
        "confirmed",
    },
    "appointment_type": {
        "appointment type",
        "visit type",
        "type",
        "service type",
    },
}


# =========================================================
# HEADER NORMALIZATION
# =========================================================

def normalize_excel_header(value):
    text = unicodedata.normalize(
        "NFKC",
        str(value or ""),
    ).strip().casefold()

    text = re.sub(
        r"[_\-/]+",
        " ",
        text,
    )

    return re.sub(
        r"\s+",
        " ",
        text,
    )


def identify_excel_column(value):
    normalized = normalize_excel_header(value)

    for field, aliases in EXCEL_HEADER_ALIASES.items():
        if normalized in aliases:
            return field

    return None


def find_excel_headers(worksheet):
    maximum = min(
        worksheet.max_row or 0,
        30,
    )

    for row_number, row in enumerate(
        worksheet.iter_rows(
            min_row=1,
            max_row=maximum,
            values_only=True,
        ),
        start=1,
    ):
        columns = {}

        for index, cell in enumerate(row):
            field = identify_excel_column(cell)

            if field and field not in columns:
                columns[field] = index

        if (
            "patient_name" in columns
            and "time" in columns
        ):
            return row_number, columns

    return None, None


def get_excel_value(row, columns, field):
    index = columns.get(field)

    if index is None or index >= len(row):
        return None

    return row[index]


# =========================================================
# EXCEL DATE NORMALIZATION
# =========================================================

def normalize_excel_date(value, epoch=None):
    if value is None or value == "":
        return None

    if isinstance(value, datetime):
        return value.date()

    if isinstance(value, date):
        return value

    if isinstance(value, (int, float)):
        try:
            result = (
                from_excel(value, epoch=epoch)
                if epoch is not None
                else from_excel(value)
            )

            if isinstance(result, datetime):
                return result.date()

            if isinstance(result, date):
                return result

        except (ValueError, TypeError, OverflowError):
            return None

    text = str(value).strip()

    formats = (
        "%Y-%m-%d",
        "%d/%m/%Y",
        "%m/%d/%Y",
        "%d-%m-%Y",
        "%d.%m.%Y",
    )

    for fmt in formats:
        try:
            return datetime.strptime(
                text,
                fmt,
            ).date()
        except ValueError:
            continue

    return None


# =========================================================
# EXCEL TIME NORMALIZATION
# =========================================================

def normalize_excel_time(value, epoch=None):
    if value is None or value == "":
        return None

    if isinstance(value, (datetime, time)):
        return value.strftime("%H:%M")

    if isinstance(value, (int, float)):
        try:
            result = (
                from_excel(value, epoch=epoch)
                if epoch is not None
                else from_excel(value)
            )

            if isinstance(result, (datetime, time)):
                return result.strftime("%H:%M")

        except (ValueError, TypeError, OverflowError):
            return None

        return None

    text = re.sub(
        r"\s+",
        " ",
        str(value).strip(),
    ).upper()

    formats = (
        "%H:%M",
        "%H:%M:%S",
        "%I:%M %p",
        "%I:%M%p",
        "%I %p",
    )

    for fmt in formats:
        try:
            return datetime.strptime(
                text,
                fmt,
            ).strftime("%H:%M")
        except ValueError:
            continue

    return None


# =========================================================
# EXCEL STATUS AND TYPE
# =========================================================

def normalize_excel_status(value):
    if value is None or str(value).strip() == "":
        return DEFAULT_CONFIRMATION_STATUS, False

    text = normalize_excel_header(value)

    aliases = {
        "confirmed": "confirmed",
        "yes": "confirmed",
        "true": "confirmed",
        "unconfirmed": "unconfirmed",
        "not confirmed": "unconfirmed",
        "pending": "unconfirmed",
        "no answer": "no_answer",
        "phone off": "phone_off",
        "cancelled": "cancelled",
        "canceled": "cancelled",
        "rescheduled": "rescheduled",
    }

    status = aliases.get(text)

    if status:
        return status, True

    return DEFAULT_CONFIRMATION_STATUS, False


def normalize_excel_type(value):
    if value is None or str(value).strip() == "":
        return DEFAULT_APPOINTMENT_TYPE

    text = normalize_excel_header(value)

    evaluation_terms = (
        "evaluation",
        "assessment",
        "initial",
        "new patient",
    )

    if any(term in text for term in evaluation_terms):
        return "evaluation"

    return "followup"


def get_excel_file_number(value):
    if value is None:
        return ""

    if isinstance(value, float) and value.is_integer():
        return str(int(value))

    return str(value).strip()


# =========================================================
# PATIENT MATCHING
# =========================================================

def build_excel_patient_indexes():
    by_name = {}
    by_file = {}

    patients = Patient.objects.filter(
        is_archived=False,
    ).only(
        "id",
        "name",
        "patient_id",
    )

    for patient in patients:
        name_key = normalized_name(patient.name)

        file_key = str(
            patient.patient_id or ""
        ).strip()

        if name_key:
            if name_key in by_name:
                by_name[name_key] = None
            else:
                by_name[name_key] = patient

        if file_key:
            if file_key in by_file:
                by_file[file_key] = None
            else:
                by_file[file_key] = patient

    return by_name, by_file


def match_excel_patient(
    name,
    file_number,
    by_name,
    by_file,
):
    if file_number:
        patient = by_file.get(file_number)

        # Never automatically link a file number
        # to a different patient name.
        if (
            patient is not None
            and normalized_name(patient.name)
            == normalized_name(name)
        ):
            return patient

        return None

    return by_name.get(
        normalized_name(name)
    )


def is_administrative_text(text):
    value = normalized_name(text)

    return any(
        term in value
        for term in ADMINISTRATIVE_TERMS
    )


# =========================================================
# READ EXCEL SCHEDULE
# =========================================================

def read_excel_schedule(
    uploaded,
    selected_date,
    therapist_user,
):
    if uploaded is None:
        raise ValueError(
            "Please select an Excel schedule"
        )

    if not uploaded.name.lower().endswith(".xlsx"):
        raise ValueError(
            "Only .xlsx Excel files are supported"
        )

    if uploaded.size == 0:
        raise ValueError(
            "The Excel file is empty"
        )

    if uploaded.size > MAX_EXCEL_BYTES:
        raise ValueError(
            "Excel file exceeds the 10 MB limit"
        )

    try:
        workbook = load_workbook(
            uploaded,
            read_only=True,
            data_only=True,
        )
    except Exception as exc:
        raise ValueError(
            "Unable to read Excel workbook"
        ) from exc

    appointments = []
    warnings = []
    detected_sheets = []

    processed_rows = 0
    skipped_rows = 0
    unknown_times = 0

    by_name, by_file = build_excel_patient_indexes()

    try:
        for worksheet in workbook.worksheets:
            header_row, columns = find_excel_headers(
                worksheet
            )

            if columns is None:
                warnings.append(
                    f"Sheet '{worksheet.title}' skipped: "
                    "Patient Name and Time columns "
                    "were not found."
                )
                continue

            detected_sheets.append(worksheet.title)

            rows = worksheet.iter_rows(
                min_row=header_row + 1,
                values_only=True,
            )

            for row_number, row in enumerate(
                rows,
                start=header_row + 1,
            ):
                processed_rows += 1

                if processed_rows > MAX_EXCEL_ROWS:
                    raise ValueError(
                        "Excel file contains too many rows"
                    )

                raw_name = get_excel_value(
                    row,
                    columns,
                    "patient_name",
                )

                name = " ".join(
                    str(raw_name or "").split()
                )

                if not name:
                    continue

                if len(name) > 255:
                    skipped_rows += 1
                    warnings.append(
                        f"Sheet '{worksheet.title}', "
                        f"row {row_number}: "
                        "Patient name is too long."
                    )
                    continue

                if is_administrative_text(name):
                    skipped_rows += 1
                    continue

                # DATE FILTER
                excel_date_value = get_excel_value(
                    row,
                    columns,
                    "date",
                )

                if excel_date_value not in (None, ""):
                    row_date = normalize_excel_date(
                        excel_date_value,
                        workbook.epoch,
                    )

                    if row_date is None:
                        skipped_rows += 1
                        warnings.append(
                            f"Sheet '{worksheet.title}', "
                            f"row {row_number}: "
                            "Unrecognized appointment date."
                        )
                        continue

                    if row_date != selected_date:
                        continue

                # THERAPIST FILTER
                excel_therapist = get_excel_value(
                    row,
                    columns,
                    "therapist",
                )

                if excel_therapist not in (None, ""):
                    accepted_names = {
                        normalized_name(therapist_user.username),
                        normalized_name(
                            therapist_display_name(therapist_user)
                        ),
                    }

                    if (
                        normalized_name(excel_therapist)
                        not in accepted_names
                    ):
                        continue

                # APPOINTMENT TIME
                appointment_time = normalize_excel_time(
                    get_excel_value(
                        row,
                        columns,
                        "time",
                    ),
                    workbook.epoch,
                )

                if appointment_time is None:
                    unknown_times += 1

                # PATIENT MATCHING
                file_number = get_excel_file_number(
                    get_excel_value(
                        row,
                        columns,
                        "file_number",
                    )
                )

                patient = match_excel_patient(
                    name,
                    file_number,
                    by_name,
                    by_file,
                )

                # CONFIRMATION AND TYPE
                status, status_known = normalize_excel_status(
                    get_excel_value(
                        row,
                        columns,
                        "confirmation_status",
                    )
                )

                appointment_type = normalize_excel_type(
                    get_excel_value(
                        row,
                        columns,
                        "appointment_type",
                    )
                )

                # PREVIEW RECORD
                appointments.append({
                    "time": appointment_time,
                    "patient_name": name,
                    "patient_id": patient.id if patient else None,
                    "file_number": (
                        str(patient.patient_id)
                        if patient
                        else file_number
                    ),
                    "confirmation_status": status,
                    "appointment_type": appointment_type,
                    "matched": patient is not None,
                    "needs_review": (
                        appointment_time is None
                        or not status_known
                        or patient is None
                    ),
                    "source": "excel",
                    "confirmation_known": status_known,
                    "time_known": appointment_time is not None,
                    "excel_sheet": worksheet.title,
                    "excel_row": row_number,
                    "import_key": (
                        f"{worksheet.title}:{row_number}"
                    ),
                })

                if len(appointments) > MAX_APPOINTMENTS:
                    raise ValueError(
                        "More than 200 appointments were found. "
                        "Import a smaller schedule."
                    )

    finally:
        workbook.close()

    appointments.sort(
        key=lambda item: (
            item["time"] or "99:99",
            item["excel_sheet"],
            item["excel_row"],
        )
    )

    if not detected_sheets:
        raise ValueError(
            "No worksheet contains recognizable "
            "Patient Name and Time columns."
        )

    if unknown_times:
        warnings.append(
            f"{unknown_times} appointments have "
            "unrecognized times. Correct these before publishing."
        )

    if skipped_rows:
        warnings.append(
            f"{skipped_rows} rows were skipped."
        )

    warnings.append(
        "Review all imported appointments before saving. "
        "Excel rows are preserved, including double bookings."
    )

    debug = {
        "processed_rows": processed_rows,
        "skipped_rows": skipped_rows,
        "detected_sheets": detected_sheets,
        "unknown_times": unknown_times,
    }

    return appointments, warnings, debug


# =========================================================
# EXCEL EXTRACTION API
# POST /extract/
# =========================================================

@require_http_methods(["POST"])
def extract_schedule_api(request):
    """
    POST /api/physio/schedule/extract/

    Multipart form:
        file: .xlsx workbook
        therapist: therapist username
        date: YYYY-MM-DD

    Returns an Excel appointment preview.
    Does not save appointments automatically.
    """

    auth_error = require_manager(request)

    if auth_error is not None:
        return auth_error

    uploaded = request.FILES.get("file")

    therapist_username = str(
        request.POST.get("therapist") or ""
    ).strip()

    therapist_user = get_active_therapist(
        therapist_username
    )

    selected_date = parse_date(
        request.POST.get("date")
    )

    if therapist_user is None:
        return error(
            "Please select a valid active physiotherapist"
        )

    if selected_date is None:
        return error(
            "Please select a valid schedule date"
        )

    try:
        appointments, warnings, debug = read_excel_schedule(
            uploaded,
            selected_date,
            therapist_user,
        )

    except ValueError as exc:
        return error(str(exc), 422)

    except Exception:
        logger.exception(
            "Unexpected Excel schedule import error"
        )

        return error(
            "Unexpected Excel import error",
            500,
        )

    matched_count = sum(
        item["matched"]
        for item in appointments
    )

    review_count = sum(
        item["needs_review"]
        for item in appointments
    )

    return JsonResponse({
        "message": (
            "Excel schedule imported successfully. "
            "Review appointments before publishing."
        ),
        "therapist": therapist_user.username,
        "therapist_name": therapist_display_name(therapist_user),
        "date": selected_date.isoformat(),
        "appointments": appointments,
        "summary": calculate_summary(appointments),
        "total": len(appointments),
        "matched_count": matched_count,
        "unmatched_count": len(appointments) - matched_count,
        "missing_time_count": debug["unknown_times"],
        "review_count": review_count,
        "warnings": warnings,
        "requires_review": True,
        "published": False,
        "import_method": "excel",
        "api_cost": 0,
        "import_debug": debug,
    })
