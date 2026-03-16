from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
import random
import string


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email).lower()
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'super_admin')
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [
        ('super_admin', 'Super Admin'),
        ('college_admin', 'College Admin'),
        ('moderator', 'Moderator'),
        ('student', 'Student'),
        ('faculty', 'Faculty'),
    ]

    # Basic Info
    name       = models.CharField(max_length=100)
    username   = models.CharField(max_length=50, unique=True, null=True, blank=True)
    email      = models.EmailField(unique=True)
    phone      = models.CharField(max_length=20, blank=True, null=True, unique=True)
    role       = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student')
    
    # College Link
    college    = models.ForeignKey('colleges.College', on_delete=models.SET_NULL, null=True, blank=True, related_name='users')
    
    # Status Flags
    is_blocked  = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    last_active = models.DateTimeField(auto_now=True)

    # Academic Info
    department   = models.CharField(max_length=100, blank=True, null=True)
    section      = models.CharField(max_length=20, blank=True, null=True)
    college_year = models.CharField(max_length=20, blank=True, null=True)
    student_id   = models.CharField(max_length=50, blank=True, null=True)

    # Profile Photo
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)

    # Google OAuth
    google_id        = models.CharField(max_length=200, blank=True, null=True, unique=True)
    google_picture   = models.URLField(blank=True, null=True)
    auth_provider    = models.CharField(max_length=20, default='email')  # email | google | otp

    # Notification Settings
    notifications_enabled = models.BooleanField(default=True)
    notification_sound    = models.BooleanField(default=True)
    email_notifications   = models.BooleanField(default=True)

    # UI Preference
    dark_mode = models.BooleanField(default=False)

    # Location
    last_known_lat = models.FloatField(null=True, blank=True)
    last_known_lng = models.FloatField(null=True, blank=True)

    # Gamification
    points             = models.IntegerField(default=0)
    successful_returns = models.IntegerField(default=0)

    # Django Required
    is_active  = models.BooleanField(default=True)
    is_staff   = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = ['name']

    objects = UserManager()

    class Meta:
        db_table = 'users'

    def __str__(self):
        return f"{self.name} ({self.email})"

    def get_avatar_url(self):
        if self.avatar:
            return self.avatar.url
        if self.google_picture:
            return self.google_picture
        return None


class PasswordResetToken(models.Model):
    user        = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reset_tokens')
    token       = models.CharField(max_length=200, unique=True)
    expiry_time = models.DateTimeField()
    is_used     = models.BooleanField(default=False)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'password_reset_tokens'

    def is_expired(self):
        from django.utils import timezone
        return timezone.now() > self.expiry_time


class OTPVerification(models.Model):
    """For OTP-based login via email or phone"""
    OTP_TYPE_CHOICES = [('email', 'Email'), ('phone', 'Phone')]

    user       = models.ForeignKey(User, on_delete=models.CASCADE, related_name='otps', null=True, blank=True)
    identifier = models.CharField(max_length=200)   # email or phone
    otp_code   = models.CharField(max_length=6)
    otp_type   = models.CharField(max_length=10, choices=OTP_TYPE_CHOICES, default='email')
    is_used    = models.BooleanField(default=False)
    expiry_time = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'otp_verifications'

    def is_expired(self):
        from django.utils import timezone
        return timezone.now() > self.expiry_time

    @classmethod
    def generate_otp(cls):
        return ''.join(random.choices(string.digits, k=6))