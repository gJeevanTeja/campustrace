import csv
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.utils import timezone
from .utils import get_college_metrics, get_global_metrics
import openpyxl
from io import BytesIO

class CollegeAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not hasattr(request.user, 'college') or not request.user.college:
            return Response({"error": "User is not associated with a college"}, status=status.HTTP_400_BAD_REQUEST)
        
        metrics = get_college_metrics(request.user.college)
        return Response(metrics)

class GlobalAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'super_admin':
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        
        metrics = get_global_metrics()
        return Response(metrics)

class ExportAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        format_type = request.query_params.get('format', 'csv')
        
        if request.user.role == 'super_admin':
            metrics = get_global_metrics()
            filename = f"global_analytics_{timezone.now().strftime('%Y%m%d')}"
        else:
            if not request.user.college:
                return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
            metrics = get_college_metrics(request.user.college)
            filename = f"college_analytics_{timezone.now().strftime('%Y%m%d')}"

        if format_type == 'csv':
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="{filename}.csv"'
            writer = csv.writer(response)
            writer.writerow(['Metric', 'Value'])
            for key, value in metrics.items():
                if isinstance(value, list): continue # Skip complex data for simple CSV
                writer.writerow([key.replace('_', ' ').title(), value])
            return response

        elif format_type == 'excel':
            wb = openpyxl.Workbook()
            ws = wb.active
            ws.title = "Analytics Report"
            ws.append(['Metric', 'Value'])
            for key, value in metrics.items():
                if isinstance(value, list): continue
                ws.append([key.replace('_', ' ').title(), str(value)])
            
            output = BytesIO()
            wb.save(output)
            output.seek(0)
            
            response = HttpResponse(
                output.read(),
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            response['Content-Disposition'] = f'attachment; filename="{filename}.xlsx"'
            return response
            
        return Response({"error": "Invalid format"}, status=status.HTTP_400_BAD_REQUEST)
