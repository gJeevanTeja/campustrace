from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone

def standard_response(success, data=None, message="", status_code=200):
    """
    Standardized response format for all APIs.
    {
        "success": bool,
        "data": dict/list/None,
        "message": str
    }
    """
    return Response({
        "success": success,
        "data": data,
        "message": message
    }, status=status_code)

def error_response(message="Something went wrong", error=None, status_code=400):
    """
    Standardized error response format.
    """
    body = {
        "success": False,
        "message": message
    }
    if error:
        body["error"] = error
    return Response(body, status=status_code)

def log_event(event_name, details, level='info'):
    """
    Structured logging for critical events.
    """
    import logging
    import json
    logger = logging.getLogger('campustrace.events')
    
    log_data = {
        "event": event_name,
        "details": details,
        "timestamp": timezone.now().isoformat() if 'timezone' in globals() else None
    }
    
    if level == 'info':
        logger.info(json.dumps(log_data))
    elif level == 'error':
        logger.error(json.dumps(log_data))
    elif level == 'warning':
        logger.warning(json.dumps(log_data))
