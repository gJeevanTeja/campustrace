import os
import django
from django.conf import settings
import razorpay

# Force load setup
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'unitrace.settings')
django.setup()

def validate_razorpay():
    print("--- Razorpay Configuration Validation ---")
    
    key_id = settings.RAZORPAY_KEY_ID
    key_secret = settings.RAZORPAY_KEY_SECRET
    
    print(f"Key ID: {key_id}")
    # Hide secret for security but show if it's the placeholder
    if key_secret == 'placeholder_secret':
        print("Key Secret: [PLACEHOLDER DETECTED]")
    else:
        print(f"Key Secret: {'*' * (len(key_secret)-4)}{key_secret[-4:] if len(key_secret) > 4 else '****'}")

    if key_id == 'rzp_test_placeholder' or key_secret == 'placeholder_secret':
        print("\n[WARNING] One or both Razorpay keys are placeholders. This will fail.")
        return

    try:
        client = razorpay.Client(auth=(key_id, key_secret))
        print("\nAttempting test order creation...")
        
        # Create a small test order
        order_data = {
            "amount": 100, # 1 rupee
            "currency": "INR",
            "payment_capture": "1"
        }
        order = client.order.create(data=order_data)
        print(f"[SUCCESS] Order created successfully. Order ID: {order['id']}")
        
    except Exception as e:
        print(f"\n[ERROR] Razorpay Authentication/Order Failed: {str(e)}")
        if "Authentication failed" in str(e):
            print("Action Required: Update RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env with valid credentials.")

if __name__ == "__main__":
    validate_razorpay()
