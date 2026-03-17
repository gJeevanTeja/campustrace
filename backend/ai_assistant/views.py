import os
import requests
import re
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated


SYSTEM_PROMPT = (
    "You are CampusTrace AI assistant helping students report lost items, "
    "found items, claim items, and solve problems related to the CampusTrace application."
)

def is_telugu(text: str) -> bool:
    """Detect if the text contains Telugu characters."""
    # Telugu Unicode range: 0C00–0C7F
    return bool(re.search(r'[\u0c00-\u0c7f]', text))

def call_groq_chat(message: str, language: str = "en") -> str:
    """
    Call Groq LLM API with a CampusTrace-specific system prompt.
    Falls back to a friendly static response if the API is unavailable.
    """
    api_key = getattr(settings, "GROQ_API_KEY", os.getenv("GROQ_API_KEY", ""))
    if not api_key:
        return _fallback_response(message, language)

    try:
        print(f"[AI Assistant] Calling Groq with language={language}, message='{message[:50]}...'")
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        body = {
            "model": "llama3-8b-8192",
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": message},
            ],
            "temperature": 0.7,
            "max_tokens": 300,
        }
        resp = requests.post(url, headers=headers, json=body, timeout=12)
        resp.raise_for_status()
        reply = resp.json()["choices"][0]["message"]["content"].strip()
        print(f"[AI Assistant] Groq success. Reply: '{reply[:50]}...'")
        return reply
    except Exception as exc:
        print(f"[AI Assistant] Groq error: {exc}")
        return _fallback_response(message, language)


def _fallback_response(message: str, language: str) -> str:
    """Static fallback when Groq API is not reachable."""
    if language == "te":
        return "క్షమించండి, ప్రస్తుతం AI సేవ అందుబాటులో లేదు."
    return "Sorry, I cannot connect to the AI service right now."


class AIChatView(APIView):
    """
    POST /api/ai-assistant/chat
    Body:  { "message": "..." }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        message = (request.data.get("message") or "").strip()
        
        if not message:
            return Response(
                {"error": "message field is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 1. Detect language automatically
        language = "te" if is_telugu(message) else "en"
        print(f"[AI Assistant] POST request. Message='{message}', Detected Lang={language}")

        # 2. Call AI
        reply = call_groq_chat(message, language)
        
        return Response({"reply": reply}, status=status.HTTP_200_OK)
