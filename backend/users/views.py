import secrets
import random
import string
import re
from datetime import timedelta

from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User, PasswordResetToken, OTPVerification
from .serializers import (
    UserSerializer, RegisterSerializer, LoginSerializer,
    UpdateProfileSerializer, ChangePasswordSerializer,
    ForgotPasswordSerializer, ResetPasswordSerializer,
    OTPRequestSerializer, OTPVerifySerializer,
)


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {'refresh': str(refresh), 'access': str(refresh.access_token)}


# ── ✅ SMS Helper (Fast2SMS — free Indian SMS gateway) ──────────────────────
def send_sms_otp(phone_number, otp_code, user_name=''):
    """
    Sends OTP via Fast2SMS (free tier — https://fast2sms.com).
    Set FAST2SMS_API_KEY in settings.py / .env.
    Falls back gracefully if key not set (logs OTP to console for dev).
    """
    import urllib.request
    import urllib.parse
    import json

    api_key = getattr(settings, 'FAST2SMS_API_KEY', None)

    # Strip +91 prefix for Fast2SMS
    cleaned = re.sub(r'\D', '', phone_number)
    if cleaned.startswith('91') and len(cleaned) == 12:
        cleaned = cleaned[2:]

    if not api_key:
        # Dev mode: print OTP to console so you can test without SMS
        print(f"\n[DEV SMS] OTP for {phone_number}: {otp_code}\n")
        return True  # Pretend it worked

    try:
        message = f"Your CampusTrace OTP is {otp_code}. Valid for 5 minutes. Do not share."
        url = "https://www.fast2sms.com/dev/bulkV2"
        params = urllib.parse.urlencode({
            'authorization': api_key,
            'route': 'q',         # Quick Transactional route
            'message': message,
            'language': 'english',
            'flash': 0,
            'numbers': cleaned,
        })
        req = urllib.request.Request(
            f"{url}?{params}",
            headers={'cache-control': 'no-cache'},
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            result = json.loads(response.read())
            print(f"[SMS] Fast2SMS response: {result}")
            return result.get('return', False)
    except Exception as e:
        print(f"[SMS ERROR] {e}")
        return False


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            tokens = get_tokens_for_user(user)
            return Response({
                'message': 'Registration successful! Welcome to CampusTrace.',
                'tokens': tokens,
                'user': UserSerializer(user, context={'request': request}).data,
            }, status=status.HTTP_201_CREATED)

        errors = serializer.errors
        first_error = next(iter(errors.values()))
        if isinstance(first_error, list):
            first_error = first_error[0]
        return Response({'message': str(first_error), 'errors': errors},
                        status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            tokens = get_tokens_for_user(user)
            return Response({
                'message': 'Login successful!',
                'tokens': tokens,
                'user': UserSerializer(user, context={'request': request}).data,
            })
        errors = serializer.errors
        msg = errors.get('detail') or errors.get('non_field_errors', ['Invalid credentials'])[0]
        return Response({'message': str(msg), 'errors': errors},
                        status=status.HTTP_401_UNAUTHORIZED)


class LogoutView(APIView):
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
        except Exception:
            pass
        return Response({'message': 'Logged out successfully.'})


class ProfileView(APIView):
    def get(self, request):
        return Response(UserSerializer(request.user, context={'request': request}).data)

    def patch(self, request):
        serializer = UpdateProfileSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Profile updated successfully.',
                'user': UserSerializer(request.user, context={'request': request}).data,
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UploadAvatarView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        avatar = request.FILES.get('avatar')
        if not avatar:
            return Response({'error': 'No image provided.'}, status=status.HTTP_400_BAD_REQUEST)
        if not avatar.content_type.startswith('image/'):
            return Response({'error': 'File must be an image.'}, status=status.HTTP_400_BAD_REQUEST)
        request.user.avatar = avatar
        request.user.save()
        return Response({
            'message': 'Profile photo updated.',
            'avatar_url': request.build_absolute_uri(request.user.avatar.url),
        })


class ChangePasswordView(APIView):
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response({'error': 'Current password is incorrect.'},
                            status=status.HTTP_400_BAD_REQUEST)

        user.set_password(serializer.validated_data['new_password'])
        user.save()
        try:
            from notifications.models import Notification
            Notification.objects.create(
                user=user,
                message='Your password was changed successfully.',
                notification_type='password_changed',
            )
        except Exception:
            pass
        return Response({'message': 'Password changed successfully.'})


class SettingsView(APIView):
    ALLOWED_FIELDS = ['notifications_enabled', 'notification_sound', 'email_notifications', 'dark_mode']

    def get(self, request):
        u = request.user
        return Response({
            'notifications_enabled': u.notifications_enabled,
            'notification_sound':    u.notification_sound,
            'email_notifications':   u.email_notifications,
            'dark_mode':             u.dark_mode,
        })

    def patch(self, request):
        user = request.user
        updated_fields = []
        for field in self.ALLOWED_FIELDS:
            if field in request.data:
                val = request.data[field]
                if isinstance(val, str):
                    val = val.lower() == 'true'
                setattr(user, field, bool(val))
                updated_fields.append(field)
        if not updated_fields:
            return Response({'error': 'No valid settings fields provided.'}, status=status.HTTP_400_BAD_REQUEST)
        user.save(update_fields=updated_fields)
        return Response({
            'message': 'Settings saved.',
            'dark_mode': user.dark_mode,
            'notifications_enabled': user.notifications_enabled,
            'notification_sound': user.notification_sound,
            'email_notifications': user.email_notifications,
        })

    def put(self, request):
        return self.patch(request)


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email']
        user = User.objects.get(email=email)
        PasswordResetToken.objects.filter(user=user, is_used=False).update(is_used=True)
        token_str = secrets.token_urlsafe(48)
        PasswordResetToken.objects.create(
            user=user, token=token_str,
            expiry_time=timezone.now() + timedelta(hours=1),
        )
        reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token_str}"
        try:
            send_mail(
                subject='Reset Your CampusTrace Password',
                message=f"Hi {user.name},\n\nReset link (expires 1 hour):\n{reset_link}\n\n— CampusTrace Team",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
            return Response({'message': 'Password reset email sent! Check your inbox.'})
        except Exception as e:
            return Response({'error': f'Failed to send email. ({str(e)})'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        token_str = serializer.validated_data['token']
        try:
            token_obj = PasswordResetToken.objects.select_related('user').get(
                token=token_str, is_used=False
            )
        except PasswordResetToken.DoesNotExist:
            return Response({'error': 'Invalid or expired reset link.'}, status=status.HTTP_400_BAD_REQUEST)

        if token_obj.is_expired():
            return Response({'error': 'This reset link has expired.'}, status=status.HTTP_400_BAD_REQUEST)

        user = token_obj.user
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        token_obj.is_used = True
        token_obj.save()
        return Response({'message': 'Password reset successfully! Please log in.'})


class UpdateLocationView(APIView):
    def post(self, request):
        lat = request.data.get('latitude')
        lng = request.data.get('longitude')
        if lat is None or lng is None:
            return Response({'error': 'latitude and longitude are required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            lat, lng = float(lat), float(lng)
        except (ValueError, TypeError):
            return Response({'error': 'Invalid coordinates.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            request.user.last_known_lat = lat
            request.user.last_known_lng = lng
            request.user.save(update_fields=['last_known_lat', 'last_known_lng'])
        except Exception:
            pass
        return Response({'message': 'Location updated.', 'latitude': lat, 'longitude': lng})


# ── OTP Login ──────────────────────────────────────────────────────────────

class SendOTPView(APIView):
    """
    POST /api/auth/send-otp/
    { "identifier": "user@email.com" OR "9876543210", "otp_type": "email" OR "phone" }
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = OTPRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        identifier = serializer.validated_data['identifier'].strip()
        otp_type   = serializer.validated_data['otp_type']

        user = None

        if otp_type == 'email':
            try:
                user = User.objects.get(email=identifier.lower())
            except User.DoesNotExist:
                return Response(
                    {'error': 'No account found with this email.'},
                    status=status.HTTP_404_NOT_FOUND,
                )

        else:
            # ── Phone OTP ──────────────────────────────────────────────
            cleaned = re.sub(r'\D', '', identifier)
            if cleaned.startswith('91') and len(cleaned) == 12:
                cleaned = cleaned[2:]

            for phone_val in [f"+91{cleaned}", cleaned, f"91{cleaned}"]:
                try:
                    user = User.objects.get(phone=phone_val)
                    identifier = phone_val   # normalize to stored format
                    break
                except User.DoesNotExist:
                    continue

            if not user:
                return Response(
                    {'error': 'No account found with this phone number.'},
                    status=status.HTTP_404_NOT_FOUND,
                )

        # Invalidate previous unused OTPs for this identifier
        OTPVerification.objects.filter(identifier=identifier, is_used=False).update(is_used=True)

        # Generate & save OTP
        otp_code = OTPVerification.generate_otp()
        OTPVerification.objects.create(
            user=user,
            identifier=identifier,
            otp_code=otp_code,
            otp_type=otp_type,
            expiry_time=timezone.now() + timedelta(minutes=5),
        )

        # ── Send OTP ───────────────────────────────────────────────────
        if otp_type == 'email':
            try:
                send_mail(
                    subject='Your CampusTrace Login OTP',
                    message=f"Hi {user.name},\n\nYour OTP is: {otp_code}\n\nExpires in 5 minutes. Do not share.\n\n— CampusTrace Team",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[identifier],
                    fail_silently=False,
                )
            except Exception as e:
                return Response(
                    {'error': f'Failed to send OTP email: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )
            return Response({'message': 'OTP sent to your email. Valid for 5 minutes.'})

        else:
            # ── ✅ SMS OTP via Fast2SMS ──────────────────────────────
            sms_sent = send_sms_otp(identifier, otp_code, user.name)
            if sms_sent:
                return Response({'message': 'OTP sent to your phone. Valid for 5 minutes.'})
            else:
                # OTP is saved — tell user to check backend console in dev
                return Response({
                    'message': 'OTP generated. If SMS is delayed, check with support.',
                    'dev_note': 'Check Django console for OTP (SMS key not configured).',
                })


class VerifyOTPView(APIView):
    """
    POST /api/auth/verify-otp/
    { "identifier": "user@email.com", "otp_code": "123456" }
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = OTPVerifySerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        identifier = serializer.validated_data['identifier'].strip()
        otp_code   = serializer.validated_data['otp_code'].strip()

        # Also try with +91 prefix for phone identifiers
        otp_obj = None
        identifiers_to_try = [identifier]
        cleaned = re.sub(r'\D', '', identifier)
        if cleaned.startswith('91') and len(cleaned) == 12:
            cleaned = cleaned[2:]
        if len(cleaned) == 10 and cleaned[0] in '6789':
            identifiers_to_try = [f"+91{cleaned}", cleaned, identifier]

        for ident in identifiers_to_try:
            try:
                otp_obj = OTPVerification.objects.filter(
                    identifier=ident, otp_code=otp_code, is_used=False
                ).latest('created_at')
                break
            except OTPVerification.DoesNotExist:
                continue

        if not otp_obj:
            return Response({'error': 'Invalid OTP. Please try again.'}, status=status.HTTP_400_BAD_REQUEST)

        if otp_obj.is_expired():
            return Response({'error': 'OTP has expired. Please request a new one.'}, status=status.HTTP_400_BAD_REQUEST)

        otp_obj.is_used = True
        otp_obj.save()

        user = otp_obj.user
        tokens = get_tokens_for_user(user)
        return Response({
            'message': 'OTP verified! Login successful.',
            'tokens': tokens,
            'user': UserSerializer(user, context={'request': request}).data,
        })


# ── Google OAuth ────────────────────────────────────────────────────────────

# ✅ University email domains allowed for Google Sign-In
ALLOWED_UNIVERSITY_DOMAINS = getattr(settings, 'ALLOWED_UNIVERSITY_DOMAINS', None)
# If None → allow ALL domains (open mode)
# Set in settings.py like: ALLOWED_UNIVERSITY_DOMAINS = ['mallareddyuniversity.ac.in', 'mrcet.ac.in']


def is_university_email(email):
    """Returns True if email is allowed. If ALLOWED_UNIVERSITY_DOMAINS is not set, allows all."""
    if not ALLOWED_UNIVERSITY_DOMAINS:
        return True  # Open mode — no restriction
    domain = email.split('@')[-1].lower() if '@' in email else ''
    return domain in [d.lower() for d in ALLOWED_UNIVERSITY_DOMAINS]


class GoogleAuthView(APIView):
    """
    POST /api/auth/google/
    { "google_token": "...", "name": "...", "email": "...", "google_id": "...", "picture": "..." }
    """
    permission_classes = [AllowAny]

    def post(self, request):
        email     = request.data.get('email', '').lower().strip()
        name      = request.data.get('name', '').strip()
        google_id = request.data.get('google_id', '').strip()
        picture   = request.data.get('picture', '')

        if not email or not google_id:
            return Response(
                {'error': 'email and google_id are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ✅ University email restriction for Google Sign-In
        if not is_university_email(email):
            return Response(
                {'error': 'Only university email accounts are allowed. Please use your university Google account.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        user = None
        try:
            user = User.objects.get(google_id=google_id)
        except User.DoesNotExist:
            try:
                user = User.objects.get(email=email)
                user.google_id      = google_id
                user.google_picture = picture
                user.auth_provider  = 'google'
                user.save(update_fields=['google_id', 'google_picture', 'auth_provider'])
            except User.DoesNotExist:
                user = User.objects.create_user(
                    email=email,
                    name=name or email.split('@')[0],
                    google_id=google_id,
                    google_picture=picture,
                    auth_provider='google',
                )
                user.set_unusable_password()
                user.save()

        if not user.is_active:
            return Response(
                {'error': 'Your account has been deactivated.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        tokens = get_tokens_for_user(user)
        return Response({
            'message': 'Google login successful!',
            'tokens': tokens,
            'user': UserSerializer(user, context={'request': request}).data,
        })


# ── Username Check ──────────────────────────────────────────────────────────

class CheckUsernameView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        username = request.query_params.get('username', '').strip().lower()
        if not username or len(username) < 3:
            return Response({'available': False, 'error': 'Username too short'})
        if not re.match(r'^[a-zA-Z0-9_\.]+$', username):
            return Response({'available': False, 'error': 'Invalid characters'})
        exists = User.objects.filter(username=username).exists()
        return Response({
            'available': not exists,
            'message': 'Username is available!' if not exists else 'Username already taken.',
        })