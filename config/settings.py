from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = "django-insecure-dev-key"

DEBUG = True

ALLOWED_HOSTS = ["*"]

# -------------------
# Applications
# -------------------
INSTALLED_APPS = [
    "corsheaders",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # Your apps
    "users",
    "patients",
    "reception",
    "approvals",
]

# -------------------
# Middleware
# -------------------
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",   # MUST be first
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

# -------------------
# URLs
# -------------------
ROOT_URLCONF = "config.urls"

# -------------------
# Templates
# -------------------
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# -------------------
# Database (SQLite)
# -------------------
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

# -------------------
# Password validation
# -------------------
AUTH_PASSWORD_VALIDATORS = []

# -------------------
# Internationalization
# -------------------
LANGUAGE_CODE = "en-us"

TIME_ZONE = "UTC"

USE_I18N = True

USE_TZ = True

# -------------------
# Static files
# -------------------
STATIC_URL = "static/"

# -------------------
# Default primary key
# -------------------
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# -------------------
# CORS SETTINGS (VERY IMPORTANT)
# -------------------
# -------------------
# CORS SETTINGS
# -------------------
CORS_ALLOWED_ORIGINS = [
    "https://miniature-train-4qrjjq6wvwhqwwr-3000.app.github.dev",
]

CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = [
    "https://miniature-train-4qrjjq6wvwhqwwr-3000.app.github.dev",
]

SESSION_COOKIE_SAMESITE = "None"
SESSION_COOKIE_SECURE = True

CSRF_COOKIE_SAMESITE = "None"
CSRF_COOKIE_SECURE = True
# -------------------
# Custom User Model
# -------------------
AUTH_USER_MODEL = "users.User"