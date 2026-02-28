from rest_framework import permissions

class IsSuperAdmin(permissions.BasePermission):
    """Only Super Admin can manage colleges."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'super_admin'

class IsCollegeAdmin(permissions.BasePermission):
    """College Admin matches their own college."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'college_admin'

class IsModerator(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'moderator'

class IsAdminOrModerator(permissions.BasePermission):
    def has_permission(self, request, view):
        return (request.user.is_authenticated and 
                request.user.role in ['super_admin', 'college_admin', 'moderator'])

class IsCollegeUser(permissions.BasePermission):
    """Ensure user belongs to a college if required."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and (request.user.college is not None or request.user.role == 'super_admin')
