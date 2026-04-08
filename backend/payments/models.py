from django.db import models
from django.conf import settings
from items.models import Item

class RewardPayment(models.Model):
    STATUS_CHOICES = [
        ('created', 'Created'),
        ('paid', 'Paid (Escrow)'),
        ('held', 'Held in Escrow'),
        ('proof_pending', 'Proof Pending'),
        ('proof_verified', 'Proof Verified'),
        ('proof_rejected', 'Proof Rejected'),
        ('released', 'Completed (Released)'),
        ('cancelled', 'Cancelled'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]

    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='payments')
    payer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payments_made')
    payee = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payments_received')
    
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    commission = models.DecimalField(max_digits=10, decimal_places=2)
    finder_amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    razorpay_order_id = models.CharField(max_length=100, unique=True)
    razorpay_payment_id = models.CharField(max_length=100, blank=True, null=True)
    razorpay_signature = models.CharField(max_length=200, blank=True, null=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='created')
    
    # Proof fields
    return_proof = models.FileField(upload_to='proofs/', blank=True, null=True)
    proof_comment = models.TextField(blank=True, null=True)
    proof_uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, related_name='proofs_uploaded', blank=True, null=True)
    proof_uploaded_at = models.DateTimeField(blank=True, null=True)
    
    # RazorpayX Payout details
    payout_id = models.CharField(max_length=100, blank=True, null=True)
    payout_status = models.CharField(max_length=50, blank=True, null=True)
    released_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, related_name='payments_released', blank=True, null=True)
    released_at = models.DateTimeField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Payment for {self.item.title} - {self.status}"
