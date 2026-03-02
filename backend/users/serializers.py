from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, PasswordResetToken
import re


class UserSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'name', 'username', 'email', 'phone', 'role', 'department',
            'section', 'college_year', 'student_id', 'avatar', 'avatar_url',
            'notifications_enabled', 'notification_sound', 'email_notifications',
            'dark_mode', 'auth_provider', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

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

    class Meta:
        model = User
        fields = [
            'name', 'username', 'email', 'phone', 'department',
            'section', 'college_year', 'college', 'password', 'confirm_password',
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
        
        # Domain validation against selected college
        college_id = self.initial_data.get('college')
        if college_id:
            from colleges.models import College
            try:
                college = College.objects.get(pk=college_id)
                domain = value.split('@')[-1]
                if college.email_domain.lower() not in domain.lower():
                    raise serializers.ValidationError(f"Please use your {college.name} email ({college.email_domain}).")
            except College.DoesNotExist:
                raise serializers.ValidationError("Invalid college selected.")
        
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
        user = User.objects.create_user(**validated_data)
        if username:
            user.username = username.lower()
            user.save(update_fields=['username'])
        return user


class LoginSerializer(serializers.Serializer):
    email    = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        identifier = data.get('email', '').strip()
        password   = data.get('password', '')

        if not identifier or not password:
            raise serializers.ValidationError({"detail": "Email/phone and password are required."})

        user = None
        cleaned_phone = re.sub(r'\D', '', identifier)
        if cleaned_phone.startswith('91') and len(cleaned_phone) == 12:
            cleaned_phone = cleaned_phone[2:]
        is_phone = len(cleaned_phone) == 10 and cleaned_phone[0] in '6789'

        if is_phone:
            for phone_val in [f"+91{cleaned_phone}", cleaned_phone]:
                try:
                    u = User.objects.get(phone=phone_val)
                    if u.check_password(password):
                        user = u
                        break
                except User.DoesNotExist:
                    continue
        else:
            email = identifier.lower()
            user = authenticate(username=email, password=password)
            if not user:
                try:
                    u = User.objects.get(email=email)
                    if u.check_password(password):
                        user = u
                except User.DoesNotExist:
                    pass

        if not user:
            raise serializers.ValidationError({"detail": "Invalid email/phone or password."})
        if not user.is_active:
            raise serializers.ValidationError({"detail": "Your account has been deactivated."})
        if user.is_blocked:
            raise serializers.ValidationError({"detail": "Your account is blocked. Contact administrator."})
        if user.college and not user.college.is_active:
            raise serializers.ValidationError({"detail": f"Logging into {user.college.name} is currently disabled."})

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


class AdminRegisterSerializer(serializers.Serializer):
    """
    Handles atomic registration of a new College AND its initial College Admin.
    """
    # College Info
    college_name = serializers.CharField(max_length=200)
    email_domain = serializers.CharField(max_length=100)
    
    # Admin Info
    name             = serializers.CharField(max_length=100)
    email            = serializers.EmailField()
    phone            = serializers.CharField(max_length=20)
    password         = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)
    admin_secret_key = serializers.CharField(write_only=True)

    def validate_admin_secret_key(self, value):
        from django.conf import settings
        secret = getattr(settings, 'ADMIN_SIGNUP_SECRET', 'admin123')
        if value != secret:
            raise serializers.ValidationError("Invalid admin secret key.")
        return value

    def validate_email(self, value):
        value = value.lower().strip()
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        
        domain = value.split('@')[-1]
        req_domain = self.initial_data.get('email_domain', '').lower()
        if req_domain and req_domain not in domain:
            raise serializers.ValidationError(f"Admin email must match the college domain ({req_domain}).")
        return value

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return data

    def create(self, validated_data):
        from colleges.models import College
        from django.db import transaction

        with transaction.atomic():
            # 1. Create College
            college = College.objects.create(
                name=validated_data['college_name'],
                email_domain=validated_data['email_domain']
            )

            # 2. Create Admin User
            user = User.objects.create_user(
                email=validated_data['email'].lower(),
                password=validated_data['password'],
                name=validated_data['name'],
                phone=validated_data['phone'],
                college=college,
                role='college_admin',
                is_verified=True,
                is_staff=True  # Allow access to Django admin if needed
            )
            return user