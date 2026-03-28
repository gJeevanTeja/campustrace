from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
import logging
import traceback
import sys

logger = logging.getLogger(__name__)

def custom_exception_handler(exc, context):
    # Call REST framework's default exception handler first,
    # to get the standard error response.
    response = exception_handler(exc, context)

    # Log to internal file for deep debugging
    try:
        with open('deep_debug_traceback.txt', 'a') as f:
            f.write("\n" + "="*50 + "\n")
            f.write(f"Exception: {str(exc)}\n")
            f.write(f"Context: {context.get('view').__class__.__name__ if context.get('view') else 'Unknown View'}\n")
            f.write("Full Traceback:\n")
            traceback.print_exc(file=f)
            f.write("\n" + "="*50 + "\n")
    except Exception:
        pass # Don't crash if logging fails

    # If DRF handled the error (e.g. 400 Bad Request, 401 Unauthorized, etc.)
    if response is not None:
        # Wrap the DRF response into our standard format
        if not isinstance(response.data, dict):
            # Case where data is a list of strings (rare in DRF)
            response.data = {"detail": response.data}
            
        # Standardize "detail" or "message" fields
        msg = response.data.get('detail') or response.data.get('message') or "Error processing request"
        
        response.data = {
            "success": False,
            "message": str(msg),
            "errors": response.data if response.status_code == 400 else None
        }
        return response

    # If an UNHANDLED error occurs (Internal Server Error)
    # This prevents the raw 500 error from reaching the frontend
    return Response({
        "success": False,
        "message": "An internal server error occurred. Please try again later.",
        "error": str(exc) if settings.DEBUG else "Internal Server Error"
    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
