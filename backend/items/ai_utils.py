import os
import io
import json
import google.generativeai as genai
from django.conf import settings
from PIL import Image

def get_gemini_model():
    api_key = getattr(settings, 'GEMINI_API_KEY', os.getenv('GEMINI_API_KEY'))
    if not api_key:
        raise ValueError("GEMINI_API_KEY is missing from Django settings or environment")
    genai.configure(api_key=api_key)
    return genai.GenerativeModel('gemini-1.5-flash')

def generate_verification_questions(image_file):
    """
    Takes a Django FieldFile (image) and uses Gemini 1.5 to generate 4 visual questions.
    Returns a list of 4 string questions.
    """
    try:
        model = get_gemini_model()
        
        # Load image via PIL
        image_bytes = image_file.read()
        pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        prompt = """
You are an intelligent AI ownership verification assistant.
Your job is to verify whether a claimant is the real owner of the uploaded item.

STEP 1:
Carefully analyze the uploaded item image.
Identify:
- What the item is (ID card, backpack, bottle, watch, laptop, helmet, etc.)
- All clearly visible details
- Text printed on the item
- Logos
- Colors
- Layout
- Unique physical features
- Damage or marks (if any)

STEP 2:
Generate EXACTLY 3 ownership verification questions.

IMPORTANT RULES:
1. Questions must be strictly based on visible details in THIS specific image.
2. Questions must be different depending on the item type.
3. Do NOT use generic template questions.
4. Do NOT ask vague questions.
5. Do NOT reveal answers.
6. Questions must require specific observation.
7. Avoid simple yes/no questions unless necessary.

Examples:
If item is an ID card: Ask about institution name, name printed on card, color of lanyard, placement of photo, layout structure.
If item is a backpack: Ask about logo text and its position, number of compartments, side mesh pockets, zipper placement.
If item is a bottle: Ask about cap type, printed brand text, material appearance.
If item is a watch: Ask about dial shape, strap type, number style on dial.

FINAL OUTPUT FORMAT:
Return your output as a pure JSON list of exactly 3 strings containing just the questions. No markdown formatting blocks or other text.
Example: ["What color is the zipper?", "Where is the logo located?", "Is there a scratch on the screen?"]
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
        
        if not isinstance(questions, list) or len(questions) != 3:
            raise ValueError(f"AI returned invalid questions list size: {questions}")
            
        return questions
        
    except Exception as e:
        print(f"[AI Generate Questions Error] {e}")
        # Fallback in case of AI quota/failure
        return [
            "What is the brand or make of this item?",
            "What is the exact color?",
            "Are there any unique identifying marks or scratches?"
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

