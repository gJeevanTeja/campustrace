from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, PasswordResetToken
import re


class UserSerializer(serializers.ModelSerializer):
    college_data = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'name', 'username', 'email', 'phone', 'role', 'department',
            'section', 'college_year', 'student_id', 'avatar', 'avatar_url',
            'notifications_enabled', 'notification_sound', 'email_notifications',
            'dark_mode', 'auth_provider', 'created_at', 'reward_points', 'level',
            'successful_returns', 'badges', 'college_data'
        ]
        read_only_fields = ['id', 'created_at']

    def get_college_data(self, obj):
        if obj.college:
            from colleges.serializers import CollegeSerializer
            return CollegeSerializer(obj.college).data
        return None

    def get_avatar_url(self, obj):
        request = self.context.get('request')
        if obj.avatar and request:
            return request.build_absolute_uri(obj.avatar.url)
        if obj.google_picture:
            return obj.google_picture
        return None


class RegisterSerializer(serializers.ModelSerializer):
    password         = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)
    terms_accepted   = serializers.BooleanField(write_only=True)
    college_name     = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            'name', 'username', 'email', 'phone', 'department',
            'section', 'college_year', 'college_name', 'password', 'confirm_password',
            'terms_accepted'
        ]

    def validate_name(self, value):
        value = value.strip()
        if len(value) < 2:
            raise serializers.ValidationError("Full name must be at least 2 characters.")
        if not re.match(r'^[a-zA-Z\s]+$', value):
            raise serializers.ValidationError("Name can only contain letters and spaces.")
        return value

    def validate_username(self, value):
        if not value:
            return value
        value = value.strip().lower()
        if ' ' in value:
            raise serializers.ValidationError("Username cannot contain spaces.")
        if not re.match(r'^[a-zA-Z0-9_\.]+$', value):
            raise serializers.ValidationError("Username can only contain letters, numbers, underscores and dots.")
        if len(value) < 3:
            raise serializers.ValidationError("Username must be at least 3 characters.")
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists. Try another one.")
        return value

    def validate_email(self, value):
        value = value.lower().strip()
        email_regex = r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_regex, value):
            raise serializers.ValidationError("Enter a valid email address.")
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        
        return value

    def validate_phone(self, value):
        cleaned = re.sub(r'\D', '', value)
        if cleaned.startswith('91') and len(cleaned) == 12:
            cleaned = cleaned[2:]
        if len(cleaned) != 10:
            raise serializers.ValidationError("Phone number must be exactly 10 digits.")
        if cleaned[0] not in '6789':
            raise serializers.ValidationError("Enter a valid Indian mobile number starting with 6, 7, 8, or 9.")
        phone_formatted = f"+91{cleaned}"
        # Unique phone check
        if User.objects.filter(phone=phone_formatted).exists():
            raise serializers.ValidationError("This phone number is already registered.")
        return phone_formatted

    def validate_terms_accepted(self, value):
        if not value:
            raise serializers.ValidationError("You must accept the Terms and Conditions to register.")
        return value

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        password = data['password']
        if not re.search(r'[A-Z]', password):
            raise serializers.ValidationError({"password": "Password must contain at least one uppercase letter."})
        if not re.search(r'[0-9]', password):
            raise serializers.ValidationError({"password": "Password must contain at least one number."})
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        validated_data.pop('terms_accepted')
        username = validated_data.pop('username', None)
        college_name = validated_data.pop('college_name', None)
        
        email = validated_data.get('email', '')
        
        user = User.objects.create_user(**validated_data)
        
        if college_name and email:
            from colleges.models import College
            domain = email.split('@')[-1].lower()
            # Try to find exactly, or create a brand new one
            college_obj, created = College.objects.get_or_create(
                name__iexact=college_name.strip(),
                defaults={
                    'name': college_name.strip(),
                    'email_domain': domain
                }
            )
            user.college = college_obj

        if username:
            user.username = username.lower()
            
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    email    = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        import logging
        logger = logging.getLogger('users.auth')
        
        identifier = data.get('email') or data.get('identity')
        password   = data.get('password') or data.get('secret_key')

        if identifier:
            identifier = identifier.strip()

        # --- DEBUG LOGS ---
        logger.info(f"[AUTH DEBUG] Login attempt received for: {identifier}")

        if not identifier or not password:
            logger.warning("[AUTH DEBUG] Validation failed: Missing email or password")
            raise serializers.ValidationError({"detail": "Email/phone and password are required."})

        user = None
        try:
            # 1. Identifier type check
            cleaned_phone = re.sub(r'\D', '', identifier)
            is_phone = (len(cleaned_phone) == 10 and cleaned_phone[0] in '6789')
            
            if not is_phone:
                email = identifier.lower()
                email_regex = r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$'
                if not re.match(email_regex, email):
                    logger.warning(f"[AUTH DEBUG] Invalid email format: {email}")
                    raise serializers.ValidationError({"detail": "Invalid email format"})

                # 2. User existence check
                user = User.objects.filter(email=email).first()
                if not user:
                    logger.warning(f"[AUTH DEBUG] User not found in database: {email}")
                    raise serializers.ValidationError({"detail": "User not found"})
                logger.info(f"[AUTH DEBUG] User exists: {user.email} (ID: {user.id})")
            else:
                phone_variants = [f"+91{cleaned_phone}", cleaned_phone]
                user = User.objects.filter(phone__in=phone_variants).first()
                if not user:
                    logger.warning(f"[AUTH DEBUG] User not found for phone: {identifier}")
                    raise serializers.ValidationError({"detail": "User not found"})
                logger.info(f"[AUTH DEBUG] User exists by phone: {user.email}")

            # 3. Password check
            # user.check_password handles the secure hashing comparison (PBKDF2/bcrypt)
            logger.info(f"[AUTH DEBUG] Verifying password for user: {user.email}")
            is_match = user.check_password(password)
            logger.info(f"[AUTH DEBUG] Password match result: {is_match}")
            
            if not is_match:
                logger.warning(f"[AUTH DEBUG] Authentication failed: Incorrect password for {user.email}")
                raise serializers.ValidationError({"detail": "Incorrect password"})

            # 4. Account status checks
            if not getattr(user, 'is_active', True):
                logger.warning(f"[AUTH DEBUG] Authentication failed: Account deactivated for {user.email}")
                raise serializers.ValidationError({"detail": "Your account has been deactivated."})
            if getattr(user, 'is_blocked', False):
                logger.warning(f"[AUTH DEBUG] Authentication failed: Account blocked for {user.email}")
                raise serializers.ValidationError({"detail": "Your account is blocked. Contact administrator."})

            logger.info(f"[AUTH DEBUG] LOGIN SUCCESSFUL: {user.email}")

        except serializers.ValidationError:
            raise
        except Exception as e:
            from django.db import OperationalError, InterfaceError
            logger.error(f"[AUTH DEBUG] CRITICAL ERROR during login: {str(e)}", exc_info=True)
            
            if isinstance(e, (OperationalError, InterfaceError)):
                raise serializers.ValidationError({"detail": "Database connection failure"})
            
            raise serializers.ValidationError({"detail": "Authentication service error. Please try again later."})

        data['user'] = user
        return data


class UpdateProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'name', 'username', 'phone', 'department', 'section',
            'college_year', 'notifications_enabled',
            'notification_sound', 'email_notifications', 'dark_mode'
        ]

    def validate_username(self, value):
        if not value:
            return value
        value = value.strip().lower()
        if ' ' in value:
            raise serializers.ValidationError("Username cannot contain spaces.")
        qs = User.objects.filter(username=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Username already exists. Try another one.")
        return value

    def validate_phone(self, value):
        if not value:
            return value
        cleaned = re.sub(r'\D', '', value)
        if cleaned.startswith('91') and len(cleaned) == 12:
            cleaned = cleaned[2:]
        if len(cleaned) != 10:
            raise serializers.ValidationError("Phone number must be exactly 10 digits.")
        if cleaned[0] not in '6789':
            raise serializers.ValidationError("Enter a valid Indian mobile number.")
        phone_formatted = f"+91{cleaned}"
        qs = User.objects.filter(phone=phone_formatted)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("This phone number is already registered.")
        return phone_formatted


class ChangePasswordSerializer(serializers.Serializer):
    old_password         = serializers.CharField(write_only=True)
    new_password         = serializers.CharField(write_only=True, min_length=8)
    confirm_new_password = serializers.CharField(write_only=True)

    def validate(self, data):
        if data['new_password'] != data['confirm_new_password']:
            raise serializers.ValidationError({"confirm_new_password": "Passwords do not match."})
        return data


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        value = value.lower().strip()
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError("No account found with this email address.")
        return value


class ResetPasswordSerializer(serializers.Serializer):
    token            = serializers.CharField()
    new_password     = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return data


class OTPRequestSerializer(serializers.Serializer):
    identifier = serializers.CharField()   # email or phone
    otp_type   = serializers.ChoiceField(choices=['email', 'phone'], default='email')


class OTPVerifySerializer(serializers.Serializer):
    identifier = serializers.CharField()
    otp_code   = serializers.CharField(min_length=6, max_length=6)


