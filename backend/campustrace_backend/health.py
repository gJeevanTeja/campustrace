from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.db import connection
from django.utils import timezone

class HealthCheckView(APIView):
    """
    GET /api/health
    Checks if the server and database are running.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        health_data = {
            "status": "running",
            "timestamp": timezone.now().isoformat(),
            "database": "unknown",
            "environment": "production" if not getattr(request, 'DEBUG', False) else "development"
        }
        
        try:
            # Simple query to check DB connectivity
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            health_data["database"] = "connected"
            return Response(health_data, status=200)
        except Exception as e:
            health_data["database"] = "disconnected"
            health_data["error"] = str(e)
            return Response(health_data, status=503)
