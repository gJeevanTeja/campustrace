from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, LoginView, LogoutView,
    ProfileView, UploadAvatarView, ChangePasswordView,
    ForgotPasswordView, ResetPasswordView, UpdateLocationView,
    SettingsView, SendOTPView, VerifyOTPView, GoogleAuthView,
    CheckUsernameView, AdminUserListView, AdminUserActionView,
    AdminUserActivityView, LeaderboardView
)

urlpatterns = [
    # Standard auth
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),

    # Profile
    path('profile/', ProfileView.as_view(), name='profile'),
    path('avatar/', UploadAvatarView.as_view(), name='upload-avatar'),
    path('profile/avatar/', UploadAvatarView.as_view(), name='upload-avatar-alt'),

    # Password
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot-password'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset-password'),

    # Location & Settings
    path('update-location/', UpdateLocationView.as_view(), name='update-location'),
    path('settings/', SettingsView.as_view(), name='settings'),

    # OTP Login
    path('send-otp/', SendOTPView.as_view(), name='send-otp'),
    path('verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),

    # Google OAuth
    path('google/', GoogleAuthView.as_view(), name='google-auth'),

    # Username availability check
    path('check-username/', CheckUsernameView.as_view(), name='check-username'),

    # Admin User Management
    path('admin/users/', AdminUserListView.as_view(), name='admin-user-list'),
    path('admin/users/<int:pk>/<str:action>/', AdminUserActionView.as_view(), name='admin-user-action'),
    path('admin/users/<int:pk>/activity/', AdminUserActivityView.as_view(), name='admin-user-activity'),
    path('leaderboard/', LeaderboardView.as_view(), name='leaderboard'),
]