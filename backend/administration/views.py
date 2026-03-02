from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth import get_user_model
import secrets
import string

from .models import AdminRequest
from .serializers import AdminRequestSerializer, AdminRequestActionSerializer
from colleges.models import College
from users.permissions import IsSuperAdmin

User = get_user_model()

from rest_framework.parsers import MultiPartParser, FormParser

class AdminRequestViewSet(viewsets.ModelViewSet):
    queryset = AdminRequest.objects.all()
    serializer_class = AdminRequestSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [IsSuperAdmin()]

    def perform_create(self, serializer):
        admin_req = serializer.save()
        
        # Notify Super Admins
        super_admins = User.objects.filter(role='super_admin', is_active=True)
        recipient_list = [sa.email for sa in super_admins]
        
        if recipient_list:
            try:
                send_mail(
                    subject='New Admin Access Request - CampusTrace',
                    message=(
                        f"A new admin request has been submitted.\n\n"
                        f"Name: {admin_req.full_name}\n"
                        f"College: {admin_req.college_name}\n"
                        f"Email: {admin_req.email}\n"
                        f"Phone: {admin_req.phone_number}\n\n"
                        f"Please login to the Super Admin dashboard to verify and approve."
                    ),
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=recipient_list,
                    fail_silently=True,
                )
            except Exception as e:
                print(f"Notification error: {e}")

    @action(detail=True, methods=['post'], permission_classes=[IsSuperAdmin])
    def approve(self, request, pk=None):
        if request.user.role != 'super_admin':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        admin_req = self.get_object()
        if admin_req.status != 'pending':
            return Response({'error': 'Request already processed.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                # 1. Get or Create College
                college, _ = College.objects.get_or_create(
                    name=admin_req.college_name,
                    defaults={'email_domain': admin_req.email.split('@')[-1]}
                )

                # 2. Get or Create User
                user, created = User.objects.get_or_create(
                    email=admin_req.email,
                    defaults={
                        'name': admin_req.full_name,
                        'phone': admin_req.phone_number,
                        'role': 'college_admin',
                        'college': college,
                        'is_active': True,
                        'is_verified': True
                    }
                )

                import secrets
                import string
                password = None
                if created:
                    password = ''.join(secrets.choice(string.ascii_letters + string.digits) for i in range(12))
                    user.set_password(password)
                else:
                    user.role = 'college_admin'
                    user.college = college
                    user.is_active = True
                
                user.save()

                admin_req.status = 'approved'
                admin_req.save()

                # Audit Log
                print(f"AUDIT: AdminRequest {admin_req.id} approved by {request.user.email}")

                # 3. Send Login Email (only if created or explicitly requested)
                # For brevity following the same pattern as before
                try:
                    temp_pass = password if created else "your existing account password"
                    send_mail(
                        subject='Welcome to CampusTrace Admin Panel',
                        message=(
                            f"Hi {user.name},\n\n"
                            f"Your request to manage {college.name} has been approved.\n\n"
                            f"Email: {user.email}\n"
                            f"Password: {temp_pass}\n\n"
                            f"Login: {settings.FRONTEND_URL}/login\n"
                        ),
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=[user.email],
                        fail_silently=True,
                    )
                except: pass

                return Response({'message': 'Admin approved successfully'})

        except Exception as e:
            import traceback
            print("APPROVAL ERROR:")
            print(traceback.format_exc())
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'], permission_classes=[IsSuperAdmin])
    def reject(self, request, pk=None):
        admin_req = self.get_object()
        if admin_req.status != 'pending':
            return Response({'error': 'Only pending requests can be rejected.'}, status=status.HTTP_400_BAD_REQUEST)

        admin_req.status = 'rejected'
        admin_req.save()

        # Rejection Email
        try:
            send_mail(
                subject='Update on your CampusTrace Admin Request',
                message=(
                    f"Hi {admin_req.full_name},\n\n"
                    f"Thank you for your interest in CampusTrace.\n"
                    f"Unfortunately, your request for admin access has been rejected at this time.\n\n"
                    f"If you believe this is an error, please contact us."
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[admin_req.email],
                fail_silently=True,
            )
        except: pass
        
        return Response({'message': 'Admin request rejected.'})
