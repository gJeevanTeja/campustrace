import os
import io
import json
import google.generativeai as genai
from django.conf import settings
from PIL import Image
import requests

def get_gemini_model():
    api_key = getattr(settings, 'GEMINI_API_KEY', os.getenv('GEMINI_API_KEY'))
    if not api_key:
        return None
    try:
        genai.configure(api_key=api_key)
        return genai.GenerativeModel('gemini-1.5-flash')
    except Exception:
        return None

def call_groq_api(prompt):
    api_key = getattr(settings, 'GROQ_API_KEY', os.getenv('GROQ_API_KEY'))
    if not api_key:
        return None
    try:
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        data = {
            "model": "llama3-8b-8192",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.1
        }
        response = requests.post(url, headers=headers, json=data, timeout=7)
        response.raise_for_status()
        res_json = response.json()
        return res_json['choices'][0]['message']['content'].strip()
    except requests.exceptions.Timeout:
        from campustrace_backend.api_utils import log_event
        log_event("ai_timeout", {"service": "Groq", "prompt_len": len(prompt)}, level="warning")
        return None
    except Exception as e:
        from campustrace_backend.api_utils import log_event
        log_event("ai_error", {"service": "Groq", "error": str(e)}, level="error")
        return None

def generate_verification_questions(image_file, description=None, brand=None, color=None, unique_mark=None):
    """
    Takes a Django FieldFile (image) and metadata to generate 5 targeted ownership verification questions.
    """
    try:
        model = get_gemini_model()
        if not model:
            # Try Groq for text-only generation if image can't be processed
            groq_prompt = f"""
            Generate 5 ownership verification questions for a {brand or 'item'} that is {color or 'unknown color'}.
            Context: {description or 'lost item'}
            Unique Hidden Mark: {unique_mark or 'none'}
            Return only a JSON list of 5 questions.
            """
            groq_res = call_groq_api(groq_prompt)
            if groq_res:
                try:
                    # Extract list from potential markdown
                    if "[" in groq_res:
                        start = groq_res.find("[")
                        end = groq_res.rfind("]") + 1
                        return json.loads(groq_res[start:end])
                except:
                    pass
            raise ValueError("No AI models available")
        
        # Build context string
        context = []
        if description: context.append(f"Description: {description}")
        if brand: context.append(f"Brand: {brand}")
        if color: context.append(f"Color: {color}")
        if unique_mark: context.append(f"Private/Hidden Detail: {unique_mark}")
        
        context_str = "\n".join(context)

        # Load image via PIL
        image_bytes = image_file.read()
        pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        prompt = f"""
You are an intelligent AI ownership verification assistant for CampusTrace.
Your job is to verify whether a claimant is the real owner of the uploaded item.

CONTEXT PROVIDED BY FOUNDER:
{context_str}

STEP 1:
Carefully analyze the uploaded item image AND the provided context.
The context may contain "Private/Hidden Details" (e.g., a specific scratch inside the bag, a name written on the back) that are NOT visible in the photo.

STEP 2:
Generate EXACTLY 5 ownership verification questions.

IMPORTANT RULES:
1. Mix questions between VISUAL details from the photo and PRIVATE details from the provided context.
2. At least one question SHOULD target a "Private/Hidden Detail" if provided.
3. Questions must be specific and require unique knowledge of the item.
4. Do NOT reveal answers in the questions.
5. Return your output as a pure JSON list of exactly 5 strings.

Example: ["What color is the inner lining of the bag?", "Is there any text written near the charging port?", "What is the specific brand of the attached keychain?", "Are there any distinctive stickers on the back?", "What is the material of the strap?"]
        """
        
        response = model.generate_content([prompt, pil_img])
        
        # Clean the response text from any markdown code blocks
        raw_text = response.text.strip()
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:]
        if raw_text.startswith("```"):
            raw_text = raw_text[3:]
        if raw_text.endswith("```"):
            raw_text = raw_text[:-3]
            
        questions = json.loads(raw_text.strip())
        
        if not isinstance(questions, list) or len(questions) != 5:
            raise ValueError(f"AI returned invalid questions list size: {questions}")
            
        return questions
        
    except Exception as e:
        print(f"[AI Generate Questions Error] {e}")
        return [
            "What is the brand or make of this item?",
            "What is the exact color?",
            "Are there any unique identifying marks or scratches?",
            "What condition is the item in (new, used, damaged)?",
            "Are there any specific accessories included with it?"
        ]


def evaluate_single_answer(image_file, question, answer):
    """
    Takes the image, a single question, and the claimant's answer.
    Returns 1 if correct or 0 if incorrect.
    """
    try:
        model = get_gemini_model()
        
        # Reset file pointer if necessary
        if hasattr(image_file, 'seek'):
            image_file.seek(0)
            
        image_bytes = image_file.read()
        pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        prompt = f"""
Compare this user answer with the item image.

Question: {question}
User Answer: {answer}

Return only:
1 if correct
0 if incorrect
Be strict but allow minor wording variations.
"""
        response = model.generate_content([prompt, pil_img])
        
        raw_text = response.text.strip()
        # Clean any extra chars and grab the number
        if "1" in raw_text:
            return 1
        return 0
        
    except Exception as e:
        print(f"[AI Evaluate Single Answer Error] {e}")
        # If AI evaluation fails entirely, fallback to a 0
        return 0

def normalize_answer(text):
    """
    Lowercase, trim, and remove non-alphanumeric characters for flexible comparison.
    """
    import re
    if not text:
        return ""
    # Convert to string and handle potential non-string inputs
    text = str(text).lower().strip()
    return re.sub(r'[^a-z0-9]', '', text)

def compare_user_answer_to_founder(question, founder_answer, user_answer):
    """
    Compares the user's answer with the founder's answer.
    Returns graded score: 10 (exact), 7 (partial/semantic), 5 (related), or 0.
    """
    # 1. Try exact normalized match first
    norm_founder = normalize_answer(founder_answer)
    norm_user = normalize_answer(user_answer)
    
    if norm_founder == norm_user and norm_founder != "":
        return 10
        
    # 2. Try simple inclusion (e.g. "iPhone 13" vs "iPhone")
    if norm_user and norm_founder:
        if norm_user in norm_founder or norm_founder in norm_user:
            return 7
            
    # 3. Use AI for semantic comparison
    try:
        prompt = f"""
Compare these two answers to the same question for a lost item verification.
Determine how well the claimant's answer matches the founder's (ground truth).

Question: {question}
Founder's Answer: {founder_answer}
Claimant's Answer: {user_answer}

SCORING RULES:
- Return 10: If they are semantically identical (exact same meaning).
- Return 7: If the claimant's answer is correct but missing minor details or using different terminology.
- Return 5: If the claimant's answer is related or partially correct (e.g., mentions the right brand but wrong model).
- Return 0: If they are completely different or incorrect.

Return ONLY the number (10, 7, 5, or 0).
"""
        # Try Groq for faster text comparison
        raw_text = call_groq_api(prompt)
        
        if not raw_text:
            model = get_gemini_model()
            if model:
                response = model.generate_content(prompt)
                raw_text = response.text.strip()
        
        if raw_text:
            import re
            match = re.search(r'(10|7|5|0)', raw_text)
            if match:
                return int(match.group(1))
        
        return 0
    except Exception as e:
        print(f"[AI Compare Answers Error] {e}")
        return 0

