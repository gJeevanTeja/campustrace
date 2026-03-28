"""
Django settings for CampusTrace Lost & Found Portal
✅ UPDATED: SQLite → Neon PostgreSQL (cloud shared database)
"""
from pathlib import Path
from datetime import timedelta
import os
import dj_database_url
from dotenv import load_dotenv

# ── Load .env file ─────────────────────────────────────────────
load_dotenv(override=True)

BASE_DIR = Path(__file__).resolve().parent.parent
# ── Django ───────────────────────────────────────────────────
SECRET_KEY = os.environ.get('SECRET_KEY')
DEBUG        = os.environ.get('DEBUG', 'True') == 'True'
ALLOWED_HOSTS = ['*']

# ── Applications ───────────────────────────────────────────────
INSTALLED_APPS = [
    'daphne',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'django_filters',
    'users',
    'items',
    'notifications',
    'chat',
    'colleges',
    'analytics',
    'administration',
    'payments',
]

# ── Middleware ─────────────────────────────────────────────────
MIDDLEWARE = [
    'django.middleware.gzip.GZipMiddleware',     # ✅ Compress responses
    'corsheaders.middleware.CorsMiddleware',   # ✅ MUST be first
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF     = 'unitrace.urls'
WSGI_APPLICATION = 'unitrace.wsgi.application'
ASGI_APPLICATION = 'unitrace.asgi.application'

# ── Templates ──────────────────────────────────────────────────
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# ── Django Channels (WebSockets) ───────────────────────────────
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer',
    },
}

# ══════════════════════════════════════════════════════════════════
# ✅ DATABASE — Support for Neon PostgreSQL (Cloud) and SQLite (Local)
#    Enable USE_LOCAL_SQLITE=True in .env to use local database
# ══════════════════════════════════════════════════════════════════
USE_LOCAL_SQLITE = os.environ.get('USE_LOCAL_SQLITE', 'False') == 'True'

if USE_LOCAL_SQLITE:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }
else:
    DATABASES = {
        'default': dj_database_url.config(
            default=os.environ.get('DATABASE_URL'),
            conn_max_age=0,           # disable pooled connections, let Neon handle it
            conn_health_checks=True,  # auto-reconnect if connection drops
            ssl_require=True,         # Neon requires SSL
        )
    }

AUTHENTICATION_BACKENDS = [
    'users.backends.EmailBackend',
]

PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.BCryptSHA256PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher',
    'django.contrib.auth.hashers.Argon2PasswordHasher',
]

# ── Frontend URL ───────────────────────────────────────────────
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')

# ══════════════════════════════════════════════════════════════════
# ✅ EMAIL — Gmail SMTP (Password reset, notifications)
# ══════════════════════════════════════════════════════════════════
EMAIL_BACKEND       = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST          = 'smtp.gmail.com'
EMAIL_PORT          = 587
EMAIL_USE_TLS       = True
EMAIL_HOST_USER     = os.environ.get('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD')
DEFAULT_FROM_EMAIL  = f'UniTrace <{EMAIL_HOST_USER}>'
EMAIL_SUBJECT_PREFIX = '[UniTrace] '

# ══════════════════════════════════════════════════════════════════
# ✅ SMS OTP — Fast2SMS API Key (Indian SMS gateway)
# ══════════════════════════════════════════════════════════════════
FAST2SMS_API_KEY = os.environ.get('FAST2SMS_API_KEY')

# ══════════════════════════════════════════════════════════════════
# ✅ Groq AI API Key (Free AI for claim verification)
# ══════════════════════════════════════════════════════════════════
GROQ_API_KEY = os.environ.get('GROQ_API_KEY')

# ══════════════════════════════════════════════════════════════════
# ✅ Google Sign-In — University Email Restriction
# ══════════════════════════════════════════════════════════════════
# Option A — Allow ALL Google accounts (open, good for testing):
#   ALLOWED_UNIVERSITY_DOMAINS = None
#
# Option B — Restrict to your university only:
#   ALLOWED_UNIVERSITY_DOMAINS = ['mallareddyuniversity.ac.in', 'mrcet.ac.in']
#
ALLOWED_UNIVERSITY_DOMAINS = None  # ← change to list to restrict

# ── Password Validators ────────────────────────────────────────
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ── Internationalization ───────────────────────────────────────
LANGUAGE_CODE = 'en-us'
TIME_ZONE     = 'Asia/Kolkata'
USE_I18N      = True
USE_TZ        = True

# ── Static & Media Files ───────────────────────────────────────
STATIC_URL  = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL   = '/media/'
MEDIA_ROOT  = BASE_DIR / 'media'

# ── Upload Size Limits (10MB) ──────────────────────────────────
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024
FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024

# ── Defaults ───────────────────────────────────────────────────
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
AUTH_USER_MODEL    = 'users.User'

# ── REST Framework ─────────────────────────────────────────────
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'EXCEPTION_HANDLER': 'unitrace.utils.custom_exception_handler',
}

# ── JWT Settings ───────────────────────────────────────────────
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME':    timedelta(days=7),
    'REFRESH_TOKEN_LIFETIME':   timedelta(days=30),
    'ROTATE_REFRESH_TOKENS':    True,
    'BLACKLIST_AFTER_ROTATION': True,
}

# ── CORS — allow all origins for local network + mobile access ─
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    'accept', 'accept-encoding', 'authorization', 'content-type',
    'dnt', 'origin', 'user-agent', 'x-csrftoken', 'x-requested-with',
    'cache-control',
]
CORS_ALLOW_METHODS = ['DELETE', 'GET', 'OPTIONS', 'PATCH', 'POST', 'PUT']

#  Razorpay Settings 
RAZORPAY_KEY_ID = os.environ.get('RAZORPAY_KEY_ID', 'rzp_test_placeholder')
RAZORPAY_KEY_SECRET = os.environ.get('RAZORPAY_KEY_SECRET', 'placeholder_secret')

# Debug Log
print("Razorpay Key:", RAZORPAY_KEY_ID)
