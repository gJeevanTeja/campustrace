from rest_framework.views import APIView
from rest_framework.permissions import AllowAny

class TriggerErrorView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        raise ValueError("Simulated Internal Server Error for testing")
